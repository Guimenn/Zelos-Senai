/**
 * Rotas de autenticação e autorização
 * Gerencia login, perfil do usuário, recuperação e redefinição de senha
 */
import express from 'express';
import { loginController, recoveryController, newPasswordController, logoutController } from '../controllers/LoginController.js';
import { meController } from '../controllers/MeController.js';
import authenticated from '../middlewares/authenticated.js';

const router = express.Router();

// Rota para login do usuário
router.post('/', loginController);
// Rota para obter perfil do usuário autenticado
router.get('/', authenticated, meController);
// Rota para solicitar recuperação de senha
router.post('/recovery', recoveryController);
// Rota para definir nova senha
router.put('/new-password', newPasswordController);
// Rota para logout
router.post('/logout', logoutController);

export default router;
