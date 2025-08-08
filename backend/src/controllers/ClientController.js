import { PrismaClient } from '../generated/prisma/index.js';
import notificationService from '../services/NotificationService.js';
import { clientCreateSchema, clientUpdateSchema } from '../schemas/client.schema.js';
import { ZodError } from 'zod/v4';
import { generateHashPassword } from '../utils/hash.js';

const prisma = new PrismaClient();


// Controller para criar um novo cliente
async function createClientController(req, res) {
    let clientData;

    try {
        clientData = clientCreateSchema.parse(req.body);
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
        let createdClient;

        await prisma.$transaction(async (tx) => {
            let userId;

            // Se dados do usuário foram fornecidos, criar novo usuário
            if (clientData.user) {
                const existingUser = await tx.user.findUnique({
                    where: { email: clientData.user.email }
                });

                if (existingUser) {
                    throw { status: 400, message: 'Email já está em uso' };
                }

                const hashedPassword = await generateHashPassword(clientData.user.password);
                const newUser = await tx.user.create({
                    data: {
                        name: clientData.user.name,
                        email: clientData.user.email,
                        phone: clientData.user.phone,
                        avatar: clientData.user.avatar,
                        hashed_password: hashedPassword,
                        role: 'Client'
                    }
                });

                userId = newUser.id;
            } else {
                // Usar usuário existente
                const user = await tx.user.findUnique({
                    where: { id: clientData.user_id },
                    include: { client: true }
                });

                if (!user) {
                    throw { status: 404, message: 'Usuário não encontrado' };
                }

                if (user.role !== 'Client') {
                    throw { status: 400, message: 'O usuário deve ter o papel de Client' };
                }

                if (user.client) {
                    throw { status: 400, message: 'Este usuário já é um cliente' };
                }

                userId = user.id;
            }

            // Verificar se já existe um cliente com o mesmo matricu_id ou CPF
            if (clientData.matricu_id) {
                const existingEmployeeId = await tx.client.findUnique({
                    where: { matricu_id: clientData.matricu_id }
                });

                if (existingEmployeeId) {
                    throw { status: 400, message: 'Matrícula de funcionário já está em uso' };
                }
            }

            if (clientData.cpf) {
                const existingCpf = await tx.client.findUnique({
                    where: { cpf: clientData.cpf }
                });

                if (existingCpf) {
                    throw { status: 400, message: 'CPF já está em uso' };
                }
            }

            // Criar o cliente com os novos campos
            createdClient = await tx.client.create({
                data: {
                    user_id: userId,
                    matricu_id: clientData.matricu_id,
                    department: clientData.department,
                    position: clientData.position,
                    admission_date: clientData.admission_date,
                    birth_date: clientData.birth_date,
                    address: clientData.address,
                    gender: clientData.gender,
                    education_level: clientData.education_level,
                    education_field: clientData.education_field,
                    contract_type: clientData.contract_type,
                    work_schedule: clientData.work_schedule,
                    cpf: clientData.cpf,
                    notes: clientData.notes,
                    company: clientData.company,
                    client_type: clientData.client_type || 'Individual',
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
                            tickets: true,
                        }
                    }
                }
            });
        });

        return res.status(201).json(createdClient);
    } catch (error) {
        if (error && error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        if (error && error.code === 'P2002') {
            const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
            if (target.includes('matricu_id')) {
                return res.status(400).json({ message: 'Matrícula de funcionário já está em uso' });
            }
            if (target.includes('cpf')) {
                return res.status(400).json({ message: 'CPF já está em uso' });
            }
            return res.status(400).json({ message: 'Registro duplicado: já existe um cliente com estes dados únicos' });
        }
        console.error('Erro ao criar cliente:', error);
        return res.status(500).json({ message: 'Erro ao criar cliente' });
    }
}

// Controller para listar todos os clientes
async function getAllClientsController(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            client_type,
            is_active,
            search 
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const where = { user: { is: { role: 'Client' } } };
        
        if (client_type) where.client_type = client_type;
        if (is_active !== undefined) where.user.is.is_active = is_active === 'true';
        
        if (search) {
            where.OR = [
                { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
                { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
                { matricu_id : { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
                { position: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { client_type: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                skip,
                take: parseInt(limit),
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
                            tickets: true,
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            }),
            prisma.client.count({ where })
        ]);

        return res.status(200).json({
            clients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
}

// Controller para obter um cliente específico por ID
async function getClientByIdController(req, res) {
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(req.params.clientId) },
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
                tickets: {
                    select: {
                        id: true,
                        ticket_number: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'desc' },
                    take: 10
                },
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return res.status(500).json({ message: 'Erro ao buscar cliente' });
    }
}

// Controller para atualizar um cliente
async function updateClientController(req, res) {
    let clientData;

    try {
        clientData = clientUpdateSchema.parse(req.body);
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
        const clientId = parseInt(req.params.clientId);
        
        // Verificar se o cliente existe
        const existingClient = await prisma.client.findUnique({
            where: { id: clientId }
        });
        
        if (!existingClient) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }
        
        // Verificar unicidade de matricu_id  se estiver sendo atualizado
        if (clientData.matricu_id  && clientData.matricu_id  !== existingClient.matricu_id ) {
            const existingEmployeeId = await prisma.client.findUnique({
                where: { matricu_id : clientData.matricu_id  }
            });
            
            if (existingEmployeeId) {
                return res.status(400).json({ message: 'Matrícula de funcionário já está em uso' });
            }
        }
        
        // Verificar unicidade de CPF se estiver sendo atualizado
        if (clientData.cpf && clientData.cpf !== existingClient.cpf) {
            const existingCpf = await prisma.client.findUnique({
                where: { cpf: clientData.cpf }
            });
            
            if (existingCpf) {
                return res.status(400).json({ message: 'CPF já está em uso' });
            }
        }

        const client = await prisma.client.update({
            where: { id: clientId },
            data: clientData,
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
                }
            }
        });

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return res.status(500).json({ message: 'Erro ao atualizar cliente' });
    }
}

// Controller para deletar um cliente
async function deleteClientController(req, res) {
    try {
        const clientId = parseInt(req.params.clientId);

        // Verificar se o cliente existe
        const existingClient = await prisma.client.findUnique({ where: { id: clientId } });
        if (!existingClient) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        // Excluir tickets vinculados ao cliente antes de excluir o cliente
        await prisma.$transaction(async (tx) => {
            await tx.ticket.deleteMany({ where: { client_id: clientId } });
            await tx.client.delete({ where: { id: clientId } });
        });

        // Tentar remover o usuário vinculado (ou desativar se houver vínculos)
        try {
            await prisma.user.delete({ where: { id: existingClient.user_id } });
        } catch (err) {
            if (err && err.code === 'P2003') {
                // Existem vínculos (ex.: histórico, comentários, etc.). Desativar usuário.
                await prisma.user.update({
                    where: { id: existingClient.user_id },
                    data: { is_active: false }
                });
            } else {
                throw err;
            }
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        if (error && error.code === 'P2003') {
            return res.status(409).json({
                message: 'Não é possível excluir: existem registros vinculados a este cliente.'
            });
        }
        return res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
}

// Controller para obter tickets do cliente logado
async function getMyTicketsController(req, res) {
    try {
        const { page = 1, limit = 10, status, priority } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            client_id: req.user.client.id,
        };

        if (status) {
            whereClause.status = status;
        }

        if (priority) {
            whereClause.priority = priority;
        }

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            include: {
                category: true,
                subcategory: true,
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
                        created_at: 'desc'
                    },
                    take: 5
                },
                attachments: true,
            },
            orderBy: {
                created_at: 'desc'
            },
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
        console.error('Erro ao buscar tickets do cliente:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets' });
    }
}

// Controller para obter histórico de tickets do cliente
async function getMyTicketHistoryController(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const tickets = await prisma.ticket.findMany({
            where: {
                client_id: req.user.client.id,
                status: {
                    in: ['Resolved', 'Closed', 'Cancelled']
                }
            },
            include: {
                category: true,
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
                        created_at: 'desc'
                    }
                },
            },
            orderBy: {
                closed_at: 'desc'
            },
            skip: offset,
            take: parseInt(limit),
        });

        const totalTickets = await prisma.ticket.count({
            where: {
                client_id: req.user.client.id,
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

// Controller para avaliar atendimento após conclusão
async function rateTicketController(req, res) {
    try {
        const { ticketId } = req.params;
        const { satisfaction_rating, feedback } = req.body;

        if (satisfaction_rating < 1 || satisfaction_rating > 5) {
            return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                client_id: req.user.client.id,
                status: {
                    in: ['Resolved', 'Closed']
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não pode ser avaliado' });
        }

        if (ticket.satisfaction_rating) {
            return res.status(400).json({ message: 'Ticket já foi avaliado' });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                satisfaction_rating: parseInt(satisfaction_rating),
            },
            include: {
                category: true,
                assignee: true,
                client: { include: { user: true } },
            }
        });

        // Adicionar comentário com feedback se fornecido
        if (feedback) {
            await prisma.comment.create({
                data: {
                    ticket_id: parseInt(ticketId),
                    user_id: req.user.id,
                    content: `Avaliação: ${satisfaction_rating}/5\nFeedback: ${feedback}`,
                    is_internal: false,
                }
            });
        }

        // Notificar feedback negativo (<= 2) a admins
        try {
            const rating = parseInt(satisfaction_rating);
            if (!isNaN(rating) && rating <= 2) {
                const admins = await prisma.user.findMany({ where: { role: 'Admin', is_active: true }, select: { id: true } });
                const notifyAll = admins.map(a => notificationService.notifyUser(
                    a.id,
                    'NEGATIVE_FEEDBACK',
                    'Feedback negativo recebido',
                    `Chamado #${updatedTicket.ticket_number} recebeu avaliação ${rating}/5 de um cliente.`,
                    'warning',
                    { ticketId: updatedTicket.id, rating }
                ));
                await Promise.all(notifyAll);
            }
        } catch (e) {
            console.error('Erro ao notificar feedback negativo:', e);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao avaliar ticket:', error);
        return res.status(500).json({ message: 'Erro ao avaliar ticket' });
    }
}

// Controller para adicionar comentário público ao ticket
async function addPublicCommentController(req, res) {
    try {
        const { ticketId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                client_id: req.user.client.id,
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        const comment = await prisma.comment.create({
            data: {
                ticket_id: parseInt(ticketId),
                user_id: req.user.id,
                content: content.trim(),
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

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        return res.status(500).json({ message: 'Erro ao adicionar comentário' });
    }
}

// Controller para obter estatísticas pessoais do cliente
async function getMyStatisticsController(req, res) {
    try {
        const clientId = req.user.client.id;

        const totalTickets = await prisma.ticket.count({
            where: { client_id: clientId }
        });

        const openTickets = await prisma.ticket.count({
            where: {
                client_id: clientId,
                status: 'Open'
            }
        });

        const resolvedTickets = await prisma.ticket.count({
            where: {
                client_id: clientId,
                status: 'Resolved'
            }
        });

        const avgSatisfaction = await prisma.ticket.aggregate({
            where: {
                client_id: clientId,
                satisfaction_rating: {
                    not: null
                }
            },
            _avg: {
                satisfaction_rating: true
            }
        });

        const ticketsByCategory = await prisma.ticket.groupBy({
            by: ['category_id'],
            where: { client_id: clientId },
            _count: {
                id: true
            }
        });

        const statistics = {
            totalTickets,
            openTickets,
            resolvedTickets,
            avgSatisfaction: avgSatisfaction._avg.satisfaction_rating || 0,
            ticketsByCategory,
        };

        return res.status(200).json(statistics);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
}

export {
    createClientController,
    getAllClientsController,
    getClientByIdController,
    updateClientController,
    deleteClientController,
    getMyTicketsController,
    getMyTicketHistoryController,
    rateTicketController,
    addPublicCommentController,
    getMyStatisticsController,
};