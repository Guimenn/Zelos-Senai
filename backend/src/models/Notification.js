import prisma from '../../prisma/client.js';

/**
 * Model para operações relacionadas a notificações
 * Gerencia criação, leitura e gerenciamento de notificações do sistema
 */

/**
 * Tipos de notificação disponíveis no sistema
 */
export const NOTIFICATION_TYPES = {
    // Usuários
    USER_CREATED: 'USER_CREATED',
    USER_DELETED: 'USER_DELETED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
    
    // Chamados
    TICKET_CREATED: 'TICKET_CREATED',
    TICKET_UPDATED: 'TICKET_UPDATED',
    TICKET_DELETED: 'TICKET_DELETED',
    TICKET_ASSIGNED: 'TICKET_ASSIGNED',
    TICKET_ACCEPTED: 'TICKET_ACCEPTED',
    TICKET_COMPLETED: 'TICKET_COMPLETED',
    TICKET_ON_HOLD: 'TICKET_ON_HOLD',
    TICKET_REJECTED: 'TICKET_REJECTED',
    TICKET_REOPENED: 'TICKET_REOPENED',
    TICKET_EXPIRED: 'TICKET_EXPIRED',
    TICKET_NEAR_EXPIRATION: 'TICKET_NEAR_EXPIRATION',
    UNASSIGNED_TICKETS_ALERT: 'UNASSIGNED_TICKETS_ALERT',
    HIGH_VOLUME_ALERT: 'HIGH_VOLUME_ALERT',
    
    // Comentários
    COMMENT_ADDED: 'COMMENT_ADDED',
    MENTION: 'MENTION',
    NEGATIVE_FEEDBACK: 'NEGATIVE_FEEDBACK',
    
    // Equipe
    TEAM_MEMBER_ADDED: 'TEAM_MEMBER_ADDED',
    TEAM_MEMBER_REMOVED: 'TEAM_MEMBER_REMOVED',

    // Atribuições de tickets
    ASSIGNMENT_REQUEST: 'ASSIGNMENT_REQUEST',
    ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
    ASSIGNMENT_REJECTED: 'ASSIGNMENT_REJECTED',

    // Anexos / Chat
    ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
    CHAT_MESSAGE: 'CHAT_MESSAGE',
};

/**
 * Categorias de notificação para organização
 */
export const NOTIFICATION_CATEGORIES = {
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
};

/**
 * Cria uma nova notificação no sistema
 * @param {Object} notificationData - Dados da notificação
 * @param {number} notificationData.user_id - ID do usuário que receberá a notificação
 * @param {string} notificationData.type - Tipo da notificação
 * @param {string} notificationData.title - Título da notificação
 * @param {string} notificationData.message - Mensagem da notificação
 * @param {string} notificationData.category - Categoria da notificação
 * @param {Object} notificationData.metadata - Dados adicionais (opcional)
 * @returns {Object} - Notificação criada
 */
export async function createNotification(notificationData) {
    try {
        // Deduplicação/agrupamento robusto: verifica últimas notificações iguais (<= 10min) por usuário/tipo
        const now = new Date();
        const windowAgo = new Date(now.getTime() - 10 * 60 * 1000);

        const recent = await prisma.notification.findMany({
            where: {
                user_id: notificationData.user_id,
                type: notificationData.type,
                created_at: { gte: windowAgo },
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });

        const ticketIdIncoming = notificationData?.metadata?.ticketId ?? null;
        const same = recent.find((n) => {
            const nTicketId = (n.metadata && (n.metadata.ticketId ?? null)) ?? null;
            const sameTicket = ticketIdIncoming == null || nTicketId == null ? true : String(nTicketId) === String(ticketIdIncoming);
            return sameTicket && n.title === notificationData.title && n.message === notificationData.message;
        });

        if (same) {
            const prevCount = (same.metadata && same.metadata.group_count) ? Number(same.metadata.group_count) : 1;
            const updated = await prisma.notification.update({
                where: { id: same.id },
                data: {
                    metadata: {
                        ...(same.metadata || {}),
                        group_count: prevCount + 1,
                        last_grouped_at: now.toISOString(),
                    },
                    created_at: now,
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });
            return updated;
        }

        const notification = await prisma.notification.create({
            data: {
                user_id: notificationData.user_id,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                category: notificationData.category,
                metadata: notificationData.metadata || {},
                is_read: false,
                is_archived: false,
                created_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        return notification;
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        throw new Error('Erro ao criar notificação');
    }
}

/**
 * Busca notificações de um usuário
 * @param {number} userId - ID do usuário
 * @param {Object} options - Opções de filtro
 * @param {boolean} options.unreadOnly - Apenas não lidas
 * @param {boolean} options.includeArchived - Incluir arquivadas
 * @param {number} options.limit - Limite de resultados
 * @param {number} options.offset - Offset para paginação
 * @returns {Array} - Lista de notificações
 */
export async function getUserNotifications(userId, options = {}) {
    try {
        const {
            unreadOnly = false,
            includeArchived = false,
            limit = 50,
            offset = 0
        } = options;

        const where = {
            user_id: userId,
        };

        if (unreadOnly) {
            where.is_read = false;
        }

        if (!includeArchived) {
            where.is_archived = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                created_at: 'desc'
            },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        return notifications;
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        throw new Error('Erro ao buscar notificações');
    }
}

/**
 * Marca uma notificação como lida
 * @param {number} notificationId - ID da notificação
 * @param {number} userId - ID do usuário (para verificação de propriedade)
 * @returns {Object} - Notificação atualizada
 */
export async function markNotificationAsRead(notificationId, userId) {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
            },
            data: {
                is_read: true,
                read_at: new Date(),
            }
        });

        if (notification.count === 0) {
            throw new Error('Notificação não encontrada ou não pertence ao usuário');
        }

        return await prisma.notification.findUnique({
            where: { id: notificationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw new Error('Erro ao marcar notificação como lida');
    }
}

/**
 * Marca todas as notificações de um usuário como lidas
 * @param {number} userId - ID do usuário
 * @returns {Object} - Resultado da operação
 */
export async function markAllNotificationsAsRead(userId) {
    try {
        const result = await prisma.notification.updateMany({
            where: {
                user_id: userId,
                is_read: false,
            },
            data: {
                is_read: true,
                read_at: new Date(),
            }
        });

        return { updated: result.count };
    } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        throw new Error('Erro ao marcar todas as notificações como lidas');
    }
}

/**
 * Arquiva uma notificação
 * @param {number} notificationId - ID da notificação
 * @param {number} userId - ID do usuário (para verificação de propriedade)
 * @returns {Object} - Notificação atualizada
 */
export async function archiveNotification(notificationId, userId) {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
            },
            data: {
                is_archived: true,
                archived_at: new Date(),
            }
        });

        if (notification.count === 0) {
            throw new Error('Notificação não encontrada ou não pertence ao usuário');
        }

        return await prisma.notification.findUnique({
            where: { id: notificationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao arquivar notificação:', error);
        throw new Error('Erro ao arquivar notificação');
    }
}

/**
 * Conta notificações não lidas de um usuário
 * @param {number} userId - ID do usuário
 * @returns {number} - Número de notificações não lidas
 */
export async function getUnreadNotificationsCount(userId) {
    try {
        const count = await prisma.notification.count({
            where: {
                user_id: userId,
                is_read: false,
                is_archived: false,
            }
        });

        return count;
    } catch (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        throw new Error('Erro ao contar notificações não lidas');
    }
}

/**
 * Remove notificações antigas (limpeza automática)
 * @param {number} daysOld - Dias de antiguidade para remoção
 * @returns {Object} - Resultado da operação
 */
export async function cleanupOldNotifications(daysOld = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prisma.notification.deleteMany({
            where: {
                created_at: {
                    lt: cutoffDate
                },
                is_archived: true,
            }
        });

        return { deleted: result.count };
    } catch (error) {
        console.error('Erro ao limpar notificações antigas:', error);
        throw new Error('Erro ao limpar notificações antigas');
    }
}
