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
	changeUserPasswordController,
	reassignTicketController,
	closeOrCancelTicketController,
	createCategoryController,
	createResponseTemplateController,
	createSLAController,
	updateSystemSettingsController,
	getDetailedReportsController,
    createAdminController,
    getAllAdminsController,
    getAdminByIdController,
    deleteAdminController,
    rateTicketAsAdminController,
    createAgentEvaluationController,
    getAgentEvaluationsController,
    getAgentEvaluationStatsController,
    getAllAgentsWithEvaluationsController,
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

import {
	updateUserController,
} from '../controllers/UsersController.js';

const router = express.Router();

// Middleware de autenticação aplicado seletivamente às rotas que requerem autenticação

// Rota para criar administrador (apenas Admin)
router.post('/admin', authenticated, authorizeRole(['Admin']), createAdminController);

// Rota para listar administradores (apenas Admin)
router.get('/admins', authenticated, authorizeRole(['Admin']), getAllAdminsController);

// Rota para obter um administrador específico (apenas Admin)
router.get('/admin/:adminId', authenticated, authorizeRole(['Admin']), getAdminByIdController);

// Rota para excluir um administrador (apenas Admin)
router.delete('/admin/:adminId', authenticated, authorizeRole(['Admin']), deleteAdminController);

// Rotas para gerenciar agentes (apenas Admin)
router.get('/agent', getAllAgentsController);
router.get('/agent/:agentId', authenticated, authorizeRole(['Admin']), getAgentByIdController);
router.post('/agent', createAgentController);
router.put('/agent/:agentId', authenticated, authorizeRole(['Admin']), updateAgentController);
router.delete('/agent/:agentId', authenticated, authorizeRole(['Admin']), deleteAgentController);

// Rotas para gerenciar clientes
// Listagem e visualização: Admin e Agent (técnico)
router.get('/client', authenticated, authorizeRole(['Admin', 'Agent']), getAllClientsController);
router.get('/client/:clientId', authenticated, authorizeRole(['Admin', 'Agent']), getClientByIdController);
router.post('/client', authenticated, authorizeRole(['Admin']), createClientController);
router.put('/client/:clientId', authenticated, authorizeRole(['Admin']), updateClientController);
router.delete('/client/:clientId', authenticated, authorizeRole(['Admin']), deleteClientController);

// Rotas para gerenciar usuários (apenas Admin)
router.put('/user/:userId', authenticated, authorizeRole(['Admin']), updateUserController);
router.put('/user/:userId/status', authenticated, authorizeRole(['Admin']), toggleUserStatusController);
router.put('/user/:userId/role', authenticated, authorizeRole(['Admin']), changeUserRoleController);
router.put('/user/:userId/password', authenticated, authorizeRole(['Admin']), changeUserPasswordController);

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

// Rota para admin avaliar tickets (apenas Admin)
router.post('/ticket/:ticketId/rate', authenticated, authorizeRole(['Admin']), rateTicketAsAdminController);

// Rotas para avaliação de agentes (apenas Admin)
router.post('/agent/:agentId/evaluate', authenticated, authorizeRole(['Admin']), createAgentEvaluationController);
router.get('/agent/:agentId/evaluations', authenticated, authorizeRole(['Admin']), getAgentEvaluationsController);
router.get('/agent/:agentId/evaluation-stats', authenticated, authorizeRole(['Admin']), getAgentEvaluationStatsController);
router.get('/agents/evaluations', authenticated, authorizeRole(['Admin']), getAllAgentsWithEvaluationsController);

export default router;
