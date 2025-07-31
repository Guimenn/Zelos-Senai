/**
 * Rotas específicas para o Client (Profissional)
 * Funcionalidades específicas para o funcionário da escola que relata problemas
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import {
    getMyTicketsController,
    getMyTicketHistoryController,
    rateTicketController,
    addPublicCommentController,
    getMyStatisticsController,
} from '../controllers/ClientController.js';

import {
    createTicketController,
    getTicketByIdController,
} from '../controllers/TicketController.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticated);

// Rotas específicas para Client (Profissional)
router.get('/my-tickets', authorizeRole(['Client']), getMyTicketsController);
router.get('/my-history', authorizeRole(['Client']), getMyTicketHistoryController);
router.get('/my-statistics', authorizeRole(['Client']), getMyStatisticsController);

// Rotas para tickets
router.post('/ticket', authorizeRole(['Client']), createTicketController);
router.get('/ticket/:ticketId', authorizeRole(['Client']), getTicketByIdController);

// Rotas para interação com tickets
router.post('/ticket/:ticketId/rate', authorizeRole(['Client']), rateTicketController);
router.post('/ticket/:ticketId/comment', authorizeRole(['Client']), addPublicCommentController);

export default router; 