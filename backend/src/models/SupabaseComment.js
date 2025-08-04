import { PrismaClient } from '../generated/prisma/index.js';
import { supabase } from '../config/supabase.js';

const prisma = new PrismaClient();

// Função para criar um novo comentário no Supabase e no banco de dados local
async function createSupabaseComment(ticketId, commentData, userId) {
    try {
        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                client: true,
                assigned_to: true
            }
        });

        if (!ticket) {
            throw new Error('Ticket não encontrado');
        }

        // Verificar permissões do usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true,
                agent: true,
                admin: true
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (user.role === 'Client' && ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }

        // Clientes não podem criar comentários internos
        if (commentData.is_internal && user.role === 'Client') {
            throw new Error('Clientes não podem criar comentários internos');
        }

        // Criar comentário no banco de dados local
        const comment = await prisma.comment.create({
            data: {
                ...commentData,
                ticket_id: ticketId,
                user_id: userId,
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

        // Atualizar status do ticket com base no tipo de comentário
        let newStatus;
        if (comment.is_internal) {
            newStatus = 'WaitingForClient';
        } else if (user.role === 'Client') {
            newStatus = 'InProgress';
        }

        if (newStatus) {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: newStatus }
            });
        }

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'create',
            entity_type: 'comment',
            entity_id: comment.id.toString(),
            related_entity_type: 'ticket',
            related_entity_id: ticketId.toString(),
            details: JSON.stringify({
                comment_id: comment.id,
                ticket_id: ticketId,
                is_internal: comment.is_internal,
                content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
                has_attachments: comment.attachments.length > 0
            }),
            created_by: userId.toString()
        });

        // Notificar usuários relevantes
        await notifyRelevantUsers(comment, ticket, user);

        return comment;
    } catch (error) {
        console.error('Erro ao criar comentário no Supabase:', error);
        throw error;
    }
}

// Função para listar comentários de um ticket
async function getSupabaseTicketComments(ticketId, userId, options = {}) {
    try {
        const { page = 1, limit = 20 } = options;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            throw new Error('Ticket não encontrado');
        }

        // Verificar permissões do usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (user.role === 'Client' && ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }

        const where = { ticket_id: ticketId };

        // Clientes não podem ver comentários internos
        if (user.role === 'Client') {
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

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'view',
            entity_type: 'comments',
            related_entity_type: 'ticket',
            related_entity_id: ticketId.toString(),
            details: JSON.stringify({
                viewed_at: new Date().toISOString(),
                page: parseInt(page),
                limit: parseInt(limit)
            }),
            created_by: userId.toString()
        });

        return {
            comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        throw error;
    }
}

// Função para obter um comentário específico
async function getSupabaseCommentById(commentId, userId) {
    try {
        // Verificar permissões do usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const where = { id: commentId };

        // Clientes não podem ver comentários internos
        if (user.role === 'Client') {
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
            throw new Error('Comentário não encontrado');
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (user.role === 'Client' && comment.ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'view',
            entity_type: 'comment',
            entity_id: comment.id.toString(),
            related_entity_type: 'ticket',
            related_entity_id: comment.ticket.id.toString(),
            details: JSON.stringify({
                viewed_at: new Date().toISOString()
            }),
            created_by: userId.toString()
        });

        return comment;
    } catch (error) {
        console.error('Erro ao buscar comentário:', error);
        throw error;
    }
}

// Função para atualizar um comentário
async function updateSupabaseComment(commentId, commentData, userId) {
    try {
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
            throw new Error('Comentário não encontrado');
        }

        // Verificar permissões do usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Verificar permissões
        if (existingComment.user_id !== userId) {
            throw new Error('Você só pode editar seus próprios comentários');
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (user.role === 'Client' && existingComment.ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }

        // Clientes não podem tornar comentários internos
        if (commentData.is_internal && user.role === 'Client') {
            throw new Error('Clientes não podem criar comentários internos');
        }

        // Atualizar comentário no banco de dados local
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

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'update',
            entity_type: 'comment',
            entity_id: comment.id.toString(),
            related_entity_type: 'ticket',
            related_entity_id: existingComment.ticket.id.toString(),
            details: JSON.stringify({
                previous: {
                    content: existingComment.content,
                    is_internal: existingComment.is_internal
                },
                current: {
                    content: comment.content,
                    is_internal: comment.is_internal
                }
            }),
            created_by: userId.toString()
        });

        return comment;
    } catch (error) {
        console.error('Erro ao atualizar comentário:', error);
        throw error;
    }
}

// Função para deletar um comentário
async function deleteSupabaseComment(commentId, userId) {
    try {
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
            throw new Error('Comentário não encontrado');
        }

        // Verificar permissões do usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true,
                admin: true
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Verificar permissões
        const isAdmin = user.role === 'Admin';
        if (comment.user_id !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para deletar este comentário');
        }

        // Se for cliente, verificar se o ticket pertence a ele
        if (user.role === 'Client' && comment.ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }

        // Salvar dados do comentário antes de deletar para registro
        const commentToDelete = { ...comment };

        // Deletar comentário no banco de dados local
        await prisma.comment.delete({
            where: { id: commentId }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'delete',
            entity_type: 'comment',
            entity_id: commentId.toString(),
            related_entity_type: 'ticket',
            related_entity_id: comment.ticket.id.toString(),
            details: JSON.stringify({
                deleted_comment: {
                    id: commentToDelete.id,
                    content: commentToDelete.content.substring(0, 100) + (commentToDelete.content.length > 100 ? '...' : ''),
                    is_internal: commentToDelete.is_internal,
                    created_at: commentToDelete.created_at
                }
            }),
            created_by: userId.toString()
        });

        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        throw error;
    }
}

// Função auxiliar para notificar usuários relevantes sobre novos comentários
async function notifyRelevantUsers(comment, ticket, commenter) {
    try {
        // Determinar quem deve ser notificado
        const notifyUserIds = new Set();
        
        // Sempre notificar o cliente do ticket (exceto se for ele quem comentou)
        if (ticket.client_id && ticket.client_id !== commenter.id) {
            notifyUserIds.add(ticket.client_id);
        }
        
        // Sempre notificar o agente designado (exceto se for ele quem comentou)
        if (ticket.assigned_to && ticket.assigned_to.id !== commenter.id) {
            notifyUserIds.add(ticket.assigned_to.id);
        }
        
        // Se for comentário interno, não notificar o cliente
        if (comment.is_internal) {
            notifyUserIds.delete(ticket.client_id);
        }
        
        // Registrar notificações no Supabase
        for (const userId of notifyUserIds) {
            await supabase.from('notifications').insert({
                user_id: userId.toString(),
                type: 'new_comment',
                entity_type: 'comment',
                entity_id: comment.id.toString(),
                related_entity_type: 'ticket',
                related_entity_id: ticket.id.toString(),
                message: `Novo comentário no ticket #${ticket.ticket_number}`,
                details: JSON.stringify({
                    ticket_id: ticket.id,
                    ticket_number: ticket.ticket_number,
                    comment_id: comment.id,
                    commenter_name: commenter.name,
                    is_internal: comment.is_internal,
                    preview: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
                }),
                is_read: false,
                created_at: new Date().toISOString()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao notificar usuários sobre novo comentário:', error);
        // Não propagar o erro para não interromper a criação do comentário
        return false;
    }
}

/**
 * Adiciona um comentário a um ticket no Supabase e no banco de dados local
 * @param {number} ticketId - ID do ticket
 * @param {Object} commentData - Dados do comentário
 * @param {Object} user - Usuário que está adicionando o comentário
 * @returns {Object} - Comentário criado
 * @throws {Error} - Erro ao adicionar comentário
 */
async function addSupabaseTicketComment(ticketId, commentData, user) {
    try {
        // Verificar se o ticket existe no Supabase
        const { data: ticket, error: ticketError } = await supabase
            .from('ticket')
            .select('*')
            .eq('id', ticketId)
            .single();
        
        if (ticketError || !ticket) {
            throw new Error('Ticket não encontrado');
        }
        
        // Verificar permissões do usuário
        if (user.role === 'Client' && ticket.client_id !== user.client.id) {
            throw new Error('Acesso negado');
        }
        
        // Clientes não podem criar comentários internos
        if (commentData.is_internal && user.role === 'Client') {
            throw new Error('Clientes não podem criar comentários internos');
        }
        
        // Criar comentário no Supabase
        const { data: comment, error: commentError } = await supabase
            .from('comment')
            .insert({
                ticket_id: ticketId,
                content: commentData.content,
                is_internal: commentData.is_internal || false,
                created_by: user.id
            })
            .select()
            .single();
        
        if (commentError) {
            throw new Error(`Erro ao criar comentário: ${commentError.message}`);
        }
        
        // Notificar usuários relevantes
        await notifyUsersAboutComment(ticketId, comment.id, user);
        
        return comment;
    } catch (error) {
        console.error('Erro ao adicionar comentário ao ticket:', error);
        throw error;
    }
}

export {
    createSupabaseComment,
    getSupabaseTicketComments,
    getSupabaseCommentById,
    updateSupabaseComment,
    deleteSupabaseComment,
    addSupabaseTicketComment
};