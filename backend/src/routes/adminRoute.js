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

// Middleware de autenticação aplicado seletivamente às rotas que requerem autenticação

// Rota para criar administrador (apenas Admin)
router.post('/admin', authenticated, authorizeRole(['Admin']), createAdminController);

// Rotas para gerenciar agentes (apenas Admin)
router.get('/agent', getAllAgentsController);
router.get('/agent/:agentId', authenticated, authorizeRole(['Admin']), getAgentByIdController);
router.post('/agent', createAgentController);
router.put('/agents/:agentId', authenticated, authorizeRole(['Admin']), updateAgentController);
router.delete('/agent/:agentId', authenticated, authorizeRole(['Admin']), deleteAgentController);

// Rotas para gerenciar clientes (apenas Admin)
router.get('/client', authenticated, authorizeRole(['Admin']), getAllClientsController);
router.get('/client/:clientId', authenticated, authorizeRole(['Admin']), getClientByIdController);
router.post('/client', authenticated, authorizeRole(['Admin']), createClientController);
router.put('/client/:clientId', authenticated, authorizeRole(['Admin']), updateClientController);
router.delete('/client/:clientId', authenticated, authorizeRole(['Admin']), deleteClientController);

// Rotas para gerenciar usuários (apenas Admin)
router.put('/user/:userId/status', authenticated, authorizeRole(['Admin']), toggleUserStatusController);
router.put('/user/:userId/role', authenticated, authorizeRole(['Admin']), changeUserRoleController);

// Rotas para gerenciar tickets (apenas Admin)
router.put('/ticket/:ticketId/reassign', authenticated, authorizeRole(['Admin']), reassignTicketController);
router.put('/ticket/:ticketId/close', authenticated, authorizeRole(['Admin']), closeOrCancelTicketController);

// Rotas para gerenciar categorias e configurações (apenas Admin)
router.post('/category', authenticated, authorizeRole(['Admin']), createCategoryController);
router.post('/template', authenticated, authorizeRole(['Admin']), createResponseTemplateController);
router.post('/sla', authenticated, authorizeRole(['Admin']), createSLAController);
router.put('/settings', authenticated, authorizeRole(['Admin']), updateSystemSettingsController);

// Rotas para relatórios e estatísticas (apenas Admin)
router.get('/status', authenticated, authorizeRole(['Admin']), getAdminStatisticsController);
router.get('/reports', authenticated, authorizeRole(['Admin']), getDetailedReportsController);

export default router;
