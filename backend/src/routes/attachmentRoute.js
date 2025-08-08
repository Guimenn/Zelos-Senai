import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import {
    upload,
    uploadAttachmentController,
    uploadMultipleAttachmentsController,
    downloadAttachmentController,
    viewAttachmentController,
    deleteAttachmentController,
    getTicketAttachmentsController,
    getCommentAttachmentsController
} from '../controllers/AttachmentController.js';
import { uploadErrorHandler } from '../middlewares/uploadErrorHandler.js';

const router = express.Router();

/**
 * Rotas para gerenciamento de anexos
 * Permite upload, download, visualização e exclusão de arquivos
 */

// Rota pública para visualizar anexos (necessário para exibir avatares sem header de autorização)
router.get('/view/:id', viewAttachmentController);

// Middleware de autenticação para as demais rotas
router.use(authenticated);

// Upload de anexo único
router.post('/upload', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    upload.single('file'), 
    uploadAttachmentController,
    uploadErrorHandler
);

// Upload de múltiplos anexos
router.post('/upload-multiple', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    upload.array('files', 5), // Máximo 5 arquivos
    uploadMultipleAttachmentsController,
    uploadErrorHandler
);

// Download de anexo
router.get('/download/:id', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    downloadAttachmentController
);

// Visualizar anexo (para imagens) - já definido como público acima

// Deletar anexo (apenas Admin e o criador do ticket/comentário)
router.delete('/:id', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    deleteAttachmentController
);

// Listar anexos de um ticket
router.get('/ticket/:ticketId', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    getTicketAttachmentsController
);

// Listar anexos de um comentário
router.get('/comment/:commentId', 
    authorizeRole(['Admin', 'Agent', 'Client']), 
    getCommentAttachmentsController
);

export default router; 