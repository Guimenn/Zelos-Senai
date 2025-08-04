import { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    archiveNotification,
    getUnreadNotificationsCount,
    cleanupOldNotifications
} from '../models/Notification.js';
import notificationService from '../services/NotificationService.js';

/**
 * Controller para gerenciar notificações
 * Responsável por processar requisições relacionadas a notificações
 */

/**
 * Obtém notificações do usuário logado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getMyNotificationsController(req, res) {
    try {
        const userId = req.user.id;
        const {
            unread_only = false,
            include_archived = false,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await getUserNotifications(userId, {
            unreadOnly: unread_only === 'true',
            includeArchived: include_archived === 'true',
            limit: parseInt(limit),
            offset
        });

        // Contar total para paginação
        const totalCount = await getUnreadNotificationsCount(userId);

        return res.status(200).json({
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar notificações',
            error: error.message 
        });
    }
}

/**
 * Obtém contagem de notificações não lidas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getUnreadCountController(req, res) {
    try {
        const userId = req.user.id;
        const count = await getUnreadNotificationsCount(userId);

        return res.status(200).json({ unread_count: count });
    } catch (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        return res.status(500).json({ 
            message: 'Erro ao contar notificações não lidas',
            error: error.message 
        });
    }
}

/**
 * Marca uma notificação como lida
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function markAsReadController(req, res) {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notification = await markNotificationAsRead(
            parseInt(notificationId), 
            userId
        );

        return res.status(200).json({
            message: 'Notificação marcada como lida',
            notification
        });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        
        if (error.message.includes('não encontrada')) {
            return res.status(404).json({ 
                message: 'Notificação não encontrada',
                error: error.message 
            });
        }

        return res.status(500).json({ 
            message: 'Erro ao marcar notificação como lida',
            error: error.message 
        });
    }
}

/**
 * Marca todas as notificações como lidas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function markAllAsReadController(req, res) {
    try {
        const userId = req.user.id;
        const result = await markAllNotificationsAsRead(userId);

        return res.status(200).json({
            message: `${result.updated} notificações marcadas como lidas`,
            updated: result.updated
        });
    } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return res.status(500).json({ 
            message: 'Erro ao marcar todas as notificações como lidas',
            error: error.message 
        });
    }
}

/**
 * Arquiva uma notificação
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function archiveNotificationController(req, res) {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notification = await archiveNotification(
            parseInt(notificationId), 
            userId
        );

        return res.status(200).json({
            message: 'Notificação arquivada',
            notification
        });
    } catch (error) {
        console.error('Erro ao arquivar notificação:', error);
        
        if (error.message.includes('não encontrada')) {
            return res.status(404).json({ 
                message: 'Notificação não encontrada',
                error: error.message 
            });
        }

        return res.status(500).json({ 
            message: 'Erro ao arquivar notificação',
            error: error.message 
        });
    }
}

/**
 * Limpa notificações antigas (apenas Admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function cleanupNotificationsController(req, res) {
    try {
        const { days = 30 } = req.query;
        const result = await cleanupOldNotifications(parseInt(days));

        return res.status(200).json({
            message: `${result.deleted} notificações antigas foram removidas`,
            deleted: result.deleted
        });
    } catch (error) {
        console.error('Erro ao limpar notificações antigas:', error);
        return res.status(500).json({ 
            message: 'Erro ao limpar notificações antigas',
            error: error.message 
        });
    }
}

/**
 * Endpoint para WebSocket connection (para notificações em tempo real)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function connectWebSocketController(req, res) {
    try {
        // Este endpoint será usado para estabelecer conexão WebSocket
        // A implementação específica dependerá da biblioteca WebSocket escolhida
        
        return res.status(200).json({
            message: 'WebSocket endpoint disponível',
            endpoint: '/api/notifications/ws'
        });
    } catch (error) {
        console.error('Erro no endpoint WebSocket:', error);
        return res.status(500).json({ 
            message: 'Erro no endpoint WebSocket',
            error: error.message 
        });
    }
}

/**
 * Envia notificação de teste (apenas para desenvolvimento/Admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function sendTestNotificationController(req, res) {
    try {
        const { 
            user_id, 
            type = 'TEST', 
            title = 'Notificação de Teste',
            message = 'Esta é uma notificação de teste',
            category = 'info'
        } = req.body;

        const targetUserId = user_id || req.user.id;

        const notification = await notificationService.notifyUser(
            targetUserId,
            type,
            title,
            message,
            category
        );

        return res.status(201).json({
            message: 'Notificação de teste enviada',
            notification
        });
    } catch (error) {
        console.error('Erro ao enviar notificação de teste:', error);
        return res.status(500).json({ 
            message: 'Erro ao enviar notificação de teste',
            error: error.message 
        });
    }
}

/**
 * Obtém estatísticas de notificações (apenas Admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getNotificationStatsController(req, res) {
    try {
        const { PrismaClient } = await import('../generated/prisma/index.js');
        const prisma = new PrismaClient();

        // Estatísticas gerais
        const totalNotifications = await prisma.notification.count();
        const unreadNotifications = await prisma.notification.count({
            where: { is_read: false }
        });
        const archivedNotifications = await prisma.notification.count({
            where: { is_archived: true }
        });

        // Notificações por tipo
        const notificationsByType = await prisma.notification.groupBy({
            by: ['type'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });

        // Notificações por categoria
        const notificationsByCategory = await prisma.notification.groupBy({
            by: ['category'],
            _count: {
                id: true
            }
        });

        // Notificações dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentNotifications = await prisma.notification.count({
            where: {
                created_at: {
                    gte: sevenDaysAgo
                }
            }
        });

        const stats = {
            total: totalNotifications,
            unread: unreadNotifications,
            archived: archivedNotifications,
            recent_7_days: recentNotifications,
            by_type: notificationsByType.map(item => ({
                type: item.type,
                count: item._count.id
            })),
            by_category: notificationsByCategory.map(item => ({
                category: item.category,
                count: item._count.id
            }))
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas de notificações:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar estatísticas de notificações',
            error: error.message 
        });
    }
}
