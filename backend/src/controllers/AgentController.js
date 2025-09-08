import prisma from '../../prisma/client.js';
import { agentCreateSchema, agentUpdateSchema } from '../schemas/agent.schema.js';
import { ZodError } from 'zod/v4';
import { generateHashPassword } from '../utils/hash.js';
import { createUser, updateUser, deleteUser } from '../models/User.js';
import notificationService from '../services/NotificationService.js';
import { NOTIFICATION_TYPES } from '../models/Notification.js';

// Usa prisma singleton

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

            // Criar novo usuário com role Agent (sincronização automática com Supabase)
            const newUser = await createUser({
                name: agentData.user.name,
                email: agentData.user.email,
                phone: agentData.user.phone,
                avatar: agentData.user.avatar,
                address: agentData.user.address,
                password: agentData.user.password,
                role: 'Agent'
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

        // Verificar se o employee_id já existe
        const existingAgent = await prisma.agent.findUnique({
            where: { employee_id: agentData.employee_id }
        });

        if (existingAgent) {
            return res.status(400).json({ message: 'CPF já está em uso por outro agente' });
        }

        // Criar o agente
        const agent = await prisma.agent.create({
            data: {
                user_id: userId,
                employee_id: agentData.employee_id,
                department: agentData.department,
                skills: agentData.skills || [],
                max_tickets: agentData.max_tickets || 10,
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
                        address: true,
                    }
                },
                agent_categories: {
                    include: {
                        category: true
                    }
                },
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            }
        });

        // Criar associações com categorias se fornecidas
        if (agentData.categories && agentData.categories.length > 0) {
            console.log('🔍 Criando associações com categorias:', agentData.categories);
            
            // Verificar se todas as categorias existem
            const existingCategories = await prisma.category.findMany({
                where: {
                    id: { in: agentData.categories },
                    is_active: true
                }
            });

            console.log('📋 Categorias encontradas:', existingCategories.length, 'de', agentData.categories.length);

            if (existingCategories.length !== agentData.categories.length) {
                // Deletar o agente criado se alguma categoria não existir
                await prisma.agent.delete({ where: { id: agent.id } });
                return res.status(400).json({ message: 'Uma ou mais categorias não existem ou estão inativas' });
            }

            // Criar as associações
            await prisma.agentCategory.createMany({
                data: agentData.categories.map(categoryId => ({
                    agent_id: agent.id,
                    category_id: categoryId
                }))
            });

            console.log('✅ Associações com categorias criadas com sucesso');
        }

        // Enviar notificação sobre criação de novo membro da equipe
        try {
            if (agentData.user) {
                // Se foi criado um novo usuário, notificar sobre criação de usuário e membro da equipe
                const newUser = await prisma.user.findUnique({ where: { id: userId } });
                await notificationService.notifyUserCreated(newUser);
                await notificationService.notifyTeamMemberAdded(newUser);
            } else {
                // Se foi usado usuário existente, apenas notificar sobre adição à equipe
                const existingUser = await prisma.user.findUnique({ where: { id: userId } });
                await notificationService.notifyTeamMemberAdded(existingUser);
            }
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de criação de agente:', notificationError);
        }

        // Buscar o agente com as categorias associadas para retornar
        const agentWithCategories = await prisma.agent.findUnique({
            where: { id: agent.id },
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
                agent_categories: {
                    include: {
                        category: true
                    }
                },
                primary_subcategory: true,
                _count: {
                    select: {
                        ticket_assignments: true,
                    }
                }
            }
        });

        return res.status(201).json(agentWithCategories);
    } catch (error) {
        console.error('Erro ao criar agente:', error);
        
        // Tratamento específico para erros do Prisma
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (target?.includes('email')) {
                return res.status(400).json({ 
                    message: 'Email já está em uso por outro usuário',
                    field: 'email'
                });
            }
            if (target?.includes('employee_id')) {
                return res.status(400).json({ 
                    message: 'CPF já está em uso por outro agente',
                    field: 'employee_id'
                });
            }
            return res.status(400).json({ 
                message: 'Dados duplicados encontrados',
                details: error.meta
            });
        }
        
        // Erro de conexão com banco de dados
        if (error.code === 'P1001' || error.code === 'P1002') {
            return res.status(503).json({ 
                message: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
                type: 'database_connection'
            });
        }
        
        // Erro de validação de dados
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                message: 'Referência inválida nos dados fornecidos',
                type: 'foreign_key_constraint'
            });
        }
        
        // Erro genérico do servidor
        return res.status(500).json({ 
            message: 'Erro interno do servidor ao criar agente. Contate o administrador.',
            type: 'internal_server_error'
        });
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
                        address: true,
                    }
                },
                agent_categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                icon: true
                            }
                        }
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
                        address: true,
                    }
                },
                agent_categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                color: true,
                                icon: true
                            }
                        }
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
        const param = req.params.agentId;
        const parsedId = parseInt(param);
        let existing = null;
        if (!isNaN(parsedId)) {
            existing = await prisma.agent.findUnique({ where: { id: parsedId }, include: { user: true } });
        } else {
            existing = await prisma.agent.findUnique({ where: { employee_id: param }, include: { user: true } });
        }
        if (!existing) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        // Separar campos válidos do modelo Agent
        const { employee_id, department, skills, max_tickets, is_active, categories, primary_subcategory_id } = agentData;

        // Atualizar status do usuário se fornecido (sincronização automática com Supabase)
        if (typeof is_active === 'boolean') {
            await updateUser(existing.user_id, { is_active });
        }

        // Atualizar categorias se fornecidas
        if (categories && Array.isArray(categories)) {
            // Verificar se todas as categorias existem
            const existingCategories = await prisma.category.findMany({
                where: {
                    id: { in: categories },
                    is_active: true
                }
            });

            if (existingCategories.length !== categories.length) {
                return res.status(400).json({ message: 'Uma ou mais categorias não existem ou estão inativas' });
            }

            // Remover categorias existentes
            await prisma.agentCategory.deleteMany({
                where: { agent_id: existing.id }
            });

            // Adicionar novas categorias
            if (categories.length > 0) {
                await prisma.agentCategory.createMany({
                    data: categories.map(categoryId => ({
                        agent_id: existing.id,
                        category_id: categoryId
                    }))
                });
            }
        }

        // Atualizar dados do agente
        const agent = await prisma.agent.update({
            where: { id: existing.id },
            data: {
                ...(employee_id !== undefined ? { employee_id } : {}),
                ...(department !== undefined ? { department } : {}),
                ...(skills !== undefined ? { skills } : {}),
                ...(max_tickets !== undefined ? { max_tickets } : {}),
                ...(primary_subcategory_id !== undefined ? { primary_subcategory_id } : {}),
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
                agent_categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                color: true,
                                icon: true
                            }
                        }
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
        const param = req.params.agentId;
        const parsedId = parseInt(param);
        let existing = null;
        if (!isNaN(parsedId)) {
            existing = await prisma.agent.findUnique({ where: { id: parsedId } });
        } else {
            existing = await prisma.agent.findUnique({ where: { employee_id: param } });
        }

        if (!existing) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        // Verificar se o agente tem tickets ativos atribuídos (não resolvidos/fechados)
        const activeAssignments = await prisma.ticketAssignment.count({
            where: {
                agent_id: existing.id,
                unassigned_at: null,
                ticket: {
                    status: {
                        notIn: ['Resolved', 'Closed', 'Cancelled']
                    }
                }
            }
        });

        if (activeAssignments > 0) {
            return res.status(400).json({ 
                message: 'Não é possível deletar um agente que possui tickets ativos atribuídos' 
            });
        }

        // Limpar todas as referências antes de deletar o agente
        await prisma.$transaction(async (tx) => {
            // Remover todas as atribuições de tickets (histórico)
            await tx.ticketAssignment.deleteMany({
                where: { agent_id: existing.id }
            });

            // Remover todas as solicitações de atribuição
            await tx.ticketAssignmentRequest.deleteMany({
                where: { agent_id: existing.id }
            });

            // Remover todas as avaliações do agente
            await tx.agentEvaluation.deleteMany({
                where: { agent_id: existing.id }
            });

            // Remover todas as categorias do agente
            await tx.agentCategory.deleteMany({
                where: { agent_id: existing.id }
            });

            // Agora deletar o agente
            await tx.agent.delete({
                where: { id: existing.id }
            });
        });

        // Tentar remover o usuário vinculado (ou desativar se houver vínculos)
        try {
            // Usar função do modelo para sincronização automática com Supabase
            await deleteUser(existing.user_id);
        } catch (err) {
            if (err && err.code === 'P2003') {
                // Se não conseguir excluir por dependências, desativar usuário (sincronização automática com Supabase)
                await updateUser(existing.user_id, { is_active: false });
            } else {
                throw err;
            }
        }

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
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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

// Controller para obter tickets atribuídos ao agente logado
async function getMyAssignedTicketsController(req, res) {
    try {
        const { page = 1, limit = 10, status, priority } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            assigned_to: req.user.id,
        };

        if (status) {
            whereClause.status = status;
        }

        if (priority) {
            whereClause.priority = priority;
        }

        // Debug log da consulta
        console.log('DEBUG - Where clause:', JSON.stringify(whereClause, null, 2));

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            select: {
                id: true,
                ticket_number: true,
                title: true,
                description: true,
                priority: true,
                status: true,
                assigned_to: true,
                category_id: true,
                subcategory_id: true,
                created_at: true,
                modified_at: true,
                due_date: true,
                location: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                },
                subcategory: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        department: true,
                        address: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                address: true,
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        created_at: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 5
                },
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        original_name: true,
                        file_size: true,
                        mime_type: true
                    }
                },
            },
            orderBy: [
                { priority: 'desc' },
                { created_at: 'asc' }
            ],
            skip: offset,
            take: parseInt(limit),
        });

        const totalTickets = await prisma.ticket.count({
            where: whereClause,
        });

        return res.status(200).json({
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalTickets,
                pages: Math.ceil(totalTickets / limit),
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets atribuídos:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets' });
    }
}

// Controller para alterar status do ticket
async function updateTicketStatusController(req, res) {
    try {
        const { ticketId } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty', 'Resolved'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status inválido' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                assigned_to: req.user.id,
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não atribuído a você' });
        }

        const updateData = {
            status,
        };

        // Se for resolvido, calcular tempo de resolução
        if (status === 'Resolved' && ticket.created_at) {
            const resolutionTime = Math.floor((new Date() - ticket.created_at) / (1000 * 60));
            updateData.resolution_time = resolutionTime;
            updateData.closed_at = new Date();
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: updateData,
            include: {
                category: true,
                client: {
                    include: {
                        user: true,
                    }
                },
                assignee: true,
            }
        });

        // Adicionar comentário com notas se fornecido
        if (notes) {
            await prisma.comment.create({
                data: {
                    ticket_id: parseInt(ticketId),
                    user_id: req.user.id,
                    content: `Status alterado para: ${status}\n\n${notes}`,
                    is_internal: false,
                }
            });
        }

        // Notificações
        try {
            if (status === 'Resolved') {
                await notificationService.notifyTicketCompleted(updatedTicket);
            } else {
                const changes = [{
                    ticket_id: updatedTicket.id,
                    field_name: 'status',
                    old_value: ticket.status,
                    new_value: status,
                    changed_by: req.user.id,
                }];
                await notificationService.notifyTicketUpdated(updatedTicket, changes);
            }
            // Se o ticket foi fechado pelo técnico, notificar também o técnico e admins já é coberto em notifyTicketCompleted
        } catch (notificationError) {
            console.error('Erro ao notificar alteração de status:', notificationError);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao alterar status do ticket:', error);
        return res.status(500).json({ message: 'Erro ao alterar status do ticket' });
    }
}

// Controller para adicionar comentário técnico
async function addTechnicalCommentController(req, res) {
    try {
        const { ticketId } = req.params;
        const { content, is_internal = false } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                assigned_to: req.user.id,
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não atribuído a você' });
        }

        const comment = await prisma.comment.create({
            data: {
                ticket_id: parseInt(ticketId),
                user_id: req.user.id,
                content: content.trim(),
                is_internal,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        // Notificar sobre novo comentário (cliente e técnico atribuídos)
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: parseInt(ticketId) },
                include: {
                    client: { include: { user: true } },
                    assignee: true,
                }
            });
            if (ticketWithDetails) {
                await notificationService.notifyCommentAdded(comment, ticketWithDetails);
            }
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de comentário técnico:', notificationError);
        }

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Erro ao adicionar comentário técnico:', error);
        return res.status(500).json({ message: 'Erro ao adicionar comentário' });
    }
}

// Controller para solicitar informações adicionais
async function requestAdditionalInfoController(req, res) {
    try {
        const { ticketId } = req.params;
        const { request_message } = req.body;

        if (!request_message || request_message.trim().length === 0) {
            return res.status(400).json({ message: 'Mensagem de solicitação é obrigatória' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                assigned_to: req.user.id,
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não atribuído a você' });
        }

        // Alterar status para aguardando cliente
        const updatedTicketStatus = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                status: 'WaitingForClient',
            }
        });

        // Adicionar comentário solicitando informações
        const comment = await prisma.comment.create({
            data: {
                ticket_id: parseInt(ticketId),
                user_id: req.user.id,
                content: `🔍 **Solicitação de Informações Adicionais**\n\n${request_message}\n\nPor favor, forneça as informações solicitadas para que possamos prosseguir com o atendimento.`,
                is_internal: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        // Notificar cliente: chamado em espera/aguardando cliente
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: parseInt(ticketId) },
                include: {
                    client: { include: { user: true } },
                    assignee: true,
                }
            });
            if (ticketWithDetails) {
                await notificationService.notifyTicketOnHold(ticketWithDetails, 'Aguardando informações do cliente');
            }
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de aguardando cliente:', notificationError);
        }

        return res.status(201).json({
            message: 'Solicitação de informações enviada com sucesso',
            comment,
            ticket_status: 'WaitingForClient'
        });
    } catch (error) {
        console.error('Erro ao solicitar informações adicionais:', error);
        return res.status(500).json({ message: 'Erro ao solicitar informações' });
    }
}

// Controller para obter histórico dos tickets atendidos
async function getMyTicketHistoryController(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const tickets = await prisma.ticket.findMany({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed', 'Cancelled']
                }
            },
            select: {
                id: true,
                ticket_number: true,
                title: true,
                description: true,
                priority: true,
                status: true,
                created_at: true,
                modified_at: true,
                closed_at: true,
                due_date: true,
                location: true,
                satisfaction_rating: true,
                resolution_time: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                },
                subcategory: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        department: true,
                        address: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                address: true,
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        attachments: true,
                    }
                }
            },
            orderBy: [
                {
                    closed_at: 'desc'
                },
                {
                    modified_at: 'desc'
                }
            ],
            skip: offset,
            take: parseInt(limit),
        });

        console.log('🔍 DEBUG - Histórico de tickets:', {
            totalTickets: tickets.length,
            sampleTicket: tickets[0] ? {
                id: tickets[0].id,
                satisfaction_rating: tickets[0].satisfaction_rating,
                resolution_time: tickets[0].resolution_time,
                status: tickets[0].status
            } : null
        });

        const totalTickets = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed', 'Cancelled']
                }
            }
        });

        return res.status(200).json({
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalTickets,
                pages: Math.ceil(totalTickets / limit),
            }
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de tickets:', error);
        return res.status(500).json({ message: 'Erro ao buscar histórico' });
    }
}

// Controller para obter estatísticas pessoais do agente
async function getMyStatisticsController(req, res) {
    try {
        const agentId = req.user.agent.id;

        const totalAssignedTickets = await prisma.ticket.count({
            where: { assigned_to: req.user.id }
        });

        const activeTickets = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
                }
            }
        });

        const resolvedTickets = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: 'Resolved'
            }
        });

        const totalResolutionTime = await prisma.ticket.aggregate({
            where: {
                assigned_to: req.user.id,
                resolution_time: {
                    not: null
                }
            },
            _sum: {
                resolution_time: true
            }
        });

        const avgSatisfaction = await prisma.ticket.aggregate({
            where: {
                assigned_to: req.user.id,
                satisfaction_rating: {
                    not: null
                }
            },
            _avg: {
                satisfaction_rating: true
            }
        });

        // Log detalhado dos dados de satisfação
        console.log('🔍 DEBUG - Dados de satisfação:', {
            avgSatisfaction: avgSatisfaction._avg.satisfaction_rating,
            userId: req.user.id
        });

        // Buscar todos os tickets resolvidos/fechados para incluir na lista de avaliações
        const allRatings = await prisma.ticket.findMany({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed']
                }
            },
            select: {
                id: true,
                ticket_number: true,
                satisfaction_rating: true,
                status: true,
                closed_at: true,
                title: true
            },
            orderBy: {
                closed_at: 'desc'
            }
        });

        // Buscar também tickets sem avaliação para debug completo
        const allTicketsForDebug = await prisma.ticket.findMany({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed']
                }
            },
            select: {
                id: true,
                ticket_number: true,
                satisfaction_rating: true,
                status: true,
                closed_at: true,
                title: true
            },
            orderBy: {
                closed_at: 'desc'
            }
        });

        // Buscar todos os tickets resolvidos/fechados para debug
        const allResolvedTickets = await prisma.ticket.findMany({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed']
                }
            },
            select: {
                id: true,
                ticket_number: true,
                satisfaction_rating: true,
                status: true,
                closed_at: true,
                title: true
            },
            orderBy: {
                closed_at: 'desc'
            }
        });

        console.log('🔍 DEBUG - Todos os ratings:', allRatings);
        console.log('🔍 DEBUG - Todos os tickets resolvidos/fechados:', allResolvedTickets);
        console.log('🔍 DEBUG - Tickets com satisfaction_rating null:', allResolvedTickets.filter(t => t.satisfaction_rating === null).length);
        console.log('🔍 DEBUG - Tickets com satisfaction_rating > 0:', allResolvedTickets.filter(t => t.satisfaction_rating && t.satisfaction_rating > 0).length);
        console.log('🔍 DEBUG - Todos os tickets para debug:', allTicketsForDebug);
        console.log('🔍 DEBUG - Tickets sem avaliação:', allTicketsForDebug.filter(t => !t.satisfaction_rating || t.satisfaction_rating === null).length);
        console.log('🔍 DEBUG - Tickets com avaliação:', allTicketsForDebug.filter(t => t.satisfaction_rating && t.satisfaction_rating > 0).length);

        // Verificar se há tickets atribuídos ao usuário
        const totalTicketsAssigned = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id
            }
        });

        console.log('🔍 DEBUG - Total de tickets atribuídos:', totalTicketsAssigned);



        const ticketsByStatusData = await prisma.ticket.groupBy({
            by: ['status'],
            where: { assigned_to: req.user.id },
            _count: {
                id: true
            }
        });

        // Calcular tickets concluídos hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const completedToday = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: {
                    in: ['Resolved', 'Closed']
                },
                closed_at: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Calcular tickets em andamento
        const inProgressTickets = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: 'InProgress'
            }
        });

        // Calcular tickets aguardando cliente
        const waitingForClient = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: 'WaitingForClient'
            }
        });

        // Calcular tempo médio de resolução
        const totalResolutionTimeMinutes = totalResolutionTime._sum.resolution_time || 0;
        const resolvedTicketsCount = resolvedTickets + await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: 'Closed'
            }
        });
        
        let avgResolutionTimeMinutes = 0;
        if (resolvedTicketsCount > 0 && totalResolutionTimeMinutes > 0) {
            avgResolutionTimeMinutes = Math.round(totalResolutionTimeMinutes / resolvedTicketsCount);
        }
        
        const avgResolutionTimeHours = Math.round((avgResolutionTimeMinutes / 60) * 10) / 10;
        const formattedAvgTime = avgResolutionTimeHours > 0 ? `${avgResolutionTimeHours}h` : '0h';
        
        console.log('🔍 DEBUG - Cálculo do tempo médio:', {
            totalResolutionTimeMinutes,
            resolvedTicketsCount,
            avgResolutionTimeMinutes,
            avgResolutionTimeHours,
            formattedAvgTime
        });

        // Converter ticketsByStatus para o formato esperado pelo frontend
        const ticketsByStatus = {};
        ticketsByStatusData.forEach(item => {
            ticketsByStatus[item.status] = item._count.id;
        });

        // Calcular tickets por prioridade
        const ticketsByPriority = await prisma.ticket.groupBy({
            by: ['priority'],
            where: { assigned_to: req.user.id },
            _count: {
                id: true
            }
        });

        const priorityBreakdown = {};
        ticketsByPriority.forEach(item => {
            priorityBreakdown[item.priority] = item._count.id;
        });

        const statistics = {
            totalAssignedTickets: totalAssignedTickets,
            resolvedTickets: resolvedTickets,
            totalResolutionTime: totalResolutionTimeMinutes,
            avgResolutionTime: formattedAvgTime,
            avgSatisfaction: Math.round((avgSatisfaction._avg.satisfaction_rating || 0) * 10) / 10,
            ticketsByStatus: ticketsByStatus,
            ticketsByPriority: priorityBreakdown,
            completedToday: completedToday,
            inProgressTickets: inProgressTickets,
            waitingForClient: waitingForClient,
            allSatisfactionRatings: allRatings, // Todas as avaliações individuais
            agentRating: req.user.agent.rating || 0 // Rating pessoal do agente
        };

        console.log('🔍 DEBUG - Estatísticas finais:', statistics);

        return res.status(200).json(statistics);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
}

// Controller para buscar tickets disponíveis para aceitar
async function getAvailableTicketsController(req, res) {
    console.log('🔍 DEBUG - getAvailableTicketsController CHAMADA!');
    console.log('🔍 DEBUG - req.user:', JSON.stringify(req.user, null, 2));
    
    try {
        const { page = 1, limit = 10, category_id, priority } = req.query;
        const offset = (page - 1) * limit;

        // Verificar se o agente tem um registro Agent
        if (!req.user.agent) {
            console.log('🔍 DEBUG - ERRO: Usuário não possui registro de agente válido');
            return res.status(400).json({ message: 'Usuário não possui registro de agente válido' });
        }

        // Buscar as categorias associadas ao agente
        const agentCategories = await prisma.agentCategory.findMany({
            where: { agent_id: req.user.agent.id },
            select: { category_id: true }
        });

        const agentCategoryIds = agentCategories.map(ac => ac.category_id);
        
        console.log('🔍 DEBUG - Agent ID:', req.user.agent.id);
        console.log('🔍 DEBUG - Agent Categories:', agentCategories);
        console.log('🔍 DEBUG - Agent Category IDs:', agentCategoryIds);

        // Se o agente não tem categorias associadas, retornar lista vazia
        if (agentCategoryIds.length === 0) {
            console.log('🔍 DEBUG - Agente não tem categorias associadas');
            return res.status(200).json({
                tickets: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalTickets: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }

        // FILTRO CORRIGIDO: Apenas tickets não atribuídos, abertos e da categoria do agente
        const whereClause = {
            assigned_to: null, // Tickets não atribuídos
            status: 'Open', // Apenas tickets abertos
            category_id: { in: agentCategoryIds } // APENAS categorias do agente
        };

        console.log('🔍 DEBUG - Where clause inicial:', JSON.stringify(whereClause, null, 2));

        if (category_id) {
            // Verificar se a categoria solicitada está nas categorias do agente
            const requestedCategoryId = parseInt(category_id);
            if (agentCategoryIds.includes(requestedCategoryId)) {
                whereClause.category_id = requestedCategoryId;
                console.log('🔍 DEBUG - Filtro por categoria específica:', requestedCategoryId);
            } else {
                console.log('🔍 DEBUG - Categoria solicitada não pertence ao agente');
                // Se a categoria não pertence ao agente, retornar lista vazia
                return res.status(200).json({
                    tickets: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalTickets: 0,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                });
            }
        }

        if (priority) {
            whereClause.priority = priority;
            console.log('🔍 DEBUG - Filtro por prioridade:', priority);
        }

        console.log('🔍 DEBUG - Where clause final:', JSON.stringify(whereClause, null, 2));

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            select: {
                id: true,
                ticket_number: true,
                title: true,
                description: true,
                priority: true,
                status: true,
                created_at: true,
                modified_at: true,
                due_date: true,
                location: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                },
                subcategory: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        created_at: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 3
                },
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        original_name: true,
                        file_size: true,
                        mime_type: true
                    }
                },
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: offset,
            take: parseInt(limit)
        });

        const totalTickets = await prisma.ticket.count({
            where: whereClause
        });
        
        console.log('🔍 DEBUG - Total tickets encontrados:', totalTickets);
        console.log('🔍 DEBUG - Tickets retornados:', tickets.length);
        console.log('🔍 DEBUG - Tickets IDs:', tickets.map(t => ({ id: t.id, category_id: t.category_id, title: t.title })));

        const totalPages = Math.ceil(totalTickets / limit);

        return res.status(200).json({
            tickets,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalTickets,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets disponíveis:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets disponíveis' });
    }
}

// Controller para atualizar ticket com relatório
async function updateTicketWithReportController(req, res) {
    try {
        const { ticketId } = req.params;
        const { status, due_date, report } = req.body;

        // Verificar se o agente tem um registro Agent
        if (!req.user.agent) {
            return res.status(400).json({ message: 'Usuário não possui registro de agente válido' });
        }

        // Verificar se o ticket existe e está atribuído ao agente
        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                assigned_to: req.user.id,
            },
            include: {
                category: true,
                subcategory: true,
                client: {
                    include: {
                        user: true,
                    }
                },
                assignee: true,
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não atribuído a você' });
        }

        // Validar status
        const validStatuses = ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status inválido' });
        }

        // Preparar dados de atualização
        const updateData = {
            status,
        };

        // Adicionar prazo se fornecido
        if (due_date) {
            updateData.due_date = new Date(due_date);
        }

        // Se for resolvido, calcular tempo de resolução
        if (status === 'Resolved' && ticket.created_at) {
            const resolutionTime = Math.floor((new Date() - ticket.created_at) / (1000 * 60));
            updateData.resolution_time = resolutionTime;
            updateData.closed_at = new Date();
        }

        // Atualizar o ticket
        const updatedTicket = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: updateData,
            include: {
                category: true,
                subcategory: true,
                client: {
                    include: {
                        user: true,
                    }
                },
                assignee: true,
            }
        });

        // Adicionar comentário com relatório
        let createdReportComment = null;
        if (report && report.trim()) {
            createdReportComment = await prisma.comment.create({
                data: {
                    ticket_id: parseInt(ticketId),
                    user_id: req.user.id,
                    content: `📋 **Relatório do Técnico**\n\n${report.trim()}`,
                    is_internal: false,
                },
                include: {
                    user: {
                        select: { id: true, name: true }
                    }
                }
            });
        }

        // Enviar notificação para o cliente sobre atualização
        try {
            const changes = [{
                ticket_id: updatedTicket.id,
                field_name: 'status',
                old_value: ticket.status,
                new_value: status,
                changed_by: req.user.id,
            }];

            if (due_date && ticket.due_date !== due_date) {
                changes.push({
                    ticket_id: updatedTicket.id,
                    field_name: 'due_date',
                    old_value: ticket.due_date?.toISOString() || null,
                    new_value: due_date,
                    changed_by: req.user.id,
                });
            }

            await notificationService.notifyTicketUpdated(updatedTicket, changes);
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de atualização:', notificationError);
        }

        return res.status(200).json({
            message: 'Ticket atualizado com sucesso',
            ticket: updatedTicket,
            comment: createdReportComment ? { id: createdReportComment.id, user: createdReportComment.user } : null,
        });
    } catch (error) {
        console.error('Erro ao atualizar ticket:', error);
        return res.status(500).json({ message: 'Erro ao atualizar ticket' });
    }
}

// Controller para aceitar um ticket disponível
async function acceptTicketController(req, res) {
    try {
        const { ticketId } = req.params;

        // Verificar se o agente tem um registro Agent
        if (!req.user.agent) {
            return res.status(400).json({ message: 'Usuário não possui registro de agente válido' });
        }

        // Limite de tickets ativos por técnico (máximo 3)
        const activeCount = await prisma.ticket.count({
            where: {
                assigned_to: req.user.id,
                status: { in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'] }
            }
        });

        if (activeCount >= 3) {
            return res.status(400).json({ message: 'Limite de 3 tickets ativos atingido. Conclua ou libere um ticket antes de aceitar outro.' });
        }

        // Buscar as categorias associadas ao agente
        const agentCategories = await prisma.agentCategory.findMany({
            where: { agent_id: req.user.agent.id },
            select: { category_id: true }
        });

        const agentCategoryIds = agentCategories.map(ac => ac.category_id);

        // Verificar se o ticket existe e está disponível (não atribuído)
        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                assigned_to: null, // Ticket não atribuído
                status: 'Open', // Ticket aberto
                category_id: { in: agentCategoryIds } // Apenas categorias do agente
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado, não está disponível para aceitação ou não pertence às suas categorias' });
        }

        // Atualizar ticket - atribuir ao agente logado e alterar status
        const updatedTicket = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                assigned_to: req.user.id,
                status: 'InProgress'
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
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
            }
        });

        // Registrar atribuição
        await prisma.ticketAssignment.create({
            data: {
                ticket_id: parseInt(ticketId),
                agent_id: req.user.agent.id,
                assigned_by: req.user.id,
            }
        });

        // Registrar no histórico
        await prisma.ticketHistory.create({
            data: {
                ticket_id: parseInt(ticketId),
                field_name: 'assigned_to',
                old_value: null,
                new_value: req.user.id.toString(),
                changed_by: req.user.id,
            }
        });

        // Adicionar comentário automático
        await prisma.comment.create({
            data: {
                ticket_id: parseInt(ticketId),
                user_id: req.user.id,
                content: `✅ **Ticket aceito pelo técnico ${req.user.name}**\n\nTicket aceito e iniciado o atendimento.`,
                is_internal: false,
            }
        });

        // Enviar notificação sobre aceitação do ticket
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: parseInt(ticketId) },
                include: {
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
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                }
            });

            const agentWithUser = await prisma.agent.findUnique({
                where: { id: req.user.agent.id },
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

            await notificationService.notifyTicketAccepted(ticketWithDetails, agentWithUser);
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de aceitação:', notificationError);
        }

        return res.status(200).json({
            message: 'Ticket aceito com sucesso',
            ticket: updatedTicket
        });
    } catch (error) {
        console.error('Erro ao aceitar ticket:', error);
        return res.status(500).json({ message: 'Erro ao aceitar ticket' });
    }
}

// Controller para agente visualizar suas próprias avaliações
async function getMyEvaluationsController(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Buscar avaliações do agente (apenas não confidenciais)
        const evaluations = await prisma.agentEvaluation.findMany({
            where: {
                agent_id: req.user.agent.id,
                is_confidential: false
            },
            include: {
                evaluator: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { evaluation_date: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        // Contar total
        const total = await prisma.agentEvaluation.count({
            where: {
                agent_id: req.user.agent.id,
                is_confidential: false
            }
        });

        return res.status(200).json({
            evaluations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações do agente:', error);
        return res.status(500).json({ message: 'Erro ao buscar avaliações' });
    }
}

// Controller para agente visualizar suas estatísticas de avaliação
async function getMyEvaluationStatsController(req, res) {
    try {
        // Buscar todas as avaliações do agente (apenas não confidenciais)
        const evaluations = await prisma.agentEvaluation.findMany({
            where: {
                agent_id: req.user.agent.id,
                is_confidential: false
            },
            select: {
                technical_skills: true,
                communication: true,
                problem_solving: true,
                teamwork: true,
                punctuality: true,
                overall_rating: true,
                evaluation_date: true
            }
        });

        if (evaluations.length === 0) {
            return res.status(200).json({
                totalEvaluations: 0,
                averageRatings: {
                    technical_skills: 0,
                    communication: 0,
                    problem_solving: 0,
                    teamwork: 0,
                    punctuality: 0,
                    overall_rating: 0
                },
                lastEvaluation: null,
                improvementTrend: null
            });
        }

        // Calcular médias
        const totalEvaluations = evaluations.length;
        const averageRatings = {
            technical_skills: evaluations.reduce((sum, e) => sum + e.technical_skills, 0) / totalEvaluations,
            communication: evaluations.reduce((sum, e) => sum + e.communication, 0) / totalEvaluations,
            problem_solving: evaluations.reduce((sum, e) => sum + e.problem_solving, 0) / totalEvaluations,
            teamwork: evaluations.reduce((sum, e) => sum + e.teamwork, 0) / totalEvaluations,
            punctuality: evaluations.reduce((sum, e) => sum + e.punctuality, 0) / totalEvaluations,
            overall_rating: evaluations.reduce((sum, e) => sum + e.overall_rating, 0) / totalEvaluations
        };

        // Arredondar para 1 casa decimal
        Object.keys(averageRatings).forEach(key => {
            averageRatings[key] = Math.round(averageRatings[key] * 10) / 10;
        });

        // Última avaliação
        const lastEvaluation = evaluations.sort((a, b) => 
            new Date(b.evaluation_date) - new Date(a.evaluation_date)
        )[0];

        // Tendência de melhoria (comparar últimas 2 avaliações)
        let improvementTrend = null;
        if (evaluations.length >= 2) {
            const sortedEvaluations = evaluations.sort((a, b) => 
                new Date(b.evaluation_date) - new Date(a.evaluation_date)
            );
            const latest = sortedEvaluations[0];
            const previous = sortedEvaluations[1];
            
            const difference = latest.overall_rating - previous.overall_rating;
            improvementTrend = {
                change: difference,
                percentage: Math.round((difference / previous.overall_rating) * 100),
                trend: difference > 0 ? 'improving' : difference < 0 ? 'declining' : 'stable'
            };
        }

        return res.status(200).json({
            totalEvaluations,
            averageRatings,
            lastEvaluation,
            improvementTrend
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas de avaliação:', error);
        return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
}

// Controller para avaliar um agente (técnico)
async function evaluateAgentController(req, res) {
    try {
        const { agentId } = req.params;
        const {
            technical_skills,
            communication,
            problem_solving,
            teamwork,
            punctuality,
            overall_rating,
            strengths,
            weaknesses,
            recommendations,
            comments,
            is_confidential
        } = req.body;

        // Validar se o agente existe
        const agent = await prisma.agent.findUnique({
            where: { id: parseInt(agentId) },
            include: { user: true }
        });

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        // Validar ratings (1-5)
        const ratings = [technical_skills, communication, problem_solving, teamwork, punctuality, overall_rating];
        for (const rating of ratings) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Avaliações devem ser entre 1 e 5' });
            }
        }

        // Criar avaliação
        const evaluation = await prisma.agentEvaluation.create({
            data: {
                agent_id: parseInt(agentId),
                technical_skills: parseFloat(technical_skills),
                communication: parseFloat(communication),
                problem_solving: parseFloat(problem_solving),
                teamwork: parseFloat(teamwork),
                punctuality: parseFloat(punctuality),
                overall_rating: parseFloat(overall_rating),
                strengths: strengths || undefined,
                weaknesses: weaknesses || undefined,
                recommendations: recommendations || undefined,
                comments: comments || undefined,
                is_confidential: is_confidential || false,
                evaluator_id: req.user.id
            }
        });

        // Calcular e atualizar rating médio do agente
        const allEvaluations = await prisma.agentEvaluation.findMany({
            where: { agent_id: parseInt(agentId) }
        });

        const averageRating = allEvaluations.reduce((sum, e) => sum + e.overall_rating, 0) / allEvaluations.length;
        
        // Atualizar o rating do agente no banco
        await prisma.agent.update({
            where: { id: parseInt(agentId) },
            data: { rating: Math.round(averageRating * 10) / 10 }
        });

        // Notificar o agente sobre a nova avaliação
        try {
            await notificationService.notifyUser(
                agent.user.id,
                'NEW_EVALUATION',
                'Nova avaliação recebida',
                `Você recebeu uma nova avaliação com nota ${overall_rating}/5.`,
                'info',
                { evaluationId: evaluation.id, rating: overall_rating }
            );
        } catch (e) {
            console.error('Erro ao notificar agente sobre avaliação:', e);
        }

        return res.status(201).json({
            message: 'Avaliação criada com sucesso',
            evaluation,
            newAverageRating: Math.round(averageRating * 10) / 10
        });

    } catch (error) {
        console.error('Erro ao avaliar agente:', error);
        return res.status(500).json({ message: 'Erro ao criar avaliação' });
    }
}

// Controller para listar todas as avaliações (apenas para admin)
async function getAllEvaluationsController(req, res) {
    try {
        const { page = 1, limit = 10, agent_id, is_confidential } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (agent_id) {
            where.agent_id = parseInt(agent_id);
        }
        if (is_confidential !== undefined) {
            where.is_confidential = is_confidential === 'true';
        }

        const evaluations = await prisma.agentEvaluation.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                evaluator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { evaluation_date: 'desc' },
            skip,
            take: parseInt(limit)
        });

        const total = await prisma.agentEvaluation.count({ where });

        return res.status(200).json({
            evaluations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        return res.status(500).json({ message: 'Erro ao buscar avaliações' });
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
    getMyAssignedTicketsController,
    updateTicketStatusController,
    updateTicketWithReportController,
    addTechnicalCommentController,
    requestAdditionalInfoController,
    getMyTicketHistoryController,
    getMyStatisticsController,
    getAvailableTicketsController,
    acceptTicketController,
    getMyEvaluationsController,
    getMyEvaluationStatsController,
    evaluateAgentController,
    getAllEvaluationsController,
};