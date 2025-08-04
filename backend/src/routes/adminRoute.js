/**
 * Rotas administrativas do sistema
 * Gerencia operações CRUD para disciplinas, professores, alunos, turmas e estatísticas
 */
import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import { 
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	reassignTicketController,
	closeOrCancelTicketController,
	createResponseTemplateController,
	createSLAController,
	updateSystemSettingsController,
	getDetailedReportsController,
	createAdminController,
	updateAdminController,
	deleteAdminController,
	getAllAdminsController
} from '../controllers/AdminController.js';

import { createCategoryController } from '../controllers/CategoryController.js';

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
router.use(authenticateToken);

// Rotas para gerenciar administradores (apenas Admin)
router.get('/admins', authorizeRole(['Admin']), getAllAdminsController);
router.post('/admin', authorizeRole(['Admin']), createAdminController);
router.put('/admin/:userId', authorizeRole(['Admin']), updateAdminController);
router.delete('/admin/:userId', authorizeRole(['Admin']), deleteAdminController);

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

// Rotas para gerenciar configurações (apenas Admin)
router.post('/template', authorizeRole(['Admin']), createResponseTemplateController);
router.post('/sla', authorizeRole(['Admin']), createSLAController);
router.put('/settings', authorizeRole(['Admin']), updateSystemSettingsController);

// Rotas para relatórios e estatísticas (apenas Admin)
router.get('/status', authorizeRole(['Admin']), getAdminStatisticsController);
router.get('/reports', authorizeRole(['Admin']), getDetailedReportsController);

export default router;
