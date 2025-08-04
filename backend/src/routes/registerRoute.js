/**
 * Rotas de registro de usuários
 * Gerencia o registro de novos usuários no sistema
 */
import express from 'express';
import { registerController } from '../controllers/RegisterController.js';

const router = express.Router();

// Rota para registro de novos usuários
router.post('/', registerController);

export default router;