import { PrismaClient } from '../generated/prisma/index.js';
import notificationService from './NotificationService.js';

const prisma = new PrismaClient();

/**
 * Serviço de Monitoramento de SLA
 * Responsável por verificar prazos de tickets e enviar alertas de vencimento
 */

class SLAMonitorService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        // Verificar a cada 30 minutos (pode ser configurado)
        this.checkInterval = 30 * 60 * 1000; // 30 minutos em milliseconds
    }

    /**
     * Inicia o monitoramento automático de SLA
     */
    start() {
        if (this.isRunning) {
            console.log('SLA Monitor já está rodando');
            return;
        }

        console.log('Iniciando SLA Monitor Service...');
        this.isRunning = true;
        
        // Executar imediatamente
        this.checkSLAViolations();
        
        // Configurar execução periódica
        this.intervalId = setInterval(() => {
            this.checkSLAViolations();
        }, this.checkInterval);

        console.log(`SLA Monitor iniciado - verificando a cada ${this.checkInterval / 60000} minutos`);
    }

    /**
     * Para o monitoramento automático de SLA
     */
    stop() {
        if (!this.isRunning) {
            console.log('SLA Monitor não está rodando');
            return;
        }

        console.log('Parando SLA Monitor Service...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('SLA Monitor parado');
    }

    /**
     * Verifica violações de SLA e envia notificações
     */
    async checkSLAViolations() {
        try {
            console.log('Verificando violações de SLA...');
            
            // Buscar todos os tickets ativos
            const activeTickets = await prisma.ticket.findMany({
                where: {
                    status: {
                        in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
                    }
                },
                include: {
                    client: {
                        include: {
                            user: true
                        }
                    },
                    assignee: true,
                    category: true
                }
            });

            const now = new Date();
            let expiredCount = 0;
            let warningCount = 0;

            for (const ticket of activeTickets) {
                const slaInfo = await this.calculateSLAInfo(ticket);
                
                if (slaInfo.isExpired) {
                    await this.handleExpiredTicket(ticket, slaInfo);
                    expiredCount++;
                } else if (slaInfo.isNearExpiration) {
                    await this.handleNearExpirationTicket(ticket, slaInfo);
                    warningCount++;
                }
            }

            console.log(`SLA Check completo: ${expiredCount} tickets expirados, ${warningCount} próximos do vencimento`);
            
        } catch (error) {
            console.error('Erro ao verificar violações de SLA:', error);
        }
    }

    /**
     * Calcula informações de SLA para um ticket
     * @param {Object} ticket - Dados do ticket
     * @returns {Object} - Informações de SLA
     */
    async calculateSLAInfo(ticket) {
        try {
            // Buscar SLA baseado na prioridade do ticket
            const sla = await prisma.sLA.findFirst({
                where: {
                    priority: ticket.priority,
                    is_active: true
                }
            });

            const now = new Date();
            const createdAt = new Date(ticket.created_at);
            
            // Se não há SLA definido, usar valores padrão baseados na prioridade
            let resolutionTimeMinutes;
            if (sla) {
                resolutionTimeMinutes = sla.resolution_time;
            } else {
                // Valores padrão por prioridade (em minutos)
                const defaultSLA = {
                    'Critical': 4 * 60,    // 4 horas
                    'High': 24 * 60,       // 24 horas
                    'Medium': 72 * 60,     // 3 dias
                    'Low': 168 * 60        // 7 dias
                };
                resolutionTimeMinutes = defaultSLA[ticket.priority] || 72 * 60;
            }

            const dueDate = new Date(createdAt.getTime() + (resolutionTimeMinutes * 60 * 1000));
            const timeElapsed = now - createdAt;
            const timeRemaining = dueDate - now;
            
            // Considerar próximo do vencimento se restam menos de 25% do tempo
            const warningThreshold = resolutionTimeMinutes * 0.25 * 60 * 1000; // 25% do tempo em ms
            
            return {
                sla,
                dueDate,
                timeElapsed,
                timeRemaining,
                resolutionTimeMinutes,
                isExpired: timeRemaining <= 0,
                isNearExpiration: timeRemaining > 0 && timeRemaining <= warningThreshold,
                hoursRemaining: Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60))),
                hoursOverdue: timeRemaining < 0 ? Math.ceil(Math.abs(timeRemaining) / (1000 * 60 * 60)) : 0
            };
        } catch (error) {
            console.error('Erro ao calcular SLA:', error);
            return {
                isExpired: false,
                isNearExpiration: false,
                hoursRemaining: 0,
                hoursOverdue: 0
            };
        }
    }

    /**
     * Trata ticket expirado
     * @param {Object} ticket - Dados do ticket
     * @param {Object} slaInfo - Informações de SLA
     */
    async handleExpiredTicket(ticket, slaInfo) {
        try {
            // Verificar se já foi enviada notificação de expiração nas últimas 24 horas
            const lastNotification = await prisma.notification.findFirst({
                where: {
                    type: 'TICKET_EXPIRED',
                    metadata: {
                        path: ['ticketId'],
                        equals: ticket.id
                    },
                    created_at: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
                    }
                }
            });

            if (lastNotification) {
                return; // Já foi notificado recentemente
            }

            console.log(`Ticket expirado: #${ticket.ticket_number} - ${slaInfo.hoursOverdue}h em atraso`);
            
            // Enviar notificação de ticket expirado
            await notificationService.notifyTicketExpired(ticket);

            // Atualizar status do ticket se necessário
            if (ticket.status !== 'WaitingForClient') {
                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        // Adicionar flag de SLA violado (se o campo existir)
                        modified_at: new Date()
                    }
                });
            }

        } catch (error) {
            console.error(`Erro ao tratar ticket expirado ${ticket.ticket_number}:`, error);
        }
    }

    /**
     * Trata ticket próximo do vencimento
     * @param {Object} ticket - Dados do ticket
     * @param {Object} slaInfo - Informações de SLA
     */
    async handleNearExpirationTicket(ticket, slaInfo) {
        try {
            // Verificar se já foi enviada notificação de aviso nas últimas 12 horas
            const lastWarning = await prisma.notification.findFirst({
                where: {
                    type: 'TICKET_NEAR_EXPIRATION',
                    metadata: {
                        path: ['ticketId'],
                        equals: ticket.id
                    },
                    created_at: {
                        gte: new Date(Date.now() - 12 * 60 * 60 * 1000) // últimas 12 horas
                    }
                }
            });

            if (lastWarning) {
                return; // Já foi notificado recentemente
            }

            console.log(`Ticket próximo do vencimento: #${ticket.ticket_number} - ${slaInfo.hoursRemaining}h restantes`);
            
            // Enviar notificação de aviso
            await this.notifyTicketNearExpiration(ticket, slaInfo);

        } catch (error) {
            console.error(`Erro ao tratar ticket próximo do vencimento ${ticket.ticket_number}:`, error);
        }
    }

    /**
     * Envia notificação de ticket próximo do vencimento
     * @param {Object} ticket - Dados do ticket
     * @param {Object} slaInfo - Informações de SLA
     */
    async notifyTicketNearExpiration(ticket, slaInfo) {
        try {
            const notifications = [];

            // Notificar o técnico responsável
            if (ticket.assigned_to) {
                notifications.push(
                    notificationService.notifyUser(
                        ticket.assigned_to,
                        'TICKET_NEAR_EXPIRATION',
                        'Ticket próximo do vencimento',
                        `O ticket #${ticket.ticket_number} vence em ${slaInfo.hoursRemaining} hora(s). Prioridade: ${ticket.priority}`,
                        'warning',
                        {
                            ticketId: ticket.id,
                            ticketNumber: ticket.ticket_number,
                            hoursRemaining: slaInfo.hoursRemaining,
                            priority: ticket.priority,
                            dueDate: slaInfo.dueDate
                        }
                    )
                );
            }

            // Notificar admins
            const admins = await prisma.user.findMany({
                where: { role: 'Admin', is_active: true }
            });

            for (const admin of admins) {
                notifications.push(
                    notificationService.notifyUser(
                        admin.id,
                        'TICKET_NEAR_EXPIRATION',
                        'Ticket próximo do vencimento',
                        `Ticket #${ticket.ticket_number} vence em ${slaInfo.hoursRemaining} hora(s). ${ticket.assigned_to ? 'Atribuído' : 'Não atribuído'}`,
                        'warning',
                        {
                            ticketId: ticket.id,
                            ticketNumber: ticket.ticket_number,
                            hoursRemaining: slaInfo.hoursRemaining,
                            priority: ticket.priority,
                            isAssigned: !!ticket.assigned_to
                        }
                    )
                );
            }

            await Promise.all(notifications);

        } catch (error) {
            console.error('Erro ao enviar notificação de ticket próximo do vencimento:', error);
        }
    }

    /**
     * Verifica SLA de um ticket específico (para uso manual)
     * @param {number} ticketId - ID do ticket
     * @returns {Object} - Informações de SLA
     */
    async checkTicketSLA(ticketId) {
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    client: {
                        include: {
                            user: true
                        }
                    },
                    assignee: true,
                    category: true
                }
            });

            if (!ticket) {
                throw new Error('Ticket não encontrado');
            }

            return await this.calculateSLAInfo(ticket);
        } catch (error) {
            console.error('Erro ao verificar SLA do ticket:', error);
            throw error;
        }
    }

    /**
     * Obtém estatísticas de SLA
     * @returns {Object} - Estatísticas de SLA
     */
    async getSLAStatistics() {
        try {
            const activeTickets = await prisma.ticket.findMany({
                where: {
                    status: {
                        in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
                    }
                }
            });

            let expired = 0;
            let nearExpiration = 0;
            let onTime = 0;

            for (const ticket of activeTickets) {
                const slaInfo = await this.calculateSLAInfo(ticket);
                
                if (slaInfo.isExpired) {
                    expired++;
                } else if (slaInfo.isNearExpiration) {
                    nearExpiration++;
                } else {
                    onTime++;
                }
            }

            return {
                total: activeTickets.length,
                expired,
                nearExpiration,
                onTime,
                percentageOnTime: activeTickets.length > 0 ? ((onTime / activeTickets.length) * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas de SLA:', error);
            throw error;
        }
    }
}

// Singleton instance
const slaMonitorService = new SLAMonitorService();

export default slaMonitorService;
