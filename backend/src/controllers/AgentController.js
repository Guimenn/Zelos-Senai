import { 
    createSupabaseAgent, 
    getAllSupabaseAgents, 
    getSupabaseAgentById, 
    updateSupabaseAgent, 
    deleteSupabaseAgent, 
    getSupabaseAgentStats,
    getSupabaseAgentActiveTickets,
    getSupabaseAgentAssignedTickets,
    getSupabaseAgentTicketHistory,
    getSupabaseAgentPersonalStats,
    updateSupabaseTicketStatus,
    createSupabaseComment
} from '../models/SupabaseAgent.js';
import { agentCreateSchema, agentUpdateSchema } from '../schemas/agent.schema.js';
import { ZodError } from 'zod/v4';
import { generateHashPassword } from '../utils/hash.js';

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
        // Criar agente usando o modelo Supabase
        const agent = await createSupabaseAgent(agentData);
        return res.status(201).json(agent);
    } catch (error) {
        console.error('Erro ao criar agente:', error);
        
        // Retornar mensagem de erro específica
        if (error.message.includes('já está em uso')) {
            return res.status(400).json({ message: error.message });
        }
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message.includes('já é um agente')) {
            return res.status(400).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao criar agente', error: error.message });
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

        // Buscar agentes usando o modelo Supabase
        const result = await getAllSupabaseAgents({
            page: parseInt(page),
            limit: parseInt(limit),
            department,
            is_active: is_active !== undefined ? is_active === 'true' : undefined,
            search
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar agentes:', error);
        return res.status(500).json({ message: 'Erro ao buscar agentes', error: error.message });
    }
}

// Controller para obter um agente específico
async function getAgentByIdController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);

        // Buscar agente usando o modelo Supabase
        const agent = await getSupabaseAgentById(agentId);

        if (!agent) {
            return res.status(404).json({ message: 'Agente não encontrado' });
        }

        return res.status(200).json(agent);
    } catch (error) {
        console.error('Erro ao buscar agente:', error);
        return res.status(500).json({ message: 'Erro ao buscar agente', error: error.message });
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

        // Atualizar agente usando o modelo Supabase
        const agent = await updateSupabaseAgent(agentId, agentData);

        return res.status(200).json(agent);
    } catch (error) {
        console.error('Erro ao atualizar agente:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao atualizar agente', error: error.message });
    }
}

// Controller para deletar um agente
async function deleteAgentController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);

        // Deletar agente usando o modelo Supabase
        await deleteSupabaseAgent(agentId);

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar agente:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message.includes('tickets ativos')) {
            return res.status(400).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao deletar agente', error: error.message });
    }
}

// Controller para obter estatísticas do agente
async function getAgentStatsController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);
        const { period = '30' } = req.query; // dias

        // Obter estatísticas do agente usando o modelo Supabase
        const stats = await getSupabaseAgentStats(agentId, parseInt(period));
        
        return res.status(200).json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas do agente:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao obter estatísticas do agente', error: error.message });
    }
}

// Controller para obter tickets ativos do agente
async function getAgentActiveTicketsController(req, res) {
    try {
        const agentId = parseInt(req.params.agentId);
        const { page = 1, limit = 10 } = req.query;

        // Buscar tickets ativos do agente usando o modelo Supabase
        const result = await getSupabaseAgentActiveTickets(agentId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar tickets ativos do agente:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao buscar tickets ativos do agente', error: error.message });
    }
}

// Controller para obter tickets atribuídos ao agente logado
async function getMyAssignedTicketsController(req, res) {
    try {
        const { page = 1, limit = 10, status, priority } = req.query;

        // Buscar tickets atribuídos ao agente logado usando o modelo Supabase
        const result = await getSupabaseAgentAssignedTickets(req.user.id, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            priority
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar tickets atribuídos:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets atribuídos', error: error.message });
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

        // Atualizar status do ticket usando o modelo Supabase
        const result = await updateSupabaseTicketStatus({
            ticket_id: parseInt(ticketId),
            agent_id: req.user.id,
            status,
            notes: notes || undefined
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao alterar status do ticket:', error);
        
        if (error.message.includes('não encontrado') || error.message.includes('não atribuído')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao alterar status do ticket', error: error.message });
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

        // Criar comentário técnico usando o modelo Supabase
        const comment = await createSupabaseComment({
            ticket_id: parseInt(ticketId),
            user_id: req.user.id,
            content: content.trim(),
            is_internal,
            agent_only: true
        });

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Erro ao adicionar comentário técnico:', error);
        
        if (error.message.includes('não encontrado') || error.message.includes('não atribuído')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao adicionar comentário técnico', error: error.message });
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

        // Criar comentário solicitando informações adicionais usando o modelo Supabase
        // Isso também atualizará o status do ticket para WaitingForClient
        const result = await createSupabaseComment({
            ticket_id: parseInt(ticketId),
            user_id: req.user.id,
            content: `🔍 **Solicitação de Informações Adicionais**\n\n${request_message}\n\nPor favor, forneça as informações solicitadas para que possamos prosseguir com o atendimento.`,
            is_internal: false,
            update_status: 'WaitingForClient',
            agent_only: true
        });

        return res.status(201).json({
            message: 'Solicitação de informações enviada com sucesso',
            comment: result,
            ticket_status: 'WaitingForClient'
        });
    } catch (error) {
        console.error('Erro ao solicitar informações adicionais:', error);
        
        if (error.message.includes('não encontrado') || error.message.includes('não atribuído')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao solicitar informações adicionais', error: error.message });
    }
}

// Controller para obter histórico dos tickets atendidos
async function getMyTicketHistoryController(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;

        // Buscar histórico de tickets usando o modelo Supabase
        const result = await getSupabaseAgentTicketHistory(req.user.id, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar histórico de tickets:', error);
        return res.status(500).json({ message: 'Erro ao buscar histórico de tickets', error: error.message });
    }
}

// Controller para obter estatísticas pessoais do agente
async function getMyStatisticsController(req, res) {
    try {
        const agentId = req.user.id;

        // Buscar estatísticas do agente usando o modelo Supabase
        const result = await getSupabaseAgentPersonalStats(agentId);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
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
    addTechnicalCommentController,
    requestAdditionalInfoController,
    getMyTicketHistoryController,
    getMyStatisticsController,
};