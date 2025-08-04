import { supabase } from '../config/supabase.js';
import { generateHashPassword } from '../utils/hash.js';

/**
 * Cria um novo agente no Supabase
 * @param {Object} agentData - Dados do agente a ser criado
 * @returns {Object} - Agente criado
 * @throws {Error} - Erro ao criar agente
 */
async function createSupabaseAgent(agentData) {
  try {
    let userId;

    // Se dados do usuário foram fornecidos, criar novo usuário
    if (agentData.user) {
      // Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('id')
        .eq('email', agentData.user.email)
        .single();

      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Criar usuário
      const hashedPassword = await generateHashPassword(agentData.user.password);
      const { data: newUser, error: userError } = await supabase
        .from('user')
        .insert({
        name: agentData.user.name,
        email: agentData.user.email,
          hashed_password: hashedPassword,
        phone: agentData.user.phone || null,
        avatar: agentData.user.avatar || null,
          role: 'Agent',
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        throw new Error('Erro ao criar usuário: ' + userError.message);
      }

      userId = newUser.id;
    } else {
      // Usar usuário existente
      const { data: user, error: userError } = await supabase
        .from('user')
        .select('id, role')
        .eq('id', agentData.user_id)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.role !== 'Agent') {
        throw new Error('O usuário deve ter o papel de Agent');
      }

      // Verificar se já é agente
      const { data: existingAgent, error: agentError } = await supabase
        .from('agent')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingAgent) {
        throw new Error('Este usuário já é um agente');
      }

      userId = user.id;
    }

    // Criar o agente
    const { data: agent, error: agentError } = await supabase
      .from('agent')
      .insert({
        user_id: userId,
        employee_id: agentData.employee_id,
        department: agentData.department,
        skills: agentData.skills || [],
        max_tickets: agentData.max_tickets || 10,
        is_active: true
      })
      .select(`
        *,
        user (
          id,
          name,
          email,
          phone,
          avatar,
          is_active
        )
      `)
      .single();

    if (agentError) {
      throw new Error('Erro ao criar agente: ' + agentError.message);
    }

    return agent;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um agente no Supabase
 * @param {number} agentId - ID do agente
 * @param {Object} agentData - Novos dados do agente
 * @returns {Object} - Agente atualizado
 * @throws {Error} - Erro ao atualizar agente
 */
async function updateSupabaseAgent(agentId, agentData) {
  try {
    // Verificar se o agente existe
    const { data: existingAgent, error: checkError } = await supabase
      .from('agent')
      .select('id')
      .eq('id', agentId)
      .single();

    if (checkError || !existingAgent) {
      throw new Error('Agente não encontrado');
    }

    // Atualizar dados do agente
    const updateData = {};
    if (agentData.employee_id) updateData.employee_id = agentData.employee_id;
    if (agentData.department) updateData.department = agentData.department;
    if (agentData.skills) updateData.skills = agentData.skills;
    if (agentData.max_tickets !== undefined) updateData.max_tickets = agentData.max_tickets;
    if (agentData.is_active !== undefined) updateData.is_active = agentData.is_active;

    const { data: agent, error: agentError } = await supabase
      .from('agent')
      .update(updateData)
      .eq('id', agentId)
      .select(`
        *,
        user (
          id,
          name,
          email,
          phone,
          avatar,
          is_active
        )
      `)
      .single();

    if (agentError) {
      throw new Error('Erro ao atualizar agente: ' + agentError.message);
    }

    return agent;
  } catch (error) {
    throw error;
  }
}

/**
 * Deleta um agente do Supabase
 * @param {number} agentId - ID do agente
 * @param {boolean} deleteUser - Se deve deletar o usuário também
 * @returns {void}
 * @throws {Error} - Erro ao deletar agente
 */
async function deleteSupabaseAgent(agentId, deleteUser = false) {
  try {
    // Verificar se o agente existe e tem tickets ativos
    const { data: agent, error: checkError } = await supabase
      .from('agent')
      .select(`
        id,
        user_id,
        user (
          id,
          name,
          email
        )
      `)
      .eq('id', agentId)
      .single();

    if (checkError || !agent) {
      throw new Error('Agente não encontrado');
    }

    // Verificar tickets ativos
    const { data: activeTickets, error: ticketsError } = await supabase
      .from('ticket')
      .select('id')
      .eq('assigned_to', agent.user_id)
      .in('status', ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']);

    if (ticketsError) {
      throw new Error('Erro ao verificar tickets ativos');
    }

    if (activeTickets && activeTickets.length > 0) {
      throw new Error('Não é possível deletar agente com tickets ativos');
    }

    // Deletar agente
    const { error: deleteError } = await supabase
      .from('agent')
      .delete()
      .eq('id', agentId);

    if (deleteError) {
      throw new Error('Erro ao deletar agente: ' + deleteError.message);
    }

    // Se solicitado, deletar usuário também
    if (deleteUser) {
      const { error: userDeleteError } = await supabase
        .from('user')
        .delete()
        .eq('id', agent.user_id);

      if (userDeleteError) {
        console.warn('Erro ao deletar usuário:', userDeleteError.message);
      }
    }

    return { message: 'Agente deletado com sucesso' };
  } catch (error) {
    throw error;
  }
}

/**
 * Lista todos os agentes do Supabase
 * @param {Object} options - Opções de filtro e paginação
 * @returns {Object} - Lista de agentes com paginação
 * @throws {Error} - Erro ao buscar agentes
 */
async function getAllSupabaseAgents(options = {}) {
  try {
    const { page = 1, limit = 10, department, is_active, search } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('agent')
      .select(`
        *,
        user (
          id,
          name,
          email,
          phone,
          avatar,
          is_active
        )
      `);

    // Aplicar filtros
    if (department) {
      query = query.eq('department', department);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }
    
    if (search) {
      query = query.or(`user.name.ilike.%${search}%,user.email.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    // Contar total
    const { count, error: countError } = await query.count();

    if (countError) {
      throw new Error('Erro ao contar agentes: ' + countError.message);
    }

    // Buscar dados com paginação
    const { data: agents, error: agentsError } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (agentsError) {
      throw new Error('Erro ao buscar agentes: ' + agentsError.message);
    }

    return {
      agents,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Busca um agente específico por ID
 * @param {number} agentId - ID do agente
 * @returns {Object|null} - Agente encontrado ou null
 * @throws {Error} - Erro ao buscar agente
 */
async function getSupabaseAgentById(agentId) {
  try {
    const { data: agent, error } = await supabase
      .from('agent')
      .select(`
        *,
        user (
          id,
          name,
          email,
          phone,
          avatar,
          is_active
        )
      `)
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('Erro ao buscar agente: ' + error.message);
    }

    return agent;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém estatísticas de um agente
 * @param {number} agentId - ID do agente
 * @param {number} period - Período em dias para as estatísticas
 * @returns {Object} - Estatísticas do agente
 * @throws {Error} - Erro ao buscar estatísticas
 */
async function getSupabaseAgentStats(agentId, period = 30) {
  try {
    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from('agent')
      .select('id, user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agente não encontrado');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Tickets atribuídos no período
    const { count: assignedTickets, error: assignedError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', agent.user_id)
      .gte('created_at', startDate.toISOString());

    if (assignedError) {
      throw new Error('Erro ao contar tickets atribuídos: ' + assignedError.message);
    }

    // Tickets resolvidos no período
    const { count: resolvedTickets, error: resolvedError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', agent.user_id)
      .eq('status', 'Resolved')
      .gte('closed_at', startDate.toISOString());

    if (resolvedError) {
      throw new Error('Erro ao contar tickets resolvidos: ' + resolvedError.message);
    }

    // Tickets fechados no período
    const { count: closedTickets, error: closedError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', agent.user_id)
      .eq('status', 'Closed')
      .gte('closed_at', startDate.toISOString());

    if (closedError) {
      throw new Error('Erro ao contar tickets fechados: ' + closedError.message);
    }

    // Tempo médio de resolução
    const { data: resolutionData, error: resolutionError } = await supabase
      .from('ticket')
      .select('resolution_time')
      .eq('assigned_to', agent.user_id)
      .in('status', ['Resolved', 'Closed'])
      .not('resolution_time', 'is', null)
      .gte('closed_at', startDate.toISOString());

    if (resolutionError) {
      throw new Error('Erro ao buscar tempo de resolução: ' + resolutionError.message);
    }

    const avgResolutionTime = resolutionData.length > 0 
      ? resolutionData.reduce((sum, ticket) => sum + (ticket.resolution_time || 0), 0) / resolutionData.length
      : 0;

    // Avaliação média de satisfação
    const { data: satisfactionData, error: satisfactionError } = await supabase
      .from('ticket')
      .select('satisfaction_rating')
      .eq('assigned_to', agent.user_id)
      .not('satisfaction_rating', 'is', null)
      .gte('closed_at', startDate.toISOString());

    if (satisfactionError) {
      throw new Error('Erro ao buscar avaliações: ' + satisfactionError.message);
    }

    const avgSatisfaction = satisfactionData.length > 0
      ? satisfactionData.reduce((sum, ticket) => sum + (ticket.satisfaction_rating || 0), 0) / satisfactionData.length
      : 0;

    return {
      period,
      assigned_tickets: assignedTickets || 0,
      resolved_tickets: resolvedTickets || 0,
      closed_tickets: closedTickets || 0,
      avg_resolution_time: avgResolutionTime,
      avg_satisfaction: avgSatisfaction
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém tickets ativos de um agente
 * @param {number} agentId - ID do agente
 * @param {Object} options - Opções de paginação
 * @returns {Object} - Lista de tickets ativos
 */
async function getSupabaseAgentActiveTickets(agentId, options = {}) {
  try {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from('agent')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agente não encontrado');
    }

    // Buscar tickets ativos
    const { data: tickets, error: ticketsError } = await supabase
      .from('ticket')
      .select(`
        *,
        category (name),
        subcategory (name),
        client:user!ticket_client_id (name, email)
      `)
      .eq('assigned_to', agent.user_id)
      .in('status', ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'])
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      throw new Error('Erro ao buscar tickets ativos: ' + ticketsError.message);
    }

    return {
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: tickets?.length || 0
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém tickets atribuídos ao agente logado
 * @param {number} userId - ID do usuário agente
 * @param {Object} options - Opções de filtro e paginação
 * @returns {Object} - Lista de tickets atribuídos
 */
async function getSupabaseAgentAssignedTickets(userId, options = {}) {
  try {
    const { page = 1, limit = 10, status, priority } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('ticket')
      .select(`
        *,
        category (name),
        subcategory (name),
        client:user!ticket_client_id (name, email)
      `)
      .eq('assigned_to', userId);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Buscar dados com paginação
    const { data: tickets, error: ticketsError } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      throw new Error('Erro ao buscar tickets atribuídos: ' + ticketsError.message);
    }

    return {
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: tickets?.length || 0
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém histórico de tickets do agente
 * @param {number} userId - ID do usuário agente
 * @param {Object} options - Opções de paginação
 * @returns {Object} - Histórico de tickets
 */
async function getSupabaseAgentTicketHistory(userId, options = {}) {
  try {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data: tickets, error: ticketsError } = await supabase
      .from('ticket')
      .select(`
        *,
        category (name),
        subcategory (name),
        client:user!ticket_client_id (name, email)
      `)
      .eq('assigned_to', userId)
      .in('status', ['Resolved', 'Closed'])
      .range(offset, offset + limit - 1)
      .order('closed_at', { ascending: false });

    if (ticketsError) {
      throw new Error('Erro ao buscar histórico de tickets: ' + ticketsError.message);
    }

    return {
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: tickets?.length || 0
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém estatísticas pessoais do agente
 * @param {number} userId - ID do usuário agente
 * @returns {Object} - Estatísticas pessoais
 */
async function getSupabaseAgentPersonalStats(userId) {
  try {
    // Estatísticas gerais
    const { count: totalTickets, error: totalError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', userId);

    if (totalError) {
      throw new Error('Erro ao contar tickets totais: ' + totalError.message);
    }

    const { count: activeTickets, error: activeError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', userId)
      .in('status', ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']);

    if (activeError) {
      throw new Error('Erro ao contar tickets ativos: ' + activeError.message);
    }

    const { count: resolvedTickets, error: resolvedError } = await supabase
      .from('ticket')
      .select('id', { count: 'exact' })
      .eq('assigned_to', userId)
      .eq('status', 'Resolved');

    if (resolvedError) {
      throw new Error('Erro ao contar tickets resolvidos: ' + resolvedError.message);
    }

    return {
      total_tickets: totalTickets || 0,
      active_tickets: activeTickets || 0,
      resolved_tickets: resolvedTickets || 0,
      resolution_rate: totalTickets > 0 ? ((resolvedTickets || 0) / totalTickets * 100).toFixed(2) : 0
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza status de um ticket
 * @param {Object} data - Dados para atualização
 * @returns {Object} - Ticket atualizado
 */
async function updateSupabaseTicketStatus(data) {
  try {
    const { ticket_id, agent_id, status, notes } = data;

    // Verificar se o ticket existe e está atribuído ao agente
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select('id, status, assigned_to')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket não encontrado');
    }

    if (ticket.assigned_to !== agent_id) {
      throw new Error('Ticket não está atribuído a este agente');
    }

    // Atualizar status do ticket
    const updateData = { status };
    if (status === 'Resolved' || status === 'Closed') {
      updateData.closed_at = new Date().toISOString();
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from('ticket')
      .update(updateData)
      .eq('id', ticket_id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Erro ao atualizar status do ticket: ' + updateError.message);
    }

    // Se há notas, criar comentário
    if (notes) {
      await createSupabaseComment({
        ticket_id,
        user_id: agent_id,
        content: `**Atualização de Status:** ${status}\n\n${notes}`,
        is_internal: true,
        agent_only: true
      });
    }

    return updatedTicket;
  } catch (error) {
    throw error;
  }
}

/**
 * Cria um comentário em um ticket
 * @param {Object} data - Dados do comentário
 * @returns {Object} - Comentário criado
 */
async function createSupabaseComment(data) {
  try {
    const { ticket_id, user_id, content, is_internal = false, agent_only = false, update_status } = data;

    // Verificar se o ticket existe
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select('id, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket não encontrado');
    }

    // Criar comentário
    const { data: comment, error: commentError } = await supabase
      .from('comment')
      .insert({
        ticket_id,
        user_id,
        content,
        is_internal,
        agent_only,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commentError) {
      throw new Error('Erro ao criar comentário: ' + commentError.message);
    }

    // Se há atualização de status
    if (update_status) {
      const { error: statusError } = await supabase
        .from('ticket')
        .update({ status: update_status })
        .eq('id', ticket_id);

      if (statusError) {
        console.warn('Erro ao atualizar status do ticket:', statusError.message);
      }
    }

    return comment;
  } catch (error) {
    throw error;
  }
}

export {
  createSupabaseAgent,
  updateSupabaseAgent,
  deleteSupabaseAgent,
  getAllSupabaseAgents,
  getSupabaseAgentById,
  getSupabaseAgentStats,
  getSupabaseAgentActiveTickets,
  getSupabaseAgentAssignedTickets,
  getSupabaseAgentTicketHistory,
  getSupabaseAgentPersonalStats,
  updateSupabaseTicketStatus,
  createSupabaseComment
};