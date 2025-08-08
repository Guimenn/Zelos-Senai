import { PrismaClient } from '../generated/prisma/index.js';
import { commentCreateSchema, commentUpdateSchema } from '../schemas/comment.schema.js';
import { ZodError } from 'zod/v4';
import notificationService from '../services/NotificationService.js';

const prisma = new PrismaClient();

// Controller para criar um novo comentário
async function createCommentController(req, res) {
    let commentData;

    try {
        commentData = commentCreateSchema.parse(req.body);
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

        // Clientes não podem criar comentários internos
        if (commentData.is_internal && req.user.role === 'Client') {
            return res.status(403).json({ message: 'Clientes não podem criar comentários internos' });
        }

        const comment = await prisma.comment.create({
            data: {
                ...commentData,
                ticket_id: ticketId,
                user_id: req.user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                attachments: true,
            }
        });

        // Atualizar status do ticket para "Aguardando Cliente" se for comentário interno
        if (comment.is_internal) {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: 'WaitingForClient' }
            });
        } else {
            // Se for comentário do cliente, atualizar para "Em Progresso"
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: 'InProgress' }
            });
        }

        // Enviar notificação sobre novo comentário
        try {
            const ticketWithDetails = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    client: { include: { user: true } },
                    assignee: true
                }
            });
            await notificationService.notifyCommentAdded(comment, ticketWithDetails);
            // Mencionar usuários via @nome
            const mentionMatches = (comment.content || '').match(/@([\p{L}0-9_.-]+)/gu) || [];
            if (mentionMatches.length > 0) {
                const uniqueMentions = Array.from(new Set(mentionMatches.map(m => m.substring(1).toLowerCase())));
                const users = await prisma.user.findMany({
                    where: { name: { in: uniqueMentions, mode: 'insensitive' } },
                    select: { id: true }
                });
                await Promise.all(users.map(u => notificationService.notifyUser(
                    u.id,
                    'MENTION',
                    'Você foi mencionado',
                    `Você foi mencionado em um comentário no chamado #${ticketWithDetails.ticket_number}.`,
                    'info',
                    { ticketId: ticketId, commentId: comment.id }
                )));
            }
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de comentário:', notificationError);
        }

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        return res.status(500).json({ message: 'Erro ao criar comentário' });
    }
}

// Controller para listar comentários de um ticket
async function getTicketCommentsController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const { page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

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

        const where = { ticket_id: ticketId };

        // Clientes não podem ver comentários internos
        if (req.user.role === 'Client') {
            where.is_internal = false;
        }

        const comments = await prisma.comment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                attachments: true,
            },
            orderBy: {
                created_at: 'asc'
            },
            skip,
            take: parseInt(limit),
        });

        const total = await prisma.comment.count({ where });

        return res.status(200).json({
            comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        return res.status(500).json({ message: 'Erro ao buscar comentários' });
    }
}

// Controller para obter um comentário específico
async function getCommentByIdController(req, res) {
    try {
        const commentId = parseInt(req.params.commentId);

        const where = { id: commentId };

        // Clientes não podem ver comentários internos
        if (req.user.role === 'Client') {
            where.is_internal = false;
        }

        const comment = await prisma.comment.findFirst({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                attachments: true,
                ticket: {
                    select: {
                        id: true,
                        ticket_number: true,
                        client_id: true,
                    }
                }
            }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client' && comment.ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        return res.status(200).json(comment);
    } catch (error) {
        console.error('Erro ao buscar comentário:', error);
        return res.status(500).json({ message: 'Erro ao buscar comentário' });
    }
}

// Controller para atualizar um comentário
async function updateCommentController(req, res) {
    let commentData;

    try {
        commentData = commentUpdateSchema.parse(req.body);
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
        const commentId = parseInt(req.params.commentId);

        // Verificar se o comentário existe
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                ticket: {
                    select: {
                        id: true,
                        client_id: true,
                    }
                }
            }
        });

        if (!existingComment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        // Verificar permissões
        if (existingComment.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Você só pode editar seus próprios comentários' });
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client' && existingComment.ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Clientes não podem tornar comentários internos
        if (commentData.is_internal && req.user.role === 'Client') {
            return res.status(403).json({ message: 'Clientes não podem criar comentários internos' });
        }

        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: commentData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                attachments: true,
            }
        });

        return res.status(200).json(comment);
    } catch (error) {
        console.error('Erro ao atualizar comentário:', error);
        return res.status(500).json({ message: 'Erro ao atualizar comentário' });
    }
}

// Controller para deletar um comentário
async function deleteCommentController(req, res) {
    try {
        const commentId = parseInt(req.params.commentId);

        // Verificar se o comentário existe
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                ticket: {
                    select: {
                        id: true,
                        client_id: true,
                    }
                }
            }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        // Verificar permissões
        if (comment.user_id !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Você não tem permissão para deletar este comentário' });
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (req.user.role === 'Client' && comment.ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        return res.status(500).json({ message: 'Erro ao deletar comentário' });
    }
}

export {
    createCommentController,
    getTicketCommentsController,
    getCommentByIdController,
    updateCommentController,
    deleteCommentController,
}; 