import { 
    createSupabaseTicket, 
    getAllSupabaseTickets, 
    getSupabaseTicketById, 
    updateSupabaseTicket, 
    assignSupabaseTicket, 
    addSupabaseTicketComment 
} from '../models/SupabaseTicket.js';
import { ticketCreateSchema, ticketUpdateSchema } from '../schemas/ticket.schema.js';
import { ZodError } from 'zod/v4';

// Função generateTicketNumber foi movida para o modelo SupabaseTicket.js

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
        // Criar ticket usando o modelo Supabase
        const ticket = await createSupabaseTicket(ticketData, req.user);
        return res.status(201).json(ticket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        return res.status(500).json({ message: 'Erro ao criar ticket', error: error.message });
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

        // Buscar tickets usando o modelo Supabase
        const result = await getAllSupabaseTickets({
            page,
            limit,
            status,
            priority,
            category_id,
            assigned_to,
            search
        }, req.user);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        return res.status(500).json({ message: 'Erro ao buscar tickets', error: error.message });
    }
}

// Controller para obter um ticket específico
async function getTicketByIdController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        // Buscar ticket usando o modelo Supabase
        const ticket = await getSupabaseTicketById(ticketId, req.user);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }
        
        return res.status(200).json(ticket);
    } catch (error) {
        console.error('Erro ao buscar ticket:', error);
        
        if (error.message.includes('Acesso negado')) {
            return res.status(403).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao buscar ticket', error: error.message });
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
        
        // Atualizar ticket usando o modelo Supabase
        const ticket = await updateSupabaseTicket(ticketId, ticketData, req.user);
        return res.status(200).json(ticket);
    } catch (error) {
        console.error('Erro ao atualizar ticket:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message.includes('Acesso negado')) {
            return res.status(403).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao atualizar ticket', error: error.message });
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

        // Atribuir ticket usando o modelo Supabase
        const updatedTicket = await assignSupabaseTicket(ticketId, agent_id, req.user);
        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao atribuir ticket:', error);
        
        if (error.message.includes('não encontrado') || error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao atribuir ticket', error: error.message });
    }
}

// Controller para fechar um ticket
async function closeTicketController(req, res) {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const { satisfaction_rating } = req.body;

        const updateData = {
            status: 'Closed',
            closed_at: new Date(),
        };

        if (satisfaction_rating && req.user.role === 'Client') {
            updateData.satisfaction_rating = satisfaction_rating;
        }

        // Atualizar ticket usando o modelo Supabase
        const updatedTicket = await updateSupabaseTicket(ticketId, updateData, req.user);
        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao fechar ticket:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message.includes('Acesso negado')) {
            return res.status(403).json({ message: error.message });
        }
        
        return res.status(500).json({ message: 'Erro ao fechar ticket', error: error.message });
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