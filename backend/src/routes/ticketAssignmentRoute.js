import express from 'express';
import {
    createAssignmentRequestsController,
    getPendingRequestsController,
    acceptAssignmentRequestController,
    rejectAssignmentRequestController,
    getTicketAssignmentRequestsController
} from '../controllers/TicketAssignmentController.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeRole from '../middlewares/authorizeRole.js';

const router = express.Router();

// Rota para criar solicitações de atribuição (chamada automaticamente quando um ticket é criado)
router.post('/tickets/:ticket_id/assignment-requests', 
    authenticateToken, 
    authorizeRole(['Admin', 'Agent']), 
    createAssignmentRequestsController
);

// Rota para agentes listarem suas solicitações pendentes
router.get('/agent/pending-requests', 
    authenticateToken, 
    authorizeRole(['Agent']), 
    getPendingRequestsController
);

// Rota para agentes aceitarem uma solicitação
router.put('/assignment-requests/:request_id/accept', 
    authenticateToken, 
    authorizeRole(['Agent']), 
    acceptAssignmentRequestController
);

// Rota para agentes recusarem uma solicitação
router.put('/assignment-requests/:request_id/reject', 
    authenticateToken, 
    authorizeRole(['Agent']), 
    rejectAssignmentRequestController
);

// Rota para admins listarem todas as solicitações de um ticket
router.get('/tickets/:ticket_id/assignment-requests', 
    authenticateToken, 
    authorizeRole(['Admin']), 
    getTicketAssignmentRequestsController
);

export default router;
