/**
 * Rotas específicas para o Agent (Técnico)
 * Funcionalidades específicas para o técnico responsável por executar os serviços de manutenção
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import {
    getMyAssignedTicketsController,
    updateTicketStatusController,
    updateTicketWithReportController,
    addTechnicalCommentController,
    requestAdditionalInfoController,
    getMyTicketHistoryController,
    getMyStatisticsController,
    getAvailableTicketsController,
    acceptTicketController,
    getMyEvaluationsController,
    getMyEvaluationStatsController,
} from '../controllers/AgentController.js';

import {
    getTicketByIdController,
} from '../controllers/TicketController.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticated);

// Rotas específicas para Agent (Técnico)
router.get('/my-tickets', authorizeRole(['Agent']), getMyAssignedTicketsController);
router.get('/my-history', authorizeRole(['Agent']), getMyTicketHistoryController);
router.get('/my-statistics', authorizeRole(['Agent']), getMyStatisticsController);
router.get('/available-tickets', authorizeRole(['Agent']), getAvailableTicketsController);

// Rotas para gerenciar tickets atribuídos
router.get('/ticket/:ticketId', authorizeRole(['Agent']), getTicketByIdController);
router.put('/ticket/:ticketId/status', authorizeRole(['Agent']), updateTicketStatusController);
router.put('/tickets/:ticketId/update', authorizeRole(['Agent']), updateTicketWithReportController);
router.post('/ticket/:ticketId/comment', authorizeRole(['Agent']), addTechnicalCommentController);
router.post('/ticket/:ticketId/request-info', authorizeRole(['Agent']), requestAdditionalInfoController);

// Nova rota para aceitar tickets disponíveis
router.post('/ticket/:ticketId/accept', authorizeRole(['Agent']), acceptTicketController);

// Rotas para avaliações de performance
router.get('/my-evaluations', authorizeRole(['Agent']), getMyEvaluationsController);
router.get('/my-evaluation-stats', authorizeRole(['Agent']), getMyEvaluationStatsController);

export default router;