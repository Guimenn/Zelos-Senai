import { PrismaClient } from '../generated/prisma/index.js';
import { agentCreateSchema, agentUpdateSchema } from '../schemas/agent.schema.js';
import { ZodError } from 'zod/v4';
import { generateHashPassword } from '../utils/hash.js';

const prisma = new PrismaClient();

// Controller para criar um novo agente
async function createAgentController(req, res) {
    let agentData;

    try {
        agentData = agentCreateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        let userId;

        // Se dados do usuário foram fornecidos, criar novo usuário
        if (agentData.user) {
            // Verificar se o email já existe
            const existingUser = await prisma.user.findUnique({
                where: { email: agentData.user.email }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Email já está em uso' });
            }

            // Criar novo usuário com role Agent
            const hashedPassword = await generateHashPassword(agentData.user.password);
            
            const newUser = await prisma.user.create({
                data: {
                    name: agentData.user.name,
                    email: agentData.user.email,
                    phone: agentData.user.phone,
                    avatar: agentData.user.avatar,
                    hashed_password: hashedPassword,
                    role: 'Agent'
                }
            });

            userId = newUser.id;
        } else {
            // Usar usuário existente
            const user = await prisma.user.findUnique({
                where: { id: agentData.user_id },
                include: { agent: true }
            });

            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            if (user.role !== 'Agent') {
                return res.status(400).json({ message: 'O usuário deve ter o papel de Agent' });
            }

            if (user.agent) {
                return res.status(400).json({ message: 'Este usuário já é um agente' });
            }

            userId = user.id;
        }

        // Criar o agente
        const agent = await prisma.agent.create({
            data: {
                user_id: userId,
                employee_id: agentData.employee_id,
                department: agentData.department,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                },
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            }
        });

        return res.status(201).json(agent);
    } catch (error) {
        console.error('Erro ao criar agente:', error);
        return res.status(500).json({ message: 'Erro ao criar agente' });
    }
}

// Controller para listar todos os agentes
async function getAllAgentsController(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            department,
            is_active,
            search 
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const where = {};
        
        if (department) where.department = department;
        if (is_active !== undefined) where.user = { is_active: is_active === 'true' };
        
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { employee_id: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
            ];
        }

        const agents = await prisma.agent.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                },
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            },
            skip,
            take: parseInt(limit),
        });

        const total = await prisma.agent.count({ where });

        return res.status(200).json({
            agents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar agentes:', error);
        return res.status(500).json({ message: 'Erro ao buscar agentes' });
    }
}

// Controller para obter um agente específico
async function getAgentByIdController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                        created_at: true,
                        modified_at: true,
                    }
                },
                ticket_assignments: {
                    include: {
                        ticket: {
                            select: {
                                id: true,
                                ticket_number: true,
                                title: true,
                                status: true,
                                priority: true,
                                created_at: true,
                            }
                        }
                    },
                    orderBy: {
                        assigned_at: 'desc'
                    },
                    take: 10
                },
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            }
        });

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        return res.status(200).json(agent);
    } catch (error) {
        console.error('Erro ao buscar agente:', error);
        return res.status(500).json({ message: 'Erro ao buscar agente' });
    }
}

// Controller para atualizar um agente
async function updateAgentController(req, res) {
    let agentData;

    try {
        agentData = agentUpdateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        const agentId = parseInt(req.params.agentId);

        const agent = await prisma.agent.update({
            where: { id: agentId },
            data: agentData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                },
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            }
        });

        return res.status(200).json(agent);
    } catch (error) {
        console.error('Erro ao atualizar agente:', error);
        return res.status(500).json({ message: 'Erro ao atualizar agente' });
    }
}

// Controller para deletar um agente
async function deleteAgentController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);

        // Verificar se o agente tem tickets atribuídos ativos
        const activeAssignments = await prisma.ticketAssignment.count({
            where: {
                agent_id: agentId,
                unassigned_at: null
            }
        });

        if (activeAssignments > 0) {
            return res.status(400).json({ 
                message: 'Não é possível deletar um agente que possui tickets ativos atribuídos' 
            });
        }

        await prisma.agent.delete({
            where: { id: agentId }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar agente:', error);
        return res.status(500).json({ message: 'Erro ao deletar agente' });
    }
}

// Controller para obter estatísticas do agente
async function getAgentStatsController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);
        const { period = '30' } = req.query; // dias

        // Verificar se o agente existe
        const agent = await prisma.agent.findUnique({
            where: { id: agentId }
        });

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Tickets atribuídos no período
        const assignedTickets = await prisma.ticketAssignment.count({
            where: {
                agent_id: agentId,
                assigned_at: {
                    gte: startDate
                }
            }
        });

        // Tickets resolvidos no período
        const resolvedTickets = await prisma.ticket.count({
            where: {
                assigned_to: agent.user_id,
                status: 'Resolved',
                closed_at: {
                    gte: startDate
                }
            }
        });

        // Tickets fechados no período
        const closedTickets = await prisma.ticket.count({
            where: {
                assigned_to: agent.user_id,
                status: 'Closed',
                closed_at: {
                    gte: startDate
                }
            }
        });

        // Tempo médio de resolução (em minutos)
        const avgResolutionTime = await prisma.ticket.aggregate({
            where: {
                assigned_to: agent.user_id,
                status: { in: ['Resolved', 'Closed'] },
                resolution_time: { not: null },
                closed_at: {
                    gte: startDate
                }
            },
            _avg: {
                resolution_time: true
            }
        });

        // Avaliação média de satisfação
        const avgSatisfaction = await prisma.ticket.aggregate({
            where: {
                assigned_to: agent.user_id,
                satisfaction_rating: { not: null },
                closed_at: {
                    gte: startDate
                }
            },
            _avg: {
                satisfaction_rating: true
            }
        });

        // Tickets por status
        const ticketsByStatus = await prisma.ticket.groupBy({
            by: ['status'],
            where: {
                assigned_to: agent.user_id,
                created_at: {
                    gte: startDate
                }
            },
            _count: {
                status: true
            }
        });

        // Tickets por prioridade
        const ticketsByPriority = await prisma.ticket.groupBy({
            by: ['priority'],
            where: {
                assigned_to: agent.user_id,
                created_at: {
                    gte: startDate
                }
            },
            _count: {
                priority: true
            }
        });

        const stats = {
            period: `${period} dias`,
            assignedTickets,
            resolvedTickets,
            closedTickets,
            avgResolutionTime: avgResolutionTime._avg.resolution_time || 0,
            avgSatisfaction: avgSatisfaction._avg.satisfaction_rating || 0,
            ticketsByStatus: ticketsByStatus.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            ticketsByPriority: ticketsByPriority.reduce((acc, item) => {
                acc[item.priority] = item._count.priority;
                return acc;
            }, {}),
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas do agente:', error);
        return res.status(500).json({ message: 'Erro ao buscar estatísticas do agente' });
    }
}

// Controller para obter tickets ativos do agente
async function getAgentActiveTicketsController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Verificar se o agente existe
        const agent = await prisma.agent.findUnique({
            where: { id: agentId }
        });

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        const tickets = await prisma.ticket.findMany({
            where: {
                assigned_to: agent.user_id,
                status: { in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'] }
            },
            include: {
                category: true,
                subcategory: true,
                client: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        attachments: true,
                    }
                }
            },
            orderBy: {
                priority: 'desc',
                created_at: 'asc'
            },
            skip,
            take: parseInt(limit),
        });

        const total = await prisma.ticket.count({
            where: {
                assigned_to: agent.user_id,
                status: { in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'] }
            }
        });

        return res.status(200).json({
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets ativos do agente:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets ativos do agente' });
    }
}

export {
    createAgentController,
    getAllAgentsController,
    getAgentByIdController,
    updateAgentController,
    deleteAgentController,
    getAgentStatsController,
    getAgentActiveTicketsController,
}; 