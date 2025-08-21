import {
	getAllUsers,
	getUserById,
	updateUser,
	createUser,
} from '../models/User.js';
import { userUpdateSchema, userSchema } from '../schemas/user.schema.js';
import { ZodError } from 'zod/v4';
import {
	getSystemStatistics,
	getAgentHomeData,
	getClientHomeData,
} from '../models/Statistics.js';
import notificationService from '../services/NotificationService.js';
import prisma from '../../prisma/client.js';

// Controller para criar um novo usuário
async function createUserController(req, res) {
	let userData;

	try {
		userData = userSchema.parse(req.body);
	} catch (error) {
		if (error instanceof ZodError) {
			const formatted = error['issues'].map((err) => ({
				path: err.path.join('.'),
				message: err.message,
			}));

			return res.status(400).json({
				message: 'Corpo da requisição inválido',
				errors: formatted,
			});
		}
	}

	try {
		const user = await createUser(userData);
		return res.status(201).json(user);
	} catch (error) {
		console.error('Erro ao criar usuário:', error);
		return res.status(500).json({ message: 'Erro ao criar usuário' });
	}
}

// Controller para listar todos os usuários
async function getAllUsersController(req, res) {
	try {
		const users = await getAllUsers();
		return res.status(200).json(users);
	} catch (error) {
		console.error('Erro ao buscar usuários:', error);
		return res.status(500).json({ message: 'Erro ao buscar usuários' });
	}
}

// Controller para obter um usuário específico por ID
async function getUserByIdController(req, res) {
	try {
		const user = await getUserById(parseInt(req.params.userId));

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao buscar usuário:', error);
		return res.status(500).json({ message: 'Erro ao buscar usuário' });
	}
}

// Controller para atualizar um usuário
async function updateUserController(req, res) {
	let userData;

	try {
		userData = userUpdateSchema.parse(req.body);
	} catch (error) {
		if (error instanceof ZodError) {
			const formatted = error['issues'].map((err) => ({
				path: err.path.join('.'),
				message: err.message,
			}));

			return res.status(400).json({
				message: 'Corpo da requisição inválido',
				errors: formatted,
			});
		}
	}

	try {
        const targetUserId = parseInt(req.params.userId);
        const user = await updateUser(targetUserId, userData);

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

        // Se admin alterou senha deste usuário, notificar
        try {
            if (req.user && req.user.role === 'Admin' && userData && Object.prototype.hasOwnProperty.call(userData, 'password')) {
                await notificationService.notifyPasswordChanged(targetUserId, 'Administrador');
            }
        } catch (e) {
            console.error('Erro ao notificar mudança de senha pelo administrador:', e);
        }

		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao atualizar usuário:', error);
		return res.status(500).json({ message: 'Erro ao atualizar usuário' });
	}
}

// Controller para obter informações do usuário logado
async function getMeController(req, res) {
	try {
		// O middleware authenticated já adicionou as informações do usuário em req.user
		const userId = req.user.id;
		
		// Buscar informações completas do usuário
		const user = await getUserById(userId);

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao buscar informações do usuário:', error);
		return res.status(500).json({ message: 'Erro ao buscar informações do usuário' });
	}
}

// Controller para a rota /home
async function getHomeController(req, res) {
	try {
		const { user } = req;
		let homeData;

		switch (user.role) {
			case 'Admin':
				homeData = await getSystemStatistics();
				break;
			case 'Agent':
				if (!user.agent || !user.agent.id) {
					return res.status(400).json({ message: 'Dados do agente não encontrados.' });
				}
				homeData = await getAgentHomeData(user.agent.id, user.id);
				break;
			case 'Client':
				if (!user.client || !user.client.id) {
					return res.status(400).json({ message: 'Dados do cliente não encontrados.' });
				}
				homeData = await getClientHomeData(user.client.id);
				break;
			default:
				return res.status(403).json({ message: 'Role de usuário não tem uma home definida.' });
		}

		return res.status(200).json(homeData);

	} catch (error) {
		console.error(`Erro ao buscar dados da home para ${req.user.role}:`, error);
		return res.status(500).json({ message: 'Erro interno ao processar sua solicitação.' });
	}
}

// Controller para o próprio usuário atualizar seus dados básicos e de perfil
async function updateMeController(req, res) {
	try {
		const userId = req.user.id;
		const { name, email, phone, avatar, department, address, position } = req.body || {};

		// Atualizar dados básicos do usuário (opcionais)
		const userData = {};
		if (name !== undefined) userData.name = name;
		if (email !== undefined) userData.email = email;
		if (phone !== undefined) userData.phone = phone;
		if (avatar !== undefined) userData.avatar = avatar;
		if (address !== undefined) userData.address = address;

		if (Object.keys(userData).length > 0) {
			await prisma.user.update({ where: { id: userId }, data: userData });
		}

		// Atualizar dados relacionados ao perfil conforme a role
		if (req.user.role === 'Agent') {
			const agent = await prisma.agent.findUnique({ where: { user_id: userId } });
			if (agent) {
				const agentData = {};
				if (department !== undefined) agentData.department = department;
				if (Object.keys(agentData).length > 0) {
					await prisma.agent.update({ where: { id: agent.id }, data: agentData });
				}
			}
		} else if (req.user.role === 'Client') {
			const client = await prisma.client.findUnique({ where: { user_id: userId } });
			if (client) {
				const clientData = {};
				if (address !== undefined) clientData.address = address;
				if (department !== undefined) clientData.department = department;
				if (position !== undefined) clientData.position = position;
				if (Object.keys(clientData).length > 0) {
					await prisma.client.update({ where: { id: client.id }, data: clientData });
				}
			}
		}

		const user = await getUserById(userId);
		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao atualizar dados do próprio usuário:', error);
		return res.status(500).json({ message: 'Erro ao atualizar seus dados' });
	}
}

export {
	createUserController,
	getAllUsersController,
	getUserByIdController,
	updateUserController,
	getMeController,
	getHomeController,
	updateMeController,
};