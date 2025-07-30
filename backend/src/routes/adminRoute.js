/**
 * Rotas administrativas do sistema
 * Gerencia operações CRUD para disciplinas, professores, alunos, turmas e estatísticas
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import { getAdminStatisticsController } from '../controllers/AdminController.js';

import {
	getAllAgentsController,
	getAgentByIdController,
	createAgentController,
	updateAgentController,
	deleteAgentController,
} from '../controllers/AgentController.js';

import {
	getAllClientsController,
	getClientByIdController,
	createClientController,
	updateClientController,
	deleteClientController,
} from '../controllers/ClientController.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas de admin
router.use(authenticated);

// Rotas para gerenciar agentes (apenas Admin)
router.get('/agent', authorizeRole(['Admin']), getAllAgentsController);
router.get('/agent/:agentId', authorizeRole(['Admin']), getAgentByIdController);
router.post('/agent', authorizeRole(['Admin']), createAgentController);
router.put('/agents/:agentId', authorizeRole(['Admin']), updateAgentController);

// Rotas para gerenciar clientes (apenas Admin)
router.get('/client', authorizeRole(['Admin']), getAllClientsController);
router.get('/client/:clientId', authorizeRole(['Admin']), getClientByIdController);
router.post('/client', authorizeRole(['Admin']), createClientController);
router.put('/client/:clientId', authorizeRole(['Admin']), updateClientController);
router.delete('/client/:clientId', authorizeRole(['Admin']), deleteClientController);

// Rota para obter as estatísticas do admin (apenas Admin)
router.get('/status', authorizeRole(['Admin']), getAdminStatisticsController);

export default router;
