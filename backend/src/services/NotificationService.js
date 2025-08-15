import { 
    createNotification, 
    NOTIFICATION_TYPES, 
    NOTIFICATION_CATEGORIES 
} from '../models/Notification.js';
import prisma from '../../prisma/client.js';

/**
 * Serviço de Notificações
 * Responsável por criar e enviar notificações baseadas em eventos do sistema
 */

class NotificationService {
    constructor() {
        this.subscribers = new Map(); // Para WebSocket connections futuras
        this.defaultChannels = { inapp: true, push: false, email: false };
    }

    /**
     * Registra um subscriber para notificações em tempo real
     * @param {number} userId - ID do usuário
     * @param {Object} connection - Conexão WebSocket ou SSE
     */
    subscribe(userId, connection) {
        if (!this.subscribers.has(userId)) {
            this.subscribers.set(userId, new Set());
        }
        this.subscribers.get(userId).add(connection);
    }

    /**
     * Remove subscriber
     * @param {number} userId - ID do usuário
     * @param {Object} connection - Conexão WebSocket ou SSE
     */
    unsubscribe(userId, connection) {
        if (this.subscribers.has(userId)) {
            this.subscribers.get(userId).delete(connection);
            if (this.subscribers.get(userId).size === 0) {
                this.subscribers.delete(userId);
            }
        }
    }

    /**
     * Envia notificação em tempo real para subscribers
     * @param {number} userId - ID do usuário
     * @param {Object} notification - Dados da notificação
     */
    sendRealTimeNotification(userId, notification) {
        if (this.subscribers.has(userId)) {
            const connections = this.subscribers.get(userId);
            connections.forEach(connection => {
                try {
                    if (connection.readyState === 1) { // WebSocket OPEN
                        connection.send(JSON.stringify({
                            type: 'notification',
                            data: notification
                        }));
                    }
                } catch (error) {
                    console.error('Erro ao enviar notificação em tempo real:', error);
                    this.unsubscribe(userId, connection);
                }
            });
        }
    }

    /**
     * Cria e envia notificação para usuário específico
     * @param {number} userId - ID do usuário
     * @param {string} type - Tipo da notificação
     * @param {string} title - Título
     * @param {string} message - Mensagem
     * @param {string} category - Categoria
     * @param {Object} metadata - Dados adicionais
     */
    async notifyUser(userId, type, title, message, category = NOTIFICATION_CATEGORIES.INFO, metadata = {}) {
        try {
            const notification = await createNotification({
                user_id: userId,
                type,
                title,
                message,
                category,
                metadata
            });

            // Enviar em tempo real
            this.sendRealTimeNotification(userId, notification);

            // Enviar por outros canais conforme preferências (best-effort)
            await this.dispatchByChannels(userId, notification);

            return notification;
        } catch (error) {
            console.error('Erro ao notificar usuário:', error);
            throw error;
        }
    }

    /**
     * Notifica múltiplos usuários
     * @param {Array} userIds - IDs dos usuários
     * @param {string} type - Tipo da notificação
     * @param {string} title - Título
     * @param {string} message - Mensagem
     * @param {string} category - Categoria
     * @param {Object} metadata - Dados adicionais
     */
    async notifyMultipleUsers(userIds, type, title, message, category = NOTIFICATION_CATEGORIES.INFO, metadata = {}) {
        try {
            const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
            const notifications = await Promise.all(
                uniqueIds.map(userId => this.notifyUser(userId, type, title, message, category, metadata))
            );

            return notifications;
        } catch (error) {
            console.error('Erro ao notificar múltiplos usuários:', error);
            throw error;
        }
    }

    // ===== EVENTOS DE USUÁRIO =====

    /**
     * Notifica sobre criação de nova conta
     * @param {Object} user - Dados do usuário criado
     */
    async notifyUserCreated(user) {
        // Notificar todos os admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins.map(admin => admin.id).filter((id) => id !== user.id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.USER_CREATED,
            'Nova conta criada',
            `Uma nova conta foi criada para ${user.name} (${user.email})`,
            NOTIFICATION_CATEGORIES.INFO,
            { userId: user.id, userRole: user.role }
        );

        // Notificar o próprio usuário
        await this.notifyUser(
            user.id,
            NOTIFICATION_TYPES.USER_CREATED,
            'Bem-vindo ao sistema!',
            'Sua conta foi criada com sucesso. Você já pode começar a usar o sistema.',
            NOTIFICATION_CATEGORIES.SUCCESS
        );
    }

    /**
     * Método genérico solicitado: criarNotificacao(usuarioId, tipo, titulo, mensagem, linkOpcional)
     */
    async createNotificacao(usuarioId, tipo, titulo, mensagem, linkOpcional) {
        const metadata = linkOpcional ? { link: linkOpcional } : {};
        return this.notifyUser(usuarioId, tipo, titulo, mensagem, NOTIFICATION_CATEGORIES.INFO, metadata);
    }

    /**
     * Notifica sobre exclusão de usuário
     * @param {Object} user - Dados do usuário excluído
     */
    async notifyUserDeleted(user) {
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins.map(admin => admin.id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.USER_DELETED,
            'Usuário removido',
            `O usuário ${user.name} (${user.email}) foi removido do sistema`,
            NOTIFICATION_CATEGORIES.WARNING,
            { userId: user.id, userRole: user.role }
        );
    }

    /**
     * Notifica sobre mudança de senha
     * @param {number} userId - ID do usuário
     * @param {string} changedBy - Quem alterou a senha
     */
    async notifyPasswordChanged(userId, changedBy) {
        try {
            await this.notifyUser(
                userId,
                'PASSWORD_CHANGED',
                'Senha alterada',
                `Sua senha foi alterada por ${changedBy}`,
                'info',
                {
                    changedBy,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Erro ao notificar mudança de senha:', error);
        }
    }

    // ===== EVENTOS DE CHAMADOS =====

    /**
     * Notifica sobre criação de chamado
     * @param {Object} ticket - Dados do chamado
     */
    async notifyTicketCreated(ticket) {
        // Notificar admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins
            .map(admin => admin.id)
            .filter((id) => id !== ticket.client.user_id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.TICKET_CREATED,
            'Novo chamado criado',
            `Chamado #${ticket.ticket_number} foi criado: ${ticket.title}`,
            NOTIFICATION_CATEGORIES.INFO,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        );

        // Notificar técnicos com a categoria do ticket
        if (ticket.category_id) {
            const techniciansWithCategory = await prisma.agent.findMany({
                where: {
                    agent_categories: {
                        some: {
                            category_id: ticket.category_id
                        }
                    },
                    user: {
                        is_active: true
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            const technicianUserIds = techniciansWithCategory
                .map(agent => agent.user.id)
                .filter((id) => id !== ticket.client.user_id);

            if (technicianUserIds.length > 0) {
                await this.notifyMultipleUsers(
                    technicianUserIds,
                    NOTIFICATION_TYPES.TICKET_CREATED,
                    'Novo chamado na sua categoria',
                    `Chamado #${ticket.ticket_number} foi criado na categoria ${ticket.category?.name || 'N/A'}: ${ticket.title}`,
                    NOTIFICATION_CATEGORIES.INFO,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number, categoryId: ticket.category_id }
                );
            }
        }

        // Notificar o cliente que criou
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_CREATED,
            'Chamado criado com sucesso',
            `Seu chamado #${ticket.ticket_number} foi criado e está aguardando atribuição.`,
            NOTIFICATION_CATEGORIES.SUCCESS,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        );
    }

    /**
     * Notifica sobre atualização de chamado
     * @param {Object} ticket - Dados do chamado atualizado
     * @param {Object} changes - Alterações realizadas
     */
    async notifyTicketUpdated(ticket, changes) {
        const notifications = [];

        // Notificar o cliente
        notifications.push(
            this.notifyUser(
                ticket.client.user_id,
                NOTIFICATION_TYPES.TICKET_UPDATED,
                'Chamado atualizado',
                `Seu chamado #${ticket.ticket_number} foi atualizado.`,
                NOTIFICATION_CATEGORIES.INFO,
                { ticketId: ticket.id, ticketNumber: ticket.ticket_number, changes }
            )
        );

        // Notificar o técnico atribuído (se houver)
        if (ticket.assigned_to) {
            notifications.push(
                this.notifyUser(
                    ticket.assigned_to,
                    NOTIFICATION_TYPES.TICKET_UPDATED,
                    'Chamado atribuído atualizado',
                    `O chamado #${ticket.ticket_number} atribuído a você foi atualizado.`,
                    NOTIFICATION_CATEGORIES.INFO,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number, changes }
                )
            );
        }

        await Promise.all(notifications);
    }

    /**
     * Envia notificação por canais (push/email) conforme preferências do usuário
     * Implementação de stub para fácil extensão
     */
    async dispatchByChannels(userId, notification) {
        try {
            const prefs = await this.getUserNotificationPreferences(userId);
            // In-app já foi feito por DB + real-time
            if (prefs.push_enabled) {
                await this.trySendPush(userId, notification);
            }
            if (prefs.email_enabled) {
                await this.trySendEmail(userId, notification);
            }
        } catch (err) {
            console.error('Erro ao enviar canais adicionais de notificação:', err);
        }
    }

    async getUserNotificationPreferences(userId) {
        // Busca simples em tabela (se existir) ou retorna padrão
        try {
            const pref = await prisma.notificationPreference.findUnique({ where: { user_id: userId } });
            if (!pref) {
                return { push_enabled: this.defaultChannels.push, email_enabled: this.defaultChannels.email };
            }
            return pref;
        } catch (_) {
            return { push_enabled: this.defaultChannels.push, email_enabled: this.defaultChannels.email };
        }
    }

    async trySendPush(userId, notification) {
        // Stub: integrar com Web Push / FCM posteriormente
        return;
    }

    async trySendEmail(userId, notification) {
        // Stub: integrar com provedor de e-mail posteriormente
        return;
    }

    /**
     * Notifica sobre atribuição de chamado
     * @param {Object} ticket - Dados do chamado
     * @param {Object} agent - Dados do técnico
     */
    async notifyTicketAssigned(ticket, agent) {
        // Notificar o técnico
        await this.notifyUser(
            agent.user_id,
            NOTIFICATION_TYPES.TICKET_ASSIGNED,
            'Novo chamado atribuído',
            `O chamado #${ticket.ticket_number} foi atribuído a você: ${ticket.title}`,
            NOTIFICATION_CATEGORIES.INFO,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        );

        // Notificar o cliente
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_ASSIGNED,
            'Chamado atribuído',
            `Seu chamado #${ticket.ticket_number} foi atribuído ao técnico ${agent.user.name}.`,
            NOTIFICATION_CATEGORIES.INFO,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number, agentName: agent.user.name }
        );
    }

    /**
     * Notifica sobre aceitação de chamado por técnico
     * @param {Object} ticket - Dados do chamado
     * @param {Object} agent - Dados do técnico que aceitou
     */
    async notifyTicketAccepted(ticket, agent) {
        // Notificar o cliente
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_ACCEPTED,
            'Chamado aceito',
            `Seu chamado #${ticket.ticket_number} foi aceito pelo técnico ${agent.user.name} e está sendo atendido.`,
            NOTIFICATION_CATEGORIES.SUCCESS,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number, agentName: agent.user.name }
        );

        // Notificar admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins
            .map(admin => admin.id)
            .filter((id) => id !== agent.user_id && id !== ticket.client.user_id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.TICKET_ACCEPTED,
            'Chamado aceito por técnico',
            `Chamado #${ticket.ticket_number} foi aceito pelo técnico ${agent.user.name}`,
            NOTIFICATION_CATEGORIES.INFO,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number, agentName: agent.user.name }
        );
    }

    /**
     * Notifica sobre conclusão de chamado
     * @param {Object} ticket - Dados do chamado
     */
    async notifyTicketCompleted(ticket) {
        // Notificar o cliente
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_COMPLETED,
            'Chamado concluído',
            `Seu chamado #${ticket.ticket_number} foi concluído. Por favor, avalie o atendimento.`,
            NOTIFICATION_CATEGORIES.SUCCESS,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        );

        // Notificar admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins
            .map(admin => admin.id)
            .filter((id) => id !== ticket.client.user_id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.TICKET_COMPLETED,
            'Chamado concluído',
            `Chamado #${ticket.ticket_number} foi concluído`,
            NOTIFICATION_CATEGORIES.SUCCESS,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        );
    }

    /**
     * Notifica sobre chamado em espera
     * @param {Object} ticket - Dados do chamado
     * @param {string} reason - Motivo da espera
     */
    async notifyTicketOnHold(ticket, reason) {
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_ON_HOLD,
            'Chamado em espera',
            `Seu chamado #${ticket.ticket_number} foi colocado em espera. Motivo: ${reason}`,
            NOTIFICATION_CATEGORIES.WARNING,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number, reason }
        );
    }

    /**
     * Notifica sobre chamado recusado
     * @param {Object} ticket - Dados do chamado
     * @param {string} reason - Motivo da recusa
     */
    async notifyTicketRejected(ticket, reason) {
        // Notificar cliente
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_REJECTED,
            'Chamado cancelado',
            `Seu chamado #${ticket.ticket_number} foi cancelado. Motivo: ${reason}`,
            NOTIFICATION_CATEGORIES.ERROR,
            { ticketId: ticket.id, ticketNumber: ticket.ticket_number, reason }
        );
        // Notificar técnico, se houver
        if (ticket.assigned_to) {
            await this.notifyUser(
                ticket.assigned_to,
                NOTIFICATION_TYPES.TICKET_REJECTED,
                'Chamado cancelado',
                `O chamado #${ticket.ticket_number} atribuído a você foi cancelado.`,
                NOTIFICATION_CATEGORIES.WARNING,
                { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
            );
        }
    }

    /**
     * Notifica sobre reabertura de chamado
     * @param {Object} ticket - Dados do chamado
     */
    async notifyTicketReopened(ticket) {
        const notifications = [];

        // Notificar o cliente
        notifications.push(
            this.notifyUser(
                ticket.client.user_id,
                NOTIFICATION_TYPES.TICKET_REOPENED,
                'Chamado reaberto',
                `Seu chamado #${ticket.ticket_number} foi reaberto.`,
                NOTIFICATION_CATEGORIES.INFO,
                { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
            )
        );

        // Notificar o técnico (se houver)
        if (ticket.assigned_to) {
            notifications.push(
                this.notifyUser(
                    ticket.assigned_to,
                    NOTIFICATION_TYPES.TICKET_REOPENED,
                    'Chamado reaberto',
                    `O chamado #${ticket.ticket_number} atribuído a você foi reaberto.`,
                    NOTIFICATION_CATEGORIES.WARNING,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
                )
            );
        }

        await Promise.all(notifications);
    }

    /**
     * Notifica sobre expiração de prazo
     * @param {Object} ticket - Dados do chamado
     */
    async notifyTicketExpired(ticket) {
        const notifications = [];

        // Notificar o técnico
        if (ticket.assigned_to) {
            notifications.push(
                this.notifyUser(
                    ticket.assigned_to,
                    NOTIFICATION_TYPES.TICKET_EXPIRED,
                    'Prazo de chamado expirado',
                    `O prazo do chamado #${ticket.ticket_number} expirou.`,
                    NOTIFICATION_CATEGORIES.ERROR,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
                )
            );
        }

        // Notificar admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins
            .map(admin => admin.id)
            .filter((id) => id !== ticket.assigned_to);
        
        notifications.push(
            this.notifyMultipleUsers(
                adminIds,
                NOTIFICATION_TYPES.TICKET_EXPIRED,
                'Chamado com prazo expirado',
                `O chamado #${ticket.ticket_number} teve seu prazo expirado.`,
                NOTIFICATION_CATEGORIES.ERROR,
                { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
            )
        );

        await Promise.all(notifications);
    }

    /**
     * Notifica sobre exclusão de chamado
     * @param {Object} ticket - Dados do chamado excluído
     */
    async notifyTicketDeleted(ticket) {
        // Notificar o cliente
        await this.notifyUser(
            ticket.client.user_id,
            NOTIFICATION_TYPES.TICKET_DELETED,
            'Chamado excluído',
            `Seu chamado #${ticket.ticket_number} foi excluído do sistema.`,
            NOTIFICATION_CATEGORIES.WARNING,
            { ticketNumber: ticket.ticket_number }
        );
    }

    // ===== EVENTOS DE COMENTÁRIOS =====

    /**
     * Notifica sobre novo comentário
     * @param {Object} comment - Dados do comentário
     * @param {Object} ticket - Dados do chamado
     */
    async notifyCommentAdded(comment, ticket) {
        const notifications = [];

        // Notificar o cliente (se o comentário não for dele)
        if (comment.user_id !== ticket.client.user_id) {
            notifications.push(
                this.notifyUser(
                    ticket.client.user_id,
                    NOTIFICATION_TYPES.COMMENT_ADDED,
                    'Novo comentário no chamado',
                    `Um novo comentário foi adicionado ao seu chamado #${ticket.ticket_number}.`,
                    NOTIFICATION_CATEGORIES.INFO,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number, commentId: comment.id }
                )
            );
        }

        // Notificar o técnico (se houver e se o comentário não for dele)
        if (ticket.assigned_to && comment.user_id !== ticket.assigned_to) {
            notifications.push(
                this.notifyUser(
                    ticket.assigned_to,
                    NOTIFICATION_TYPES.COMMENT_ADDED,
                    'Novo comentário no chamado',
                    `Um novo comentário foi adicionado ao chamado #${ticket.ticket_number}.`,
                    NOTIFICATION_CATEGORIES.INFO,
                    { ticketId: ticket.id, ticketNumber: ticket.ticket_number, commentId: comment.id }
                )
            );
        }

        await Promise.all(notifications);
    }

    // ===== EVENTOS DE EQUIPE =====

    /**
     * Notifica sobre adição de membro à equipe
     * @param {Object} user - Dados do novo membro
     */
    async notifyTeamMemberAdded(user) {
        // Notificar todos os admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins.map(admin => admin.id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.TEAM_MEMBER_ADDED,
            'Novo membro da equipe',
            `${user.name} foi adicionado à equipe como ${user.role}`,
            NOTIFICATION_CATEGORIES.SUCCESS,
            { userId: user.id, userRole: user.role }
        );
    }

    /**
     * Notifica sobre remoção de membro da equipe
     * @param {Object} user - Dados do membro removido
     */
    async notifyTeamMemberRemoved(user) {
        // Notificar todos os admins
        const admins = await prisma.user.findMany({
            where: { role: 'Admin', is_active: true }
        });

        const adminIds = admins.map(admin => admin.id);
        
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.TEAM_MEMBER_REMOVED,
            'Membro removido da equipe',
            `${user.name} foi removido da equipe`,
            NOTIFICATION_CATEGORIES.WARNING,
            { userId: user.id, userRole: user.role }
        );
    }

    // ===== ALERTAS ADMIN =====

    async notifyUnassignedTicketsAlert(adminIds, tickets) {
        const title = 'Chamados não atribuídos há muitas horas';
        const msg = `Existem ${tickets.length} chamados não atribuídos além do limite definido.`;
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.UNASSIGNED_TICKETS_ALERT,
            title,
            msg,
            NOTIFICATION_CATEGORIES.WARNING,
            { ticketIds: tickets.map(t => t.id), count: tickets.length }
        );
    }

    async notifyHighVolumeAlert(adminIds, count, windowMinutes) {
        const title = 'Alto volume de chamados abertos';
        const msg = `Foram abertos ${count} chamados nos últimos ${windowMinutes} minutos.`;
        await this.notifyMultipleUsers(
            adminIds,
            NOTIFICATION_TYPES.HIGH_VOLUME_ALERT,
            title,
            msg,
            NOTIFICATION_CATEGORIES.WARNING,
            { count, windowMinutes }
        );
    }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;
