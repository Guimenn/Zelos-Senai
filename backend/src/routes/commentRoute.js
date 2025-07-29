/**
 * Rotas para gerenciamento de comentários
 * Operações CRUD para comentários dos tickets
 */
import express from 'express';
import {
    createCommentController,
    getTicketCommentsController,
    getCommentByIdController,
    updateCommentController,
    deleteCommentController,
} from '../controllers/CommentController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para comentários de tickets específicos
router.post('/tickets/:ticketId/comments', authorizeRole(['Admin', 'Agent', 'Client']), createCommentController);
router.get('/tickets/:ticketId/comments', authorizeRole(['Admin', 'Agent', 'Client']), getTicketCommentsController);

// Rotas para comentários individuais
router.get('/comments/:commentId', authorizeRole(['Admin', 'Agent', 'Client']), getCommentByIdController);
router.put('/comments/:commentId', authorizeRole(['Admin', 'Agent', 'Client']), updateCommentController);
router.delete('/comments/:commentId', authorizeRole(['Admin', 'Agent', 'Client']), deleteCommentController);

export default router; 