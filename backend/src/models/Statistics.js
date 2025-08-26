import prisma from '../../prisma/client.js';
import { cache, CACHE_KEYS, generateCacheKey } from '../utils/cache.js';

/**
 * Model para operações de estatísticas e métricas do sistema de helpdesk
 * Contém funções para calcular estatísticas de usuários, tickets e categorias
 * Inclui métricas de desempenho e análises de dados do sistema
 */

// Função de estatísticas do admin com cache
async function getSystemStatistics() {
	try {
		// Verificar cache primeiro
		const cacheKey = CACHE_KEYS.STATISTICS;
		const cachedStats = cache.get(cacheKey);
		
		if (cachedStats) {
			return cachedStats;
		}

		// Consulta otimizada usando agregações do Prisma
		const [
			userStats,
			ticketStats,
			categoryStats,
			recentTickets,
			monthlyTickets,
			priorityStats,
			performanceStats
		] = await Promise.all([
			// Estatísticas de usuários em uma única consulta
			prisma.user.groupBy({
				by: ['role'],
				_count: {
					id: true
				},
				where: {
					is_active: true
				}
			}),
			
			// Estatísticas de tickets por status em uma única consulta
			prisma.ticket.groupBy({
				by: ['status'],
				_count: {
					id: true
				}
			}),
			
			// Estatísticas de categorias
			Promise.all([
				prisma.category.count({ where: { is_active: true } }),
				prisma.subcategory.count({ where: { is_active: true } })
			]),
			
			// Tickets recentes (últimos 7 dias)
			prisma.ticket.count({
				where: {
					created_at: {
						gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
					}
				}
			}),
			
			// Tickets mensais (últimos 30 dias)
			prisma.ticket.count({
				where: {
					created_at: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
					}
				}
			}),
			
			// Estatísticas de prioridade
			prisma.ticket.groupBy({
				by: ['priority'],
				_count: {
					id: true
				}
			}),
			
			// Métricas de performance
			Promise.all([
				prisma.ticket.aggregate({
					where: {
						resolution_time: { not: null }
					},
					_avg: { resolution_time: true }
				}),
				prisma.ticket.aggregate({
					where: {
						satisfaction_rating: { not: null }
					},
					_avg: { satisfaction_rating: true }
				})
			])
		]);

		// Processar estatísticas de usuários
		const userCounts = {
			total_admins: 0,
			total_agents: 0,
			total_clients: 0
		};
		
		userStats.forEach(stat => {
			switch (stat.role) {
				case 'Admin':
					userCounts.total_admins = stat._count.id;
					break;
				case 'Agent':
					userCounts.total_agents = stat._count.id;
					break;
				case 'Client':
					userCounts.total_clients = stat._count.id;
					break;
			}
		});

		// Processar estatísticas de tickets
		const ticketCounts = {
			total: 0,
			open: 0,
			in_progress: 0,
			waiting_for_client: 0,
			resolved: 0,
			closed: 0
		};
		
		ticketStats.forEach(stat => {
			ticketCounts.total += stat._count.id;
			switch (stat.status) {
				case 'Open':
					ticketCounts.open = stat._count.id;
					break;
				case 'InProgress':
					ticketCounts.in_progress = stat._count.id;
					break;
				case 'WaitingForClient':
					ticketCounts.waiting_for_client = stat._count.id;
					break;
				case 'Resolved':
					ticketCounts.resolved = stat._count.id;
					break;
				case 'Closed':
					ticketCounts.closed = stat._count.id;
					break;
			}
		});

		// Processar estatísticas de prioridade
		const priorityCounts = {
			low: 0,
			medium: 0,
			high: 0,
			critical: 0
		};
		
		priorityStats.forEach(stat => {
			switch (stat.priority) {
				case 'Low':
					priorityCounts.low = stat._count.id;
					break;
				case 'Medium':
					priorityCounts.medium = stat._count.id;
					break;
				case 'High':
					priorityCounts.high = stat._count.id;
					break;
				case 'Critical':
					priorityCounts.critical = stat._count.id;
					break;
			}
		});

		const result = {
			users: {
				...userCounts,
				total_users: userCounts.total_admins + userCounts.total_agents + userCounts.total_clients,
				active_agents: userCounts.total_agents,
				active_clients: userCounts.total_clients
			},
			tickets: {
				...ticketCounts,
				recent_7_days: recentTickets,
				monthly: monthlyTickets,
				priorities: priorityCounts,
				avg_resolution_time: performanceStats[0]._avg.resolution_time || 0,
				avg_satisfaction: performanceStats[1]._avg.satisfaction_rating || 0
			},
			categories: {
				total_categories: categoryStats[0],
				total_subcategories: categoryStats[1]
			},
			system: {
				last_updated: new Date().toISOString()
			}
		};

		// Armazenar no cache por 2 minutos
		cache.set(cacheKey, result, 2 * 60 * 1000);

		return result;
	} catch (error) {
		throw error;
	}
}

// Função de estatísticas da home do Agente com cache
async function getAgentHomeData(agentId, userId) {
    try {
        const cacheKey = generateCacheKey('agent_home', { userId });
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return cachedData;
        }

        const [openTickets, inProgressTickets, recentTickets, totalClosedTickets] = await Promise.all([
            prisma.ticket.count({ where: { assigned_to: userId, status: 'Open' } }),
            prisma.ticket.count({ where: { assigned_to: userId, status: 'InProgress' } }),
            prisma.ticket.findMany({
                where: { assigned_to: userId },
                orderBy: { modified_at: 'desc' },
                take: 5,
                select: { id: true, title: true, status: true, priority: true, modified_at: true }
            }),
            prisma.ticket.count({ where: { assigned_to: userId, status: 'Closed' } })
        ]);

        const result = {
            tickets: {
                open: openTickets,
                in_progress: inProgressTickets,
                total_closed: totalClosedTickets
            },
            recent_tickets: recentTickets
        };

        // Cache por 1 minuto para dados do agente
        cache.set(cacheKey, result, 60 * 1000);

        return result;
    } catch (error) {
        throw error;
    }
}

// Função de estatísticas da home do Cliente com cache
async function getClientHomeData(clientId) {
    try {
        const cacheKey = generateCacheKey('client_home', { clientId });
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return cachedData;
        }

        const [openTickets, waitingForClientTickets, recentTickets] = await Promise.all([
            prisma.ticket.count({ where: { client_id: clientId, status: 'Open' } }),
            prisma.ticket.count({ where: { client_id: clientId, status: 'WaitingForClient' } }),
            prisma.ticket.findMany({
                where: { client_id: clientId },
                orderBy: { modified_at: 'desc' },
                take: 5,
                select: { id: true, title: true, status: true, priority: true, modified_at: true }
            })
        ]);

        const result = {
            tickets: {
                open: openTickets,
                waiting_for_client: waitingForClientTickets
            },
            recent_tickets: recentTickets
        };

        // Cache por 1 minuto para dados do cliente
        cache.set(cacheKey, result, 60 * 1000);

        return result;
    } catch (error) {
        throw error;
    }
}

export {
	getSystemStatistics,
    getAgentHomeData,
    getClientHomeData
};