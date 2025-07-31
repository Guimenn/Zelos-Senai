/**
 * Rotas administrativas do sistema
 * Gerencia operações CRUD para disciplinas, professores, alunos, turmas e estatísticas
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import { 
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	reassignTicketController,
	closeOrCancelTicketController,
	createCategoryController,
	createResponseTemplateController,
	createSLAController,
	updateSystemSettingsController,
	getDetailedReportsController,
	createAdminController,
} from '../controllers/AdminController.js';

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

// Rota para criar administrador (apenas Admin)
router.post('/admin', authorizeRole(['Admin']), createAdminController);

// Rotas para gerenciar agentes (apenas Admin)
router.get('/agent', authorizeRole(['Admin']), getAllAgentsController);
router.get('/agent/:agentId', authorizeRole(['Admin']), getAgentByIdController);
router.post('/agent', authorizeRole(['Admin']), createAgentController);
router.put('/agents/:agentId', authorizeRole(['Admin']), updateAgentController);
router.delete('/agent/:agentId', authorizeRole(['Admin']), deleteAgentController);

// Rotas para gerenciar clientes (apenas Admin)
router.get('/client', authorizeRole(['Admin']), getAllClientsController);
router.get('/client/:clientId', authorizeRole(['Admin']), getClientByIdController);
router.post('/client', authorizeRole(['Admin']), createClientController);
router.put('/client/:clientId', authorizeRole(['Admin']), updateClientController);
router.delete('/client/:clientId', authorizeRole(['Admin']), deleteClientController);

// Rotas para gerenciar usuários (apenas Admin)
router.put('/user/:userId/status', authorizeRole(['Admin']), toggleUserStatusController);
router.put('/user/:userId/role', authorizeRole(['Admin']), changeUserRoleController);

// Rotas para gerenciar tickets (apenas Admin)
router.put('/ticket/:ticketId/reassign', authorizeRole(['Admin']), reassignTicketController);
router.put('/ticket/:ticketId/close', authorizeRole(['Admin']), closeOrCancelTicketController);

// Rotas para gerenciar categorias e configurações (apenas Admin)
router.post('/category', authorizeRole(['Admin']), createCategoryController);
router.post('/template', authorizeRole(['Admin']), createResponseTemplateController);
router.post('/sla', authorizeRole(['Admin']), createSLAController);
router.put('/settings', authorizeRole(['Admin']), updateSystemSettingsController);

// Rotas para relatórios e estatísticas (apenas Admin)
router.get('/status', authorizeRole(['Admin']), getAdminStatisticsController);
router.get('/reports', authorizeRole(['Admin']), getDetailedReportsController);

export default router;
