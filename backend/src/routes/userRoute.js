/**
 * Rotas para gerenciamento de usuários
 * Operações CRUD básicas para administração de usuários do sistema
 */
import express from 'express';
import {
	getAllUsersController,
	getUserByIdController,
	updateUserController,
} from '../controllers/UsersController.js';

const router = express.Router();

// Rota para obter todos os usuários
router.get('/', getAllUsersController);

// Rota para obter um usuário específico por ID
router.get('/:userId', getUserByIdController);

// Rota para atualizar dados de um usuário
router.put('/:userId', updateUserController);

export default router;
