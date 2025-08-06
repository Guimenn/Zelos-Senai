/**
 * Rotas para gerenciamento de usuários
 * Operações CRUD básicas para administração de usuários do sistema
 */
import express from 'express';
import {
	getAllUsersController,
	getUserByIdController,
	updateUserController,
	createUserController,
	getMeController,
	getHomeController,
} from '../controllers/UsersController.js';
import authenticated from '../middlewares/authenticated.js';

const router = express.Router();

// Rota para obter dados da home do usuário logado
router.get('/home', authenticated, getHomeController);

// Rota para obter informações do usuário logado
router.get('/me', authenticated, getMeController);

// Rota para obter todos os usuários
router.get('/', getAllUsersController);

// Rota para obter um usuário específico por ID
router.get('/:userId', getUserByIdController);

// Rota para atualizar dados de um usuário
router.put('/:userId', updateUserController);

// Rota para criar um novo usuário
router.post('/', createUserController);

export default router;
