import { createClient } from '@supabase/supabase-js';
import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import { getSupabaseUserByEmail, createSupabaseUser, updateSupabaseUser, deleteSupabaseUser } from './SupabaseUser.js';

// Configurar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar se as variáveis estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
}

/**
 * Cria um novo cliente no Supabase e no banco local
 * @param {Object} clientData - Dados do cliente a ser criado
 * @returns {Object} - Cliente criado
 * @throws {Error} - Erro ao criar cliente
 */
async function createSupabaseClient(clientData) {
  try {
    let userId;
    let supabaseId;

    // Se dados do usuário foram fornecidos, criar novo usuário no Supabase e no banco local
    if (clientData.user) {
      // Criar usuário com role Client
      const userData = {
        name: clientData.user.name,
        email: clientData.user.email,
        password: clientData.user.password,
        phone: clientData.user.phone || null,
        avatar: clientData.user.avatar || null,
        role: 'Client'
      };

      const newUser = await createSupabaseUser(userData);
      userId = newUser.id;
      supabaseId = newUser.supabase_id;
    } else {
      // Usar usuário existente
      const user = await prisma.user.findUnique({
        where: { id: clientData.user_id },
        include: { client: true }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.role !== 'Client') {
        throw new Error('O usuário deve ter o papel de Client');
      }

      if (user.client) {
        throw new Error('Este usuário já é um cliente');
      }

      userId = user.id;
    }

    // Criar o cliente no banco local
    const client = await prisma.client.create({
      data: {
        user_id: userId,
        company: clientData.company,
        client_type: clientData.client_type,
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

    return client;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um cliente no Supabase e no banco local
 * @param {number} clientId - ID do cliente
 * @param {Object} clientData - Novos dados do cliente
 * @returns {Object} - Cliente atualizado
 * @throws {Error} - Erro ao atualizar cliente
 */
async function updateSupabaseClient(clientId, clientData) {
  try {
    // Buscar o cliente para obter o ID do usuário
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    // Atualizar dados do cliente no banco local
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        company: clientData.company,
        client_type: clientData.client_type
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
        }
      }
    });

    // Se houver dados do usuário para atualizar
    if (clientData.user) {
      // Buscar o ID do Supabase para o usuário
      const supabaseUser = await getSupabaseUserByEmail(existingClient.user.email);
      
      if (!supabaseUser) {
        console.warn(`Usuário não encontrado no Supabase: ${existingClient.user.email}`);
      } else {
        // Atualizar usuário no Supabase e no banco local
        await updateSupabaseUser(
          existingClient.user.id,
          supabaseUser.id,
          clientData.user
        );
      }
    }

    return updatedClient;
  } catch (error) {
    throw error;
  }
}

/**
 * Exclui um cliente do Supabase e do banco local
 * @param {number} clientId - ID do cliente
 * @param {boolean} deleteUser - Se deve excluir também o usuário associado
 * @returns {boolean} - True se excluído com sucesso
 * @throws {Error} - Erro ao excluir cliente
 */
async function deleteSupabaseClient(clientId, deleteUser = false) {
  try {
    // Buscar o cliente para obter o ID do usuário
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Verificar se o cliente tem tickets ativos
    const activeTickets = await prisma.ticket.count({
      where: {
        client_id: clientId,
        status: {
          notIn: ['Closed', 'Cancelled']
        }
      }
    });

    if (activeTickets > 0) {
      throw new Error('Não é possível excluir um cliente com tickets ativos');
    }

    // Excluir o cliente do banco local
    await prisma.client.delete({
      where: { id: clientId }
    });

    // Se solicitado, excluir também o usuário
    if (deleteUser) {
      // Buscar o ID do Supabase para o usuário
      const supabaseUser = await getSupabaseUserByEmail(client.user.email);
      
      if (!supabaseUser) {
        console.warn(`Usuário não encontrado no Supabase: ${client.user.email}`);
        
        // Excluir apenas do banco local
        await prisma.user.delete({
          where: { id: client.user.id }
        });
      } else {
        // Excluir do Supabase e do banco local
        await deleteSupabaseUser(client.user.id, supabaseUser.id);
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém todos os clientes
 * @param {Object} options - Opções de filtragem e paginação
 * @returns {Object} - Lista de clientes e informações de paginação
 * @throws {Error} - Erro ao buscar clientes
 */
async function getAllSupabaseClients(options = {}) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      client_type,
      is_active,
      search 
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtros
    const where = {};
    
    if (client_type) where.client_type = client_type;
    if (is_active !== undefined) where.user = { is_active: is_active === true };
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
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

    return {
      clients,
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
 * Obtém um cliente específico pelo ID
 * @param {number} clientId - ID do cliente
 * @returns {Object} - Dados do cliente
 * @throws {Error} - Erro ao buscar cliente
 */
async function getSupabaseClientById(clientId) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
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
      return null;
    }

    return client;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém tickets de um cliente
 * @param {number} clientId - ID do cliente
 * @param {Object} options - Opções de filtragem e paginação
 * @returns {Object} - Lista de tickets e informações de paginação
 * @throws {Error} - Erro ao buscar tickets
 */
async function getSupabaseClientTickets(clientId, options = {}) {
  try {
    const { page = 1, limit = 10, status, priority } = options;
    const offset = (page - 1) * limit;

    const whereClause = {
      client_id: clientId,
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

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTickets,
        pages: Math.ceil(totalTickets / limit),
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém histórico de tickets de um cliente
 * @param {number} clientId - ID do cliente
 * @param {Object} options - Opções de paginação
 * @returns {Object} - Lista de tickets históricos e informações de paginação
 * @throws {Error} - Erro ao buscar histórico de tickets
 */
async function getSupabaseClientTicketHistory(clientId, options = {}) {
  try {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const tickets = await prisma.ticket.findMany({
      where: {
        client_id: clientId,
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
        client_id: clientId,
        status: {
          in: ['Resolved', 'Closed', 'Cancelled']
        }
      }
    });

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTickets,
        pages: Math.ceil(totalTickets / limit),
      }
    };
  } catch (error) {
    throw error;
  }
}

export {
  createSupabaseClient,
  updateSupabaseClient,
  deleteSupabaseClient,
  getAllSupabaseClients,
  getSupabaseClientById,
  getSupabaseClientTickets,
  getSupabaseClientTicketHistory
};