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
	updateMeController,
} from '../controllers/UsersController.js';
import authenticated from '../middlewares/authenticated.js';
import prisma from '../../prisma/client.js';

const router = express.Router();

// Rota para obter dados da home do usuário logado
router.get('/home', authenticated, getHomeController);

// Rota para obter informações do usuário logado
router.get('/me', authenticated, getMeController);
// Rota para o próprio usuário atualizar seus dados
router.put('/me', authenticated, updateMeController);

// Rota para obter todos os usuários
router.get('/', getAllUsersController);

// Rota para obter um usuário específico por ID
router.get('/:userId', getUserByIdController);

// Rota para atualizar dados de um usuário
router.put('/:userId', updateUserController);

// Rota para criar um novo usuário
router.post('/', createUserController);

// Preferências de notificação do usuário logado
router.get('/me/notification-preferences', authenticated, async (req, res) => {
  try {
    const pref = await prisma.notificationPreference.findUnique({ where: { user_id: req.user.id } });
    return res.status(200).json(pref || { email_enabled: false, push_enabled: false, matrix: null });
  } catch (e) {
    console.error('Erro ao obter preferências de notificação:', e);
    return res.status(500).json({ message: 'Erro ao obter preferências de notificação' });
  }
});

router.put('/me/notification-preferences', authenticated, async (req, res) => {
  try {
    const { email_enabled = false, push_enabled = false, matrix = null } = req.body || {};
    const pref = await prisma.notificationPreference.upsert({
      where: { user_id: req.user.id },
      update: { email_enabled, push_enabled, matrix },
      create: { user_id: req.user.id, email_enabled, push_enabled, matrix },
    });
    return res.status(200).json(pref);
  } catch (e) {
    console.error('Erro ao salvar preferências de notificação:', e);
    return res.status(500).json({ message: 'Erro ao salvar preferências de notificação' });
  }
});

export default router;
