import {
	getAllSupabaseUsers,
	getSupabaseUserById,
	updateSupabaseUser,
	createSupabaseUser,
	deleteSupabaseUser
} from '../models/SupabaseUser.js';
import { userUpdateSchema, userSchema } from '../schemas/user.schema.js';
import { ZodError } from 'zod/v4';

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
				message: 'Invalid request body',
				errors: formatted,
			});
		}
	}

	try {
		// Registrar usuário no Supabase e no banco local
		const user = await createSupabaseUser(userData);
		return res.status(201).json(user);
	} catch (error) {
		console.error('Erro ao criar usuário:', error);
		
		// Retornar mensagem de erro específica
		if (error.message.includes('já está em uso')) {
			return res.status(400).json({ message: error.message });
		}
		
		return res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
	}
}

// Controller para listar todos os usuários
async function getAllUsersController(req, res) {
	try {
		const users = await getAllSupabaseUsers();
		return res.status(200).json(users);
	} catch (error) {
		console.error('Erro ao buscar usuários:', error);
		return res.status(500).json({ message: 'Erro ao buscar usuários' });
	}
}

// Controller para obter um usuário específico por ID
async function getUserByIdController(req, res) {
	try {
		const user = await getSupabaseUserById(parseInt(req.params.userId));

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
		const userId = parseInt(req.params.userId);
		
		// Atualizar usuário no Supabase e no banco local
		const user = await updateSupabaseUser(userId, userData);

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json(user);
	} catch (error) {
		console.error('Erro ao atualizar usuário:', error);
		return res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
	}
}


// Controller para deletar um usuário
async function deleteUserController(req, res) {
	try {
		const userId = parseInt(req.params.userId);
		
		// Deletar usuário no Supabase e no banco local
		await deleteSupabaseUser(userId);

		return res.status(204).send();
	} catch (error) {
		console.error('Erro ao deletar usuário:', error);
		
		// Retornar mensagem de erro específica
		if (error.message.includes('não encontrado')) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}
		
		return res.status(500).json({ message: 'Erro ao deletar usuário', error: error.message });
	}
}

export {
	getAllUsersController,
	getUserByIdController,
	updateUserController,
	createUserController,
	deleteUserController,
};