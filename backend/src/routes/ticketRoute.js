/**
 * Rotas para gerenciamento de tickets
 * Operações CRUD e funcionalidades específicas do sistema de helpdesk
 */
import express from 'express';
import {
    createTicketController,
    getAllTicketsController,
    getTicketByIdController,
    updateTicketController,
    assignTicketController,
    closeTicketController,
    deleteTicketController,
} from '../controllers/TicketController.js';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticated);

// Rotas para tickets
router.post('/', authorizeRole(['Admin', 'Agent', 'Client']), createTicketController);
router.get('/', authorizeRole(['Admin', 'Agent', 'Client']), getAllTicketsController);
router.get('/:ticketId', authorizeRole(['Admin', 'Agent', 'Client']), getTicketByIdController);
router.put('/:ticketId', authorizeRole(['Admin', 'Agent', 'Client']), updateTicketController);
router.delete('/:ticketId', authorizeRole(['Admin']), deleteTicketController);

// Rotas específicas para agentes e admins
router.post('/:ticketId/assign', authorizeRole(['Admin', 'Agent']), assignTicketController);
router.post('/:ticketId/close', authorizeRole(['Admin', 'Agent', 'Client']), closeTicketController);

// TODO: Rotas adicionais
// router.post('/:ticketId/reopen', authorizeRole(['Admin', 'Client']), reopenTicketController)
// router.post('/:ticketId/hold', authorizeRole(['Admin', 'Agent']), putOnHoldTicketController)

export default router; 