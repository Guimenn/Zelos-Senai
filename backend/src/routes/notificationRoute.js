/**
 * Rotas para gerenciamento de notificações
 * Permite visualizar, marcar como lida, arquivar notificações e obter estatísticas
 */
import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';

import {
    getMyNotificationsController,
    getUnreadCountController,
    markAsReadController,
    markAllAsReadController,
    archiveNotificationController,
    cleanupNotificationsController,
    connectWebSocketController,
    sendTestNotificationController,
    getNotificationStatsController,
} from '../controllers/NotificationController.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticated);

// ===== ROTAS PARA TODOS OS USUÁRIOS AUTENTICADOS =====

// Obter notificações do usuário logado
router.get('/my-notifications', getMyNotificationsController);

// Obter contagem de notificações não lidas
router.get('/unread-count', getUnreadCountController);

// Marcar notificação específica como lida
router.put('/:notificationId/read', markAsReadController);

// Marcar todas as notificações como lidas
router.put('/mark-all-read', markAllAsReadController);

// Arquivar notificação específica
router.put('/:notificationId/archive', archiveNotificationController);

// Endpoint para conexão WebSocket (informativo)
router.get('/ws-info', connectWebSocketController);

// ===== ROTAS APENAS PARA ADMINISTRADORES =====

// Limpar notificações antigas
router.delete('/cleanup', authorizeRole(['Admin']), cleanupNotificationsController);

// Obter estatísticas de notificações
router.get('/stats', authorizeRole(['Admin']), getNotificationStatsController);

// Enviar notificação de teste (desenvolvimento)
router.post('/test', authorizeRole(['Admin']), sendTestNotificationController);

export default router;
