import prisma from '../../prisma/client.js';

/**
 * Model para operações de estatísticas e métricas do sistema de helpdesk
 * Contém funções para calcular estatísticas de usuários, tickets e categorias
 * Inclui métricas de desempenho e análises de dados do sistema
 */

// Função de estatísticas do admin
async function getSystemStatistics() {
	try {
		// Contar total de usuários por role
		const [totalAdmins, totalAgents, totalClients] = await Promise.all([
			prisma.user.count({ where: { role: 'Admin' } }),
			prisma.user.count({ where: { role: 'Agent' } }),
			prisma.user.count({ where: { role: 'Client' } })
		]);

		// Contar total de tickets por status
		const [totalTickets, openTickets, inProgressTickets, waitingForClientTickets, resolvedTickets, closedTickets] = await Promise.all([
			prisma.ticket.count(),
			prisma.ticket.count({ where: { status: 'Open' } }),
			prisma.ticket.count({ where: { status: 'InProgress' } }),
			prisma.ticket.count({ where: { status: 'WaitingForClient' } }),
			prisma.ticket.count({ where: { status: 'Resolved' } }),
			prisma.ticket.count({ where: { status: 'Closed' } })
		]);

		// Contar total de categorias e subcategorias
		const [totalCategories, totalSubcategories] = await Promise.all([
			prisma.category.count({ where: { is_active: true } }),
			prisma.subcategory.count({ where: { is_active: true } })
		]);

		// Obter tickets dos últimos 7 dias
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const recentTickets = await prisma.ticket.count({
			where: {
				created_at: {
					gte: sevenDaysAgo
				}
			}
		});

		// Obter tickets dos últimos 30 dias
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const monthlyTickets = await prisma.ticket.count({
			where: {
				created_at: {
					gte: thirtyDaysAgo
				}
			}
		});

		// Contar agentes ativos
		const activeAgents = await prisma.agent.count({
			where: {
				user: {
					is_active: true
				}
			}
		});

		// Contar clientes ativos
		const activeClients = await prisma.client.count({
			where: {
				user: {
					is_active: true
				}
			}
		});

		// Calcular tempo médio de resolução
		const avgResolutionTime = await prisma.ticket.aggregate({
			where: {
				resolution_time: {
					not: null
				}
			},
			_avg: {
				resolution_time: true
			}
		});

		// Calcular satisfação média
		const avgSatisfaction = await prisma.ticket.aggregate({
			where: {
				satisfaction_rating: {
					not: null
				}
			},
			_avg: {
				satisfaction_rating: true
			}
		});

		// Contar tickets por prioridade
		const [lowPriority, mediumPriority, highPriority, criticalPriority] = await Promise.all([
			prisma.ticket.count({ where: { priority: 'Low' } }),
			prisma.ticket.count({ where: { priority: 'Medium' } }),
			prisma.ticket.count({ where: { priority: 'High' } }),
			prisma.ticket.count({ where: { priority: 'Critical' } })
		]);

		const result = {
			users: {
				total_admins: totalAdmins,
				total_agents: totalAgents,
				total_clients: totalClients,
				total_users: totalAdmins + totalAgents + totalClients,
				active_agents: activeAgents,
				active_clients: activeClients
			},
			tickets: {
				total: totalTickets,
				open: openTickets,
				in_progress: inProgressTickets,
				waiting_for_client: waitingForClientTickets,
				resolved: resolvedTickets,
				closed: closedTickets,
				recent_7_days: recentTickets,
				monthly: monthlyTickets,
				priorities: {
					low: lowPriority,
					medium: mediumPriority,
					high: highPriority,
					critical: criticalPriority
				},
				avg_resolution_time: avgResolutionTime._avg.resolution_time || 0,
				avg_satisfaction: avgSatisfaction._avg.satisfaction_rating || 0
			},
			categories: {
				total_categories: totalCategories,
				total_subcategories: totalSubcategories
			},
			system: {
				last_updated: new Date().toISOString()
			}
		};

		return result;
	} catch (error) {
		throw error;
	}
}

// Função de estatísticas da home do Agente
async function getAgentHomeData(agentId, userId) {
    try {
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

        return {
            tickets: {
                open: openTickets,
                in_progress: inProgressTickets,
                total_closed: totalClosedTickets
            },
            recent_tickets: recentTickets
        };
    } catch (error) {
        throw error;
    }
}

// Função de estatísticas da home do Cliente
async function getClientHomeData(clientId) {
    try {
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

        return {
            tickets: {
                open: openTickets,
                waiting_for_client: waitingForClientTickets
            },
            recent_tickets: recentTickets
        };
    } catch (error) {
        throw error;
    }
}

export {
	getSystemStatistics,
    getAgentHomeData,
    getClientHomeData
};