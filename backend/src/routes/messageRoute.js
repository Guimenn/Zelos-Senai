/**
 * Rotas para gerenciamento de mensagens do chat
 * Sistema de chat em tempo real entre criador e técnico do chamado
 */
import express from 'express';
import {
    sendMessageController,
    getMessagesController,
    uploadAttachmentController,
    editMessageController,
    deleteMessageController,
    getUnreadCountController,
} from '../controllers/MessageController.js';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticated);

// Rotas para mensagens
router.post('/send', authorizeRole(['Admin', 'Agent', 'Client']), sendMessageController);
router.get('/list', authorizeRole(['Admin', 'Agent', 'Client']), getMessagesController);
router.get('/unread-count', authorizeRole(['Admin', 'Agent', 'Client']), getUnreadCountController);
router.post('/upload', authorizeRole(['Admin', 'Agent', 'Client']), uploadAttachmentController);
router.put('/:id', authorizeRole(['Admin', 'Agent', 'Client']), editMessageController);
router.delete('/:id', authorizeRole(['Admin', 'Agent', 'Client']), deleteMessageController);

export default router;
