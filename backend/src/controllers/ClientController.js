import { clientCreateSchema, clientUpdateSchema } from '../schemas/client.schema.js';
import { ZodError } from 'zod/v4';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient, updateSupabaseClient, deleteSupabaseClient, getAllSupabaseClients, getSupabaseClientById, getSupabaseClientTickets, getSupabaseClientTicketHistory } from '../models/SupabaseClient.js';
import { getSupabaseTicketById, updateSupabaseTicket } from '../models/SupabaseTicket.js';
import { addSupabaseTicketComment } from '../models/SupabaseComment.js';

// Configurar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar se as variáveis estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
}


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
        // Criar cliente usando o modelo Supabase
        const client = await createSupabaseClient(clientData);
        return res.status(201).json(client);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        return res.status(500).json({ 
            message: 'Erro ao criar cliente',
            error: error.message
        });
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

        // Obter clientes usando o modelo Supabase
        const result = await getAllSupabaseClients({
            page: parseInt(page),
            limit: parseInt(limit),
            filters: {
                client_type,
                is_active: is_active !== undefined ? is_active === 'true' : undefined,
                search
            }
        });

        return res.status(200).json({
            clients: result.clients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit))
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
        const clientId = parseInt(req.params.clientId);
        const client = await getSupabaseClientById(clientId);

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar cliente',
            error: error.message 
        });
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
        const client = await updateSupabaseClient(clientId, clientData);

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return res.status(500).json({ 
            message: 'Erro ao atualizar cliente',
            error: error.message 
        });
    }
}

// Controller para deletar um cliente
async function deleteClientController(req, res) {
    try {
        const clientId = parseInt(req.params.clientId);
        const result = await deleteSupabaseClient(clientId);
        
        if (!result) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        return res.status(500).json({ 
            message: 'Erro ao deletar cliente',
            error: error.message 
        });
    }
}

// Controller para obter tickets do cliente logado
async function getMyTicketsController(req, res) {
    try {
        const { page = 1, limit = 10, status, priority } = req.query;
        
        if (!req.user || !req.user.client) {
            return res.status(403).json({ message: 'Usuário não é um cliente' });
        }

        const clientId = req.user.client.id;
        const result = await getSupabaseClientTickets(clientId, {
            page: parseInt(page),
            limit: parseInt(limit),
            filters: {
                status,
                priority
            }
        });

        return res.status(200).json({
            tickets: result.tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit)),
            }
        });
    } catch (error) {
        console.error('Erro ao buscar tickets do cliente:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar tickets',
            error: error.message 
        });
    }
}

// Controller para obter histórico de tickets do cliente
async function getMyTicketHistoryController(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        if (!req.user || !req.user.client) {
            return res.status(403).json({ message: 'Usuário não é um cliente' });
        }

        const clientId = req.user.client.id;
        const result = await getSupabaseClientTicketHistory(clientId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(200).json({
            tickets: result.tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit)),
            }
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de tickets:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar histórico',
            error: error.message 
        });
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

        if (!req.user || !req.user.client) {
            return res.status(403).json({ message: 'Usuário não é um cliente' });
        }

        // Verificar se o ticket existe e pertence ao cliente
        const ticket = await getSupabaseTicketById(parseInt(ticketId), req.user);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        if (ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        if (!['Resolved', 'Closed'].includes(ticket.status)) {
            return res.status(400).json({ message: 'Apenas tickets resolvidos ou fechados podem ser avaliados' });
        }

        if (ticket.satisfaction_rating) {
            return res.status(400).json({ message: 'Ticket já foi avaliado' });
        }

        // Atualizar o ticket com a avaliação
        const updatedTicket = await updateSupabaseTicket(parseInt(ticketId), {
            satisfaction_rating: parseInt(satisfaction_rating)
        }, req.user);

        // Adicionar comentário com feedback se fornecido
        if (feedback) {
            await addSupabaseTicketComment(parseInt(ticketId), {
                content: `Avaliação: ${satisfaction_rating}/5\nFeedback: ${feedback}`,
                is_internal: false
            }, req.user);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao avaliar ticket:', error);
        return res.status(500).json({ 
            message: 'Erro ao avaliar ticket',
            error: error.message 
        });
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

        if (!req.user || !req.user.client) {
            return res.status(403).json({ message: 'Usuário não é um cliente' });
        }

        // Verificar se o ticket existe e pertence ao cliente
        const ticket = await getSupabaseTicketById(parseInt(ticketId), req.user);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        if (ticket.client_id !== req.user.client.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        // Adicionar comentário usando o modelo Supabase
        const comment = await addSupabaseTicketComment(parseInt(ticketId), {
            content: content.trim(),
            is_internal: false
        }, req.user);

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        return res.status(500).json({ 
            message: 'Erro ao adicionar comentário',
            error: error.message 
        });
    }
}

// Controller para obter estatísticas pessoais do cliente
async function getMyStatisticsController(req, res) {
    try {
        if (!req.user || !req.user.client) {
            return res.status(403).json({ message: 'Usuário não é um cliente' });
        }
        
        const clientId = req.user.client.id;
        
        // Usar Supabase para obter estatísticas
        const { data: totalTicketsData, error: totalError } = await supabase
            .from('ticket')
            .select('id', { count: 'exact' })
            .eq('client_id', clientId);
            
        if (totalError) {
            throw new Error('Erro ao contar tickets totais: ' + totalError.message);
        }
        
        const { count: openTickets, error: openError } = await supabase
            .from('ticket')
            .select('id', { count: 'exact' })
            .eq('client_id', clientId)
            .eq('status', 'Open');
            
        if (openError) {
            throw new Error('Erro ao contar tickets abertos: ' + openError.message);
        }
        
        const { count: resolvedTickets, error: resolvedError } = await supabase
            .from('ticket')
            .select('id', { count: 'exact' })
            .eq('client_id', clientId)
            .eq('status', 'Resolved');
            
        if (resolvedError) {
            throw new Error('Erro ao contar tickets resolvidos: ' + resolvedError.message);
        }
        
        // Obter tickets com avaliação para calcular média
        const { data: satisfactionData, error: satisfactionError } = await supabase
            .from('ticket')
            .select('satisfaction_rating')
            .eq('client_id', clientId)
            .not('satisfaction_rating', 'is', null);
            
        if (satisfactionError) {
            throw new Error('Erro ao obter avaliações: ' + satisfactionError.message);
        }
        
        const avgSatisfaction = satisfactionData.length > 0
            ? satisfactionData.reduce((sum, ticket) => sum + (ticket.satisfaction_rating || 0), 0) / satisfactionData.length
            : 0;
            
        // Obter tickets por categoria
        const { data: categoryData, error: categoryError } = await supabase
            .from('ticket')
            .select('category_id')
            .eq('client_id', clientId);
            
        if (categoryError) {
            throw new Error('Erro ao obter categorias: ' + categoryError.message);
        }
        
        // Agrupar tickets por categoria
        const ticketsByCategory = categoryData.reduce((acc, ticket) => {
            const categoryId = ticket.category_id;
            if (!acc[categoryId]) {
                acc[categoryId] = { category_id: categoryId, _count: { id: 0 } };
            }
            acc[categoryId]._count.id += 1;
            return acc;
        }, {});
        
        const statistics = {
            totalTickets: totalTicketsData.length || 0,
            openTickets: openTickets || 0,
            resolvedTickets: resolvedTickets || 0,
            avgSatisfaction: avgSatisfaction,
            ticketsByCategory: Object.values(ticketsByCategory),
        };
        
        return res.status(200).json(statistics);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({ 
            message: 'Erro ao buscar estatísticas',
            error: error.message 
        });
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