import prisma from '../../prisma/client.js';
import { ticketCreateSchema, ticketUpdateSchema } from '../schemas/ticket.schema.js';
import { ZodError } from 'zod/v4';
import notificationService from '../services/NotificationService.js';
import { cache, generateCacheKey, invalidateCacheByPattern } from '../utils/cache.js';
import fs from 'fs/promises';
import path from 'path';

// Usa prisma singleton

// Gerar número único do ticket
function generateTicketNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKT-${timestamp.slice(-6)}-${random}`;
}

// Controller para criar um novo ticket
async function createTicketController(req, res) {
    let ticketData;
    let ticket;

    try {
        ticketData = ticketCreateSchema.parse(req.body);
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
        const ticketNumber = generateTicketNumber();
        
        // Debug: Log das informações do usuário
        console.log('Debug - req.user:', {
            id: req.user.id,
            role: req.user.role,
            client: req.user.client ? { id: req.user.client.id } : null
        });

        // Determinar o client_id do ticket conforme o papel do usuário
        let resolvedClientId = undefined;
        if (req.user.role === 'Client') {
            if (!req.user.client) {
                console.log('❌ Usuário Client não possui registro de cliente válido');
                return res.status(400).json({ 
                    message: 'Usuário Client não possui registro de cliente válido. Entre em contato com o administrador.' 
                });
            }
            resolvedClientId = req.user.client.id;
        } else {
            // Admin/Agent
            if (ticketData.client_id) {
                // Validar se o client informado existe
                const existingClient = await prisma.client.findUnique({ where: { id: ticketData.client_id } });
                if (!existingClient) {
                    return res.status(400).json({ message: 'client_id informado não existe' });
                }
                resolvedClientId = ticketData.client_id;
            } else if (req.user.client) {
                // Se o usuário também possui perfil de Client, usar esse id
                resolvedClientId = req.user.client.id;
            } else {
                // Cria um registro Client mínimo para permitir a abertura do ticket
                const createdClient = await prisma.client.create({
                    data: {
                        user_id: req.user.id,
                    }
                });
                resolvedClientId = createdClient.id;
            }
        }

        console.log('🔍 Tentando criar ticket com client_id:', resolvedClientId);
        
        console.log('🔍 Dados do ticket a serem criados:', {
            title: ticketData.title,
            description: ticketData.description,
            priority: ticketData.priority,
            ticket_number: ticketNumber,
            creator_id: req.user.id,
            client_id: resolvedClientId,
            category_id: ticketData.category_id,
            subcategory_id: ticketData.subcategory_id
        });

        console.log('🔍 Iniciando criação do ticket no Prisma...');
        ticket = await prisma.ticket.create({
            data: {
                title: ticketData.title,
                description: ticketData.description,
                priority: ticketData.priority,
                ticket_number: ticketNumber,
                created_by: req.user.id,
                client_id: resolvedClientId,
                category_id: ticketData.category_id,
                subcategory_id: ticketData.subcategory_id,
                location: ticketData.location,
                due_date: ticketData.deadline ? (() => {
                    try {
                        const date = new Date(ticketData.deadline);
                        return isNaN(date.getTime()) ? null : date;
                    } catch (error) {
                        console.warn('Data inválida para due_date:', ticketData.deadline);
                        return null;
                    }
                })() : null
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
            }
        });

        console.log('✅ Ticket criado com sucesso:', ticket.ticket_number);

        // Enviar notificação sobre criação do ticket
        try {
            await notificationService.notifyTicketCreated(ticket);
            console.log('✅ Notificação de criação de ticket enviada');
        } catch (notificationError) {
            console.error('❌ Erro ao enviar notificação de criação de ticket:', notificationError);
        }

        // Invalidar cache relacionado
        invalidateCacheByPattern('ticket_list');
        invalidateCacheByPattern('statistics');
        invalidateCacheByPattern('agent_home');
        invalidateCacheByPattern('client_home');

        // Processar solicitações de atribuição de forma assíncrona
        setImmediate(async () => {
            try {
                // Buscar agentes da categoria
                const agentsInCategory = await prisma.agentCategory.findMany({
                    where: {
                        category_id: ticket.category_id
                    },
                    include: {
                        agent: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (agentsInCategory.length > 0) {
                    console.log(`🔍 Encontrados ${agentsInCategory.length} agentes para a categoria ${ticket.category_id}`);

                    // Criar solicitações de atribuição
                    for (const agentCategory of agentsInCategory) {
                        await prisma.ticketAssignmentRequest.create({
                            data: {
                                ticket_id: ticket.id,
                                agent_id: agentCategory.agent_id
                            }
                        });

                        // Enviar notificação para o agente sobre nova solicitação
                        try {
                            const request = await prisma.ticketAssignmentRequest.findFirst({
                                where: {
                                    ticket_id: ticket.id,
                                    agent_id: agentCategory.agent_id
                                },
                                include: {
                                    agent: {
                                        include: {
                                            user: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    email: true
                                                }
                                            }
                                        }
                                    },
                                    ticket: {
                                        include: {
                                            category: true,
                                            subcategory: true
                                        }
                                    }
                                }
                            });

                            if (request) {
                                await notificationService.notifyAssignmentRequest(request);
                            }
                        } catch (notificationError) {
                            console.error('Erro ao enviar notificação de solicitação:', notificationError);
                        }
                    }

                    console.log(`✅ ${agentsInCategory.length} solicitações de atribuição criadas para o ticket ${ticket.ticket_number}`);
                } else {
                    console.log(`⚠️ Nenhum agente encontrado para a categoria ${ticket.category_id}`);
                }
            } catch (assignmentError) {
                console.error('Erro ao criar solicitações de atribuição:', assignmentError);
                // Não falhar a criação do ticket por erro de atribuição
            }
        });

        return res.status(201).json(ticket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        return res.status(500).json({ message: 'Erro ao criar ticket' });
    }
}

// Controller para listar todos os tickets com cache e otimizações
async function getAllTicketsController(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            priority, 
            category_id,
            assigned_to,
            search 
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const where = {};
        
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category_id) where.category_id = parseInt(category_id);
        if (assigned_to) where.assigned_to = parseInt(assigned_to);
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { ticket_number: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Se for cliente, mostrar apenas seus tickets
        if (req.user.role === 'Client') {
            where.client_id = req.user.client.id;
        }

        // Verificar cache
        const cacheKey = generateCacheKey('ticket_list', {
            page,
            limit,
            status,
            priority,
            category_id,
            assigned_to,
            search,
            userRole: req.user.role,
            clientId: req.user.client?.id
        });

        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return res.status(200).json(cachedResult);
        }

        // Consulta otimizada com includes reduzidos
        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
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
                            agent: {
                                select: {
                                    id: true,
                                    employee_id: true,
                                    department: true
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
                    created_at: 'desc'
                },
                skip,
                take: parseInt(limit),
            }),
            prisma.ticket.count({ where })
        ]);

        const result = {
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };

        // Cache por 30 segundos para listas de tickets
        cache.set(cacheKey, result, 30 * 1000);
        
        // Invalidar cache relacionado para forçar atualização
        invalidateCacheByPattern('ticket_list');

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets' });
    }
}

// Controller para obter um ticket específico com cache
async function getTicketByIdController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        const where = { id: ticketId };
        
        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client') {
            where.client_id = req.user.client.id;
        }

        // Verificar cache
        const cacheKey = generateCacheKey('ticket_detail', { 
            ticketId, 
            userRole: req.user.role,
            clientId: req.user.client?.id 
        });

        const cachedTicket = cache.get(cacheKey);
        if (cachedTicket) {
            return res.status(200).json(cachedTicket);
        }

        const ticket = await prisma.ticket.findFirst({
            where,
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
                resolution_time: true,
                satisfaction_rating: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        description: true
                    }
                },
                subcategory: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        company: true,
                        client_type: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true
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
                        agent: {
                            select: {
                                id: true,
                                employee_id: true,
                                department: true
                            }
                        }
                    }
                },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        is_internal: true,
                        created_at: true,
                        modified_at: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
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
                        created_at: 'asc'
                    }
                },
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        original_name: true,
                        file_size: true,
                        mime_type: true,
                        created_at: true
                    }
                },
                ticket_history: {
                    select: {
                        id: true,
                        field_name: true,
                        old_value: true,
                        new_value: true,
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
                    }
                },
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Cache por 1 minuto para detalhes de ticket
        cache.set(cacheKey, ticket, 60 * 1000);

        return res.status(200).json(ticket);
    } catch (error) {
        console.error('Erro ao buscar ticket:', error);
        return res.status(500).json({ message: 'Erro ao buscar ticket' });
    }
}

// Controller para atualizar um ticket
async function updateTicketController(req, res) {
    let ticketData;

    try {
        console.log('🔍 Dados recebidos para atualização:', req.body);
        console.log('🔍 Tipo dos dados:', typeof req.body);
        console.log('🔍 Chaves dos dados:', Object.keys(req.body));
        
        ticketData = ticketUpdateSchema.parse(req.body);
        console.log('✅ Dados validados com sucesso:', ticketData);
    } catch (error) {
        console.error('❌ Erro na validação:', error);
        console.error('❌ Tipo do erro:', error.constructor.name);
        
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            console.log('❌ Erros de validação:', formatted);
            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
        // Se não for ZodError, retornar erro genérico
        return res.status(400).json({
            message: 'Erro na validação dos dados',
            error: error.message
        });
    }

    try {
        const ticketId = parseInt(req.params.ticketId);
        
        // Verificar se o ticket existe
        const existingTicket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!existingTicket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Se for cliente, verificar se o ticket pertence a ele e se ainda pode editar
        if (req.user.role === 'Client') {
            console.log('🔍 Debug - Cliente tentando editar ticket:', {
                ticketId: ticketId,
                clientId: existingTicket.client_id,
                userClientId: req.user.client?.id,
                assignedTo: existingTicket.assigned_to,
                status: existingTicket.status,
                userRole: req.user.role
            })
            
            if (existingTicket.client_id !== req.user.client.id) {
                console.log('🔍 Debug - Acesso negado: ticket não pertence ao cliente')
                return res.status(403).json({ message: 'Acesso negado' });
            }
            
            // Cliente pode editar apenas tickets abertos ou aguardando cliente
            // NÃO pode editar quando técnico aceitar (InProgress) ou tickets finalizados
            const allowedStatuses = ['Open', 'WaitingForClient', 'WaitingForThirdParty'];
            
            if (!allowedStatuses.includes(existingTicket.status)) {
                console.log('🔍 Debug - Edição bloqueada: status não permite edição pelo cliente - status:', existingTicket.status)
                return res.status(403).json({ 
                    message: `Chamado não pode ser editado no status atual (${existingTicket.status}).` 
                });
            }
            
            console.log('🔍 Debug - Cliente autorizado a editar ticket - status:', existingTicket.status)
        }

        const dataToUpdate = { ...ticketData };

        // Se category_id/subcategory_id existirem, conectar via relação
        if (ticketData.category_id !== undefined) {
            dataToUpdate.category = { connect: { id: ticketData.category_id } };
            delete dataToUpdate.category_id;
        }
        if (ticketData.subcategory_id !== undefined) {
            dataToUpdate.subcategory = ticketData.subcategory_id
                ? { connect: { id: ticketData.subcategory_id } }
                : { disconnect: true };
            delete dataToUpdate.subcategory_id;
        }

        if (ticketData.client_id !== undefined) {
            dataToUpdate.client = { connect: { id: ticketData.client_id } };
            delete dataToUpdate.client_id;
        }

        if (ticketData.assigned_to !== undefined) {
            dataToUpdate.assignee = ticketData.assigned_to
                ? { connect: { id: ticketData.assigned_to } }
                : { disconnect: true };
            delete dataToUpdate.assigned_to;
        }

        // Registrar histórico de mudanças
        const changes = [];
        for (const [key, value] of Object.entries(ticketData)) {
            const oldValue = existingTicket[key];
            if (oldValue !== value) {
                changes.push({
                    ticket_id: ticketId,
                    field_name: key,
                    old_value: oldValue?.toString() || null,
                    new_value: value?.toString() || null,
                    changed_by: req.user.id,
                });
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: dataToUpdate,
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

        // Criar registros de histórico
        if (changes.length > 0) {
            await prisma.ticketHistory.createMany({
                data: changes
            });
        }

        // Enviar notificação de atualização de ticket
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    client: { include: { user: true } },
                    assignee: true,
                }
            });
            await notificationService.notifyTicketUpdated(ticketWithDetails, changes);
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de atualização de ticket:', notificationError);
        }

        return res.status(200).json(ticket);
    } catch (error) {
        console.error('Erro ao atualizar ticket:', error);
        return res.status(500).json({ message: 'Erro ao atualizar ticket' });
    }
}

// Controller para atribuir ticket a um agente
async function assignTicketController(req, res) {
    try {
        const { agent_id } = req.body;
        const ticketId = parseInt(req.params.ticketId);

        if (!agent_id) {
            return res.status(400).json({ message: 'ID do agente é obrigatório' });
        }

        // Verificar se o agente existe
        const agent = await prisma.agent.findUnique({
            where: { id: agent_id },
            include: { user: true }
        });

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Atualizar ticket
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assigned_to: agent.user_id,
                status: 'InProgress'
            },
            include: {
                assignee: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                employee_id: true,
                                department: true
                            }
                        }
                    }
                }
            }
        });

        // Registrar atribuição
        await prisma.ticketAssignment.create({
            data: {
                ticket_id: ticketId,
                agent_id: agent_id,
                assigned_by: req.user.id,
            }
        });

        // Registrar no histórico
        await prisma.ticketHistory.create({
            data: {
                ticket_id: ticketId,
                field_name: 'assigned_to',
                old_value: ticket.assigned_to?.toString() || null,
                new_value: agent.user_id.toString(),
                changed_by: req.user.id,
            }
        });

        // Notificar agente e cliente sobre a atribuição
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    client: { include: { user: true } },
                    assignee: true,
                }
            });
            const agentWithUser = await prisma.agent.findUnique({
                where: { user_id: agent.user_id },
                include: { user: true },
            });
            if (ticketWithDetails && agentWithUser) {
                await notificationService.notifyTicketAssigned(ticketWithDetails, agentWithUser);
            }
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de atribuição:', notificationError);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao atribuir ticket:', error);
        return res.status(500).json({ message: 'Erro ao atribuir ticket' });
    }
}

// Controller para fechar um ticket
async function closeTicketController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const { satisfaction_rating } = req.body;

        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client' && ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        const updateData = {
            status: 'Closed',
            closed_at: new Date(),
        };

        if (satisfaction_rating && req.user.role === 'Client') {
            updateData.satisfaction_rating = satisfaction_rating;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
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

        // Registrar no histórico
        await prisma.ticketHistory.create({
            data: {
                ticket_id: ticketId,
                field_name: 'status',
                old_value: ticket.status,
                new_value: 'Closed',
                changed_by: req.user.id,
            }
        });

        // Notificar sobre fechamento do ticket
        try {
            await notificationService.notifyTicketCompleted(updatedTicket);
        } catch (notificationError) {
            console.error('Erro ao notificar fechamento de ticket:', notificationError);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao fechar ticket:', error);
        return res.status(500).json({ message: 'Erro ao fechar ticket' });
    }
}

// Controller para deletar um ticket (somente Admin)
async function deleteTicketController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);

        // Verificar se existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                attachments: true,
                comments: { include: { attachments: true } },
                client: { include: { user: true } },
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Remover anexos do sistema de arquivos (best-effort)
        try {
            const allAttachments = [
                ...(ticket.attachments || []),
                ...ticket.comments.flatMap(c => c.attachments || []),
            ];
            for (const att of allAttachments) {
                if (att.file_path) {
                    await fs.unlink(att.file_path).catch(() => {});
                }
            }
        } catch (fsErr) {
            console.warn('Erro ao remover arquivos de anexo:', fsErr);
        }

        // Excluir registros relacionados (comentários, anexos, histórico, atribuições)
        await prisma.attachment.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.comment.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.ticketHistory.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.ticketAssignment.deleteMany({ where: { ticket_id: ticketId } });

        // Excluir o ticket
        await prisma.ticket.delete({ where: { id: ticketId } });

        // Notificar cliente e admins sobre exclusão
        try {
            await notificationService.notifyTicketDeleted({
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                client: { user_id: ticket.client.user_id },
            });
            const admins = await prisma.user.findMany({ where: { role: 'Admin', is_active: true }, select: { id: true } });
            await notificationService.notifyMultipleUsers(
                admins.map(a => a.id),
                'TICKET_DELETED',
                'Chamado excluído',
                `O chamado #${ticket.ticket_number} foi excluído do sistema.`,
                'warning',
                { ticketNumber: ticket.ticket_number }
            );
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de exclusão:', notificationError);
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar ticket:', error);
        return res.status(500).json({ message: 'Erro ao deletar ticket' });
    }
}

export {
    createTicketController,
    getAllTicketsController,
    getTicketByIdController,
    updateTicketController,
    assignTicketController,
    closeTicketController,
    deleteTicketController,
}; 