/**
 * Rotas para gerenciamento de agentes
 * Operações CRUD e funcionalidades específicas para agentes de suporte
 */
import express from 'express';
import {
    createAgentController,
    getAllAgentsController,
    getAgentByIdController,
    updateAgentController,
    deleteAgentController,
    getAgentStatsController,
    getAgentActiveTicketsController,
} from '../controllers/AgentController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para agentes (apenas Admin pode criar/editar/deletar)
router.post('/', authorizeRole(['Admin']), createAgentController);
router.get('/', authorizeRole(['Admin', 'Agent']), getAllAgentsController);
router.get('/:agentId', authorizeRole(['Admin', 'Agent']), getAgentByIdController);
router.put('/:agentId', authorizeRole(['Admin']), updateAgentController);
router.delete('/:agentId', authorizeRole(['Admin']), deleteAgentController);

// Rotas para estatísticas e tickets ativos
router.get('/:agentId/stats', authorizeRole(['Admin', 'Agent']), getAgentStatsController);
router.get('/:agentId/tickets/active', authorizeRole(['Admin', 'Agent']), getAgentActiveTicketsController);

export default router; 