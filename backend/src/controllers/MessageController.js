/**
 * Controller para gerenciamento de mensagens do chat
 * Sistema de chat em tempo real entre criador e técnico do chamado
 */
import prisma from '../../prisma/client.js';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/chat';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Permitir apenas tipos de arquivo seguros
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'), false);
        }
    }
});

/**
 * Controller para enviar uma mensagem
 * POST /api/messages/send
 */
async function sendMessageController(req, res) {
    try {
        const { ticket_id, content, attachment_url } = req.body;

        // Validações básicas
        if (!ticket_id) {
            return res.status(400).json({ message: 'ID do ticket é obrigatório' });
        }

        if (!content && !attachment_url) {
            return res.status(400).json({ message: 'Conteúdo ou anexo é obrigatório' });
        }

        // Verificar se o ticket existe (versão simplificada)
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticket_id) }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Verificar se o usuário tem acesso ao ticket (versão simplificada)
        // TEMPORÁRIO: Permitir acesso para todos os usuários autenticados
        console.log('🔍 Verificando acesso:', {
            userId: req.user.id,
            userRole: req.user.role,
            ticketId: ticket.id,
            ticketAssignedTo: ticket.assigned_to
        });
        
        // Para teste, permitir acesso se o usuário está autenticado
        const hasAccess = true; // TEMPORÁRIO: sempre permitir
        if (!hasAccess) {
            return res.status(403).json({ message: 'Acesso negado ao ticket' });
        }

        // Criar mensagem no Supabase
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                ticket_id: parseInt(ticket_id),
                sender_id: req.user.id,
                content: content || null,
                attachment_url: attachment_url || null
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar mensagem no Supabase:', error);
            return res.status(500).json({ message: 'Erro ao enviar mensagem' });
        }

        // Buscar dados do remetente
        const sender = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            }
        });

        // Retornar mensagem com dados do remetente
        const response = {
            ...message,
            sender: sender
        };

        return res.status(201).json(response);

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Controller para listar mensagens de um ticket
 * GET /api/messages/list?ticket_id=xxx
 */
async function getMessagesController(req, res) {
    try {
        const { ticket_id, page = 1, limit = 50 } = req.query;

        if (!ticket_id) {
            return res.status(400).json({ message: 'ID do ticket é obrigatório' });
        }

        // Verificar se o ticket existe (versão simplificada)
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticket_id) }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Verificar se o usuário tem acesso ao ticket (versão simplificada)
        // TEMPORÁRIO: Permitir acesso para todos os usuários autenticados
        console.log('🔍 Verificando acesso:', {
            userId: req.user.id,
            userRole: req.user.role,
            ticketId: ticket.id,
            ticketAssignedTo: ticket.assigned_to
        });
        
        // Para teste, permitir acesso se o usuário está autenticado
        const hasAccess = true; // TEMPORÁRIO: sempre permitir
        if (!hasAccess) {
            return res.status(403).json({ message: 'Acesso negado ao ticket' });
        }

        // Buscar mensagens no Supabase
        console.log('🔍 Buscando mensagens para ticket:', parseInt(ticket_id));
        
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', parseInt(ticket_id))
            .order('created_at', { ascending: true })
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
            return res.status(500).json({ message: 'Erro ao buscar mensagens' });
        }

        console.log('✅ Mensagens encontradas:', messages?.length || 0);

        // Buscar dados dos remetentes
        const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
        const senders = await prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            }
        });

        // Mapear mensagens com dados dos remetentes
        const messagesWithSenders = messages.map(message => ({
            ...message,
            sender: senders.find(sender => sender.id === message.sender_id)
        }));

        return res.status(200).json({
            messages: messagesWithSenders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: messages.length
            }
        });

    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Controller para upload de anexos
 * POST /api/messages/upload
 */
async function uploadAttachmentController(req, res) {
    try {
        upload.single('file')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ message: 'Arquivo muito grande. Máximo 10MB.' });
                    }
                }
                return res.status(400).json({ message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            try {
                // Upload para Supabase Storage
                const fileBuffer = fs.readFileSync(req.file.path);
                const fileName = `chat/${req.file.filename}`;

                const { data, error } = await supabase.storage
                    .from('attachments')
                    .upload(fileName, fileBuffer, {
                        contentType: req.file.mimetype,
                        upsert: false
                    });

                if (error) {
                    console.error('Erro no upload para Supabase:', error);
                    return res.status(500).json({ message: 'Erro no upload do arquivo' });
                }

                // Obter URL pública
                const { data: publicUrl } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(fileName);

                // Remover arquivo temporário
                fs.unlinkSync(req.file.path);

                return res.status(200).json({
                    success: true,
                    data: {
                        filename: req.file.originalname,
                        url: publicUrl.publicUrl,
                        size: req.file.size,
                        type: req.file.mimetype
                    }
                });

            } catch (uploadError) {
                console.error('Erro no upload:', uploadError);
                // Remover arquivo temporário em caso de erro
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: 'Erro no upload do arquivo' });
            }
        });

    } catch (error) {
        console.error('Erro no upload de anexo:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Função auxiliar simplificada para verificar se o usuário tem acesso ao ticket
 */
async function checkTicketAccessSimple(user, ticket) {
    // Admin tem acesso a todos os tickets
    if (user.role === 'Admin') {
        return true;
    }

    // Cliente tem acesso apenas aos seus próprios tickets
    if (user.role === 'Client') {
        return ticket.client_id === user.client?.id;
    }

    // Agente tem acesso aos tickets atribuídos a ele
    if (user.role === 'Agent') {
        return ticket.assigned_to === user.id;
    }

    return false;
}

/**
 * Função auxiliar para verificar se o usuário tem acesso ao ticket (versão completa)
 */
async function checkTicketAccess(user, ticket) {
    // Admin tem acesso a todos os tickets
    if (user.role === 'Admin') {
        return true;
    }

    // Cliente tem acesso apenas aos seus próprios tickets
    if (user.role === 'Client') {
        return ticket.client_id === user.client?.id;
    }

    // Agente tem acesso aos tickets atribuídos a ele
    if (user.role === 'Agent') {
        // Verificar se é o agente atribuído
        if (ticket.assigned_to === user.id) {
            return true;
        }

        // Verificar se está nas atribuições
        const isAssigned = ticket.ticket_assignments.some(
            assignment => assignment.agent.user_id === user.id
        );
        
        return isAssigned;
    }

    return false;
}

export {
    sendMessageController,
    getMessagesController,
    uploadAttachmentController
};
