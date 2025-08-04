import { PrismaClient } from '../generated/prisma/index.js';
import { ticketCreateSchema, ticketUpdateSchema } from '../schemas/ticket.schema.js';
import { ZodError } from 'zod/v4';
import notificationService from '../services/NotificationService.js';

const prisma = new PrismaClient();

// Gerar número único do ticket
function generateTicketNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKT-${timestamp.slice(-6)}-${random}`;
}

// Controller para criar um novo ticket
async function createTicketController(req, res) {
    let ticketData;

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
        
        const ticket = await prisma.ticket.create({
            data: {
                ...ticketData,
                ticket_number: ticketNumber,
                created_by: req.user.id,
                client_id: req.user.client?.id || ticketData.client_id,
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
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                },
                attachments: true,
            }
        });

        // Enviar notificação sobre criação do ticket
        try {
            await notificationService.notifyTicketCreated(ticket);
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de ticket criado:', notificationError);
            // Não falhar a criação do ticket por erro de notificação
        }

        return res.status(201).json(ticket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        return res.status(500).json({ message: 'Erro ao criar ticket' });
    }
}

// Controller para listar todos os tickets
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

        const tickets = await prisma.ticket.findMany({
            where,
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
        });

        const total = await prisma.ticket.count({ where });

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
        console.error('Erro ao buscar tickets:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets' });
    }
}

// Controller para obter um ticket específico
async function getTicketByIdController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        const where = { id: ticketId };
        
        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client') {
            where.client_id = req.user.client.id;
        }

        const ticket = await prisma.ticket.findFirst({
            where,
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
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        attachments: true,
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                },
                attachments: true,
                ticket_history: {
                    include: {
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
        ticketData = ticketUpdateSchema.parse(req.body);
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
        const ticketId = parseInt(req.params.ticketId);
        
        // Verificar se o ticket existe
        const existingTicket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!existingTicket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client' && existingTicket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Registrar histórico de mudanças
        const changes = [];
        for (const [key, value] of Object.entries(ticketData)) {
            if (existingTicket[key] !== value) {
                changes.push({
                    ticket_id: ticketId,
                    field_name: key,
                    old_value: existingTicket[key]?.toString() || null,
                    new_value: value?.toString() || null,
                    changed_by: req.user.id,
                });
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: ticketData,
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
                    select: {
                        id: true,
                        name: true,
                        email: true,
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

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao fechar ticket:', error);
        return res.status(500).json({ message: 'Erro ao fechar ticket' });
    }
}

export {
    createTicketController,
    getAllTicketsController,
    getTicketByIdController,
    updateTicketController,
    assignTicketController,
    closeTicketController,
}; 