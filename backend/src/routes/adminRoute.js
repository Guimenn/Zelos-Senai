/**
 * Rotas administrativas do sistema
 * Gerencia operações CRUD para disciplinas, professores, alunos, turmas e estatísticas
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import authorizeAdminMaster from '../middlewares/authorizeAdminMaster.js';

import {
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	changeUserPasswordController,
	getDetailedReportsController,
	getAllAdminsController,
	createAdminController,
	deleteAdminController,
	getAdminByIdController,
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
router.get('/admins', authenticated, authorizeRole(['Admin']), getAllAdminsController);
router.get('/admin/:adminId', authenticated, authorizeRole(['Admin']), getAdminByIdController);

// Rota temporária sem middleware para teste
router.get('/test-admin/:adminId', getAdminByIdController);
router.post('/admin', authenticated, authorizeAdminMaster, createAdminController);
router.delete('/admins/:adminId', authenticated, authorizeAdminMaster, deleteAdminController);
router.put('/user/:userId', authenticated, authorizeRole(['Admin']), updateUserController);
router.put('/user/:userId/status', authenticated, authorizeRole(['Admin']), toggleUserStatusController);
router.put('/user/:userId/role', authenticated, authorizeRole(['Admin']), changeUserRoleController);
router.put('/user/:userId/password', authenticated, authorizeRole(['Admin']), changeUserPasswordController);



// Rotas para relatórios e estatísticas (apenas Admin)
router.get('/status', authenticated, authorizeRole(['Admin']), getAdminStatisticsController);
router.get('/reports', authenticated, authorizeRole(['Admin']), getDetailedReportsController);



export default router;
