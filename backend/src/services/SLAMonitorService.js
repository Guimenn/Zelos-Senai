import prisma from '../../prisma/client.js';
import notificationService from './NotificationService.js';

// Usa prisma singleton

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
     * Inicializa o serviço e testa a conexão com o banco
     */
    async initialize() {
        try {
            await prisma.$connect();
            console.log('Prisma client initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Prisma client:', error);
            return false;
        }
    }

    /**
     * Inicia o monitoramento automático de SLA
     */
    async start() {
        if (this.isRunning) {
            console.log('SLA Monitor já está rodando');
            return;
        }

        console.log('Iniciando SLA Monitor Service...');
        
        // Initialize Prisma connection
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize SLA Monitor Service');
            return;
        }
        
        this.isRunning = true;
        
        // Executar imediatamente
        try {
            await this.checkSLAViolations();
        } catch (error) {
            console.error('Erro na primeira execução do SLA Monitor:', error);
        }
        
        // Configurar execução periódica
        this.intervalId = setInterval(async () => {
            try {
                await this.checkSLAViolations();
            } catch (error) {
                console.error('Erro na execução periódica do SLA Monitor:', error);
            }
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
            
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available');
                return;
            }
            
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

            console.log(`Verificação de SLA concluída: ${expiredCount} tickets expirados, ${warningCount} tickets próximos do vencimento`);

            // Alertar admins sobre chamados não atribuídos há > X horas
            const UNASSIGNED_HOURS = 4;
            const cutoff = new Date(Date.now() - UNASSIGNED_HOURS * 60 * 60 * 1000);
            const longUnassigned = activeTickets.filter(t => !t.assigned_to && new Date(t.created_at) < cutoff);
            if (longUnassigned.length > 0) {
                const admins = await prisma.user.findMany({ where: { role: 'Admin', is_active: true }, select: { id: true } });
                await notificationService.notifyUnassignedTicketsAlert(admins.map(a => a.id), longUnassigned);
            }

            // Alerta de alto volume de aberturas nos últimos N minutos
            const windowMinutes = 30;
            const volumeCut = new Date(Date.now() - windowMinutes * 60 * 1000);
            const highVolumeCount = await prisma.ticket.count({ where: { created_at: { gte: volumeCut } } });
            const HIGH_VOLUME_THRESHOLD = 20;
            if (highVolumeCount >= HIGH_VOLUME_THRESHOLD) {
                const admins = await prisma.user.findMany({ where: { role: 'Admin', is_active: true }, select: { id: true } });
                await notificationService.notifyHighVolumeAlert(admins.map(a => a.id), highVolumeCount, windowMinutes);
            }

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
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for calculateSLAInfo');
                return {
                    isExpired: false,
                    isNearExpiration: false,
                    hoursRemaining: 0,
                    hoursOverdue: 0
                };
            }

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
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for handleExpiredTicket');
                return;
            }

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
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for handleNearExpirationTicket');
                return;
            }

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

            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for notifyTicketNearExpiration');
                return;
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
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for checkTicketSLA');
                throw new Error('Database connection not available');
            }

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
            // Check if Prisma client is available
            if (!prisma) {
                console.error('Prisma client not available for getSLAStatistics');
                return {
                    expired: 0,
                    nearExpiration: 0,
                    onTime: 0,
                    total: 0
                };
            }

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
