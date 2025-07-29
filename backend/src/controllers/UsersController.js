import {
	getAllUsers,
	getUserById,
	updateUser,
} from '../models/User.js';
import { userUpdateSchema } from '../schemas/user.schema.js';
import { ZodError } from 'zod/v4';

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
				message: 'Invalid request body',
				errors: formatted,
			});
		}
	}

	try {
		const user = await updateUser(parseInt(req.params.userId), userData);

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao atualizar usuário:', error);
		return res.status(500).json({ message: 'Erro ao atualizar usuário' });
	}
}


export {
	getAllUsersController,
	getUserByIdController,
	updateUserController,
};