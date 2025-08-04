import { createClient } from '@supabase/supabase-js';
import prisma from '../../prisma/client.js';

// Configurar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar se as variáveis estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
}

// Gerar número único do ticket
function generateTicketNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${timestamp.slice(-6)}-${random}`;
}

/**
 * Cria um novo ticket no banco local e registra no Supabase
 * @param {Object} ticketData - Dados do ticket a ser criado
 * @param {Object} user - Usuário que está criando o ticket
 * @returns {Object} - Ticket criado
 * @throws {Error} - Erro ao criar ticket
 */
async function createSupabaseTicket(ticketData, user) {
  try {
    const ticketNumber = generateTicketNumber();
    
    // Criar ticket no banco local
    const ticket = await prisma.ticket.create({
      data: {
        ...ticketData,
        ticket_number: ticketNumber,
        created_by: user.id,
        client_id: user.client?.id || ticketData.client_id,
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

    // Registrar atividade no Supabase (opcional, para análise e auditoria)
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        action: 'created',
        user_id: user.id,
        user_email: user.email,
        details: JSON.stringify({
          title: ticket.title,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category?.name,
        })
      });
    } catch (supabaseError) {
      // Apenas registrar o erro, não interromper o fluxo
      console.error('Erro ao registrar atividade no Supabase:', supabaseError);
    }

    return ticket;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém todos os tickets com opções de filtragem
 * @param {Object} options - Opções de filtragem e paginação
 * @param {Object} user - Usuário que está fazendo a requisição
 * @returns {Object} - Lista de tickets e informações de paginação
 * @throws {Error} - Erro ao buscar tickets
 */
async function getAllSupabaseTickets(options = {}, user) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      category_id,
      assigned_to,
      search 
    } = options;

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
    if (user.role === 'Client' && user.client) {
      where.client_id = user.client.id;
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

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém um ticket específico pelo ID
 * @param {number} ticketId - ID do ticket
 * @param {Object} user - Usuário que está fazendo a requisição
 * @returns {Object} - Dados do ticket
 * @throws {Error} - Erro ao buscar ticket
 */
async function getSupabaseTicketById(ticketId, user) {
  try {
    const where = { id: ticketId };
    
    // Se for cliente, verificar se o ticket pertence a ele
    if (user.role === 'Client' && user.client) {
      where.client_id = user.client.id;
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
      return null;
    }

    // Registrar visualização no Supabase (opcional, para análise)
    try {
      await supabase.from('ticket_views').insert({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        user_id: user.id,
        user_email: user.email,
        user_role: user.role
      });
    } catch (supabaseError) {
      // Apenas registrar o erro, não interromper o fluxo
      console.error('Erro ao registrar visualização no Supabase:', supabaseError);
    }

    return ticket;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um ticket
 * @param {number} ticketId - ID do ticket
 * @param {Object} ticketData - Novos dados do ticket
 * @param {Object} user - Usuário que está fazendo a atualização
 * @returns {Object} - Ticket atualizado
 * @throws {Error} - Erro ao atualizar ticket
 */
async function updateSupabaseTicket(ticketId, ticketData, user) {
  try {
    // Verificar se o ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      throw new Error('Ticket não encontrado');
    }

    // Se for cliente, verificar se o ticket pertence a ele
    if (user.role === 'Client' && user.client && existingTicket.client_id !== user.client.id) {
      throw new Error('Acesso negado');
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
          changed_by: user.id,
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

      // Registrar atividade no Supabase (opcional, para análise e auditoria)
      try {
        await supabase.from('ticket_activities').insert({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          action: 'updated',
          user_id: user.id,
          user_email: user.email,
          details: JSON.stringify({
            changes: changes.map(c => ({
              field: c.field_name,
              from: c.old_value,
              to: c.new_value
            }))
          })
        });
      } catch (supabaseError) {
        // Apenas registrar o erro, não interromper o fluxo
        console.error('Erro ao registrar atividade no Supabase:', supabaseError);
      }
    }

    return ticket;
  } catch (error) {
    throw error;
  }
}

/**
 * Atribui um ticket a um agente
 * @param {number} ticketId - ID do ticket
 * @param {number} agentId - ID do agente
 * @param {Object} user - Usuário que está fazendo a atribuição
 * @returns {Object} - Ticket atualizado
 * @throws {Error} - Erro ao atribuir ticket
 */
async function assignSupabaseTicket(ticketId, agentId, user) {
  try {
    // Verificar se o agente existe
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true }
    });

    if (!agent) {
      throw new Error('Agente não encontrado');
    }

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    // Atualizar o ticket com o novo agente
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assigned_to: agent.user.id,
        status: ticket.status === 'New' ? 'Open' : ticket.status,
      },
      include: {
        category: true,
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

    // Criar registro de atribuição
    await prisma.ticketAssignment.create({
      data: {
        ticket_id: ticketId,
        agent_id: agentId,
        assigned_by: user.id,
      }
    });

    // Registrar histórico
    await prisma.ticketHistory.create({
      data: {
        ticket_id: ticketId,
        field_name: 'assigned_to',
        old_value: ticket.assigned_to?.toString() || null,
        new_value: agent.user.id.toString(),
        changed_by: user.id,
      }
    });

    // Registrar atividade no Supabase (opcional, para análise e auditoria)
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        action: 'assigned',
        user_id: user.id,
        user_email: user.email,
        details: JSON.stringify({
          agent_id: agent.id,
          agent_name: agent.user.name,
          agent_email: agent.user.email
        })
      });
    } catch (supabaseError) {
      // Apenas registrar o erro, não interromper o fluxo
      console.error('Erro ao registrar atividade no Supabase:', supabaseError);
    }

    return updatedTicket;
  } catch (error) {
    throw error;
  }
}

/**
 * Adiciona um comentário a um ticket
 * @param {number} ticketId - ID do ticket
 * @param {string} content - Conteúdo do comentário
 * @param {Array} attachments - Anexos do comentário
 * @param {Object} user - Usuário que está adicionando o comentário
 * @returns {Object} - Comentário criado
 * @throws {Error} - Erro ao adicionar comentário
 */
async function addSupabaseTicketComment(ticketId, content, attachments = [], user) {
  try {
    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    // Se for cliente, verificar se o ticket pertence a ele
    if (user.role === 'Client' && user.client && ticket.client_id !== user.client.id) {
      throw new Error('Acesso negado');
    }

    // Criar o comentário
    const comment = await prisma.comment.create({
      data: {
        ticket_id: ticketId,
        user_id: user.id,
        content,
        is_internal: user.role !== 'Client',
        attachments: {
          create: attachments.map(attachment => ({
            filename: attachment.filename,
            path: attachment.path,
            mimetype: attachment.mimetype,
            size: attachment.size
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        attachments: true,
      }
    });

    // Atualizar o status do ticket se necessário
    if (ticket.status === 'Waiting' && user.role === 'Client') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'Open' }
      });

      // Registrar histórico
      await prisma.ticketHistory.create({
        data: {
          ticket_id: ticketId,
          field_name: 'status',
          old_value: 'Waiting',
          new_value: 'Open',
          changed_by: user.id,
        }
      });
    }

    // Registrar atividade no Supabase (opcional, para análise e auditoria)
    try {
      await supabase.from('ticket_activities').insert({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        action: 'commented',
        user_id: user.id,
        user_email: user.email,
        details: JSON.stringify({
          comment_id: comment.id,
          is_internal: comment.is_internal,
          has_attachments: attachments.length > 0
        })
      });
    } catch (supabaseError) {
      // Apenas registrar o erro, não interromper o fluxo
      console.error('Erro ao registrar atividade no Supabase:', supabaseError);
    }

    return comment;
  } catch (error) {
    throw error;
  }
}

export {
  createSupabaseTicket,
  getAllSupabaseTickets,
  getSupabaseTicketById,
  updateSupabaseTicket,
  assignSupabaseTicket,
  addSupabaseTicketComment
};