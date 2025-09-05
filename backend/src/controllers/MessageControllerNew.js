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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.error('❌ A chave anônima não tem permissões para acessar o schema public');
}

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
 * Função para verificar se o usuário tem acesso ao chat do ticket
 * Regras:
 * - Criador do chamado pode acessar
 * - Técnico atribuído pode acessar
 * - Admin pode acessar todos (exceto os seus próprios)
 */
async function checkChatAccess(user, ticket) {
    console.log('🔍 Verificando acesso ao chat:', {
        userId: user.id,
        userRole: user.role,
        ticketId: ticket.id,
        ticketCreator: ticket.created_by,
        ticketAssignedTo: ticket.assigned_to
    });

    // Admin pode acessar todos os chats, exceto os seus próprios
    if (user.role === 'Admin') {
        // Se o admin criou o ticket, ele não pode acessar o chat (só visualizar)
        if (ticket.created_by === user.id) {
            return { canAccess: true, canSend: false, reason: 'Admin não pode enviar mensagens em seus próprios tickets' };
        }
        return { canAccess: true, canSend: true, reason: 'Admin pode acessar todos os chats' };
    }

    // Criador do chamado pode acessar e enviar mensagens
    if (ticket.created_by === user.id) {
        return { canAccess: true, canSend: true, reason: 'Criador do ticket' };
    }

    // Técnico atribuído pode acessar e enviar mensagens
    if (ticket.assigned_to === user.id) {
        return { canAccess: true, canSend: true, reason: 'Técnico atribuído' };
    }

    // Outros usuários não têm acesso
    return { canAccess: false, canSend: false, reason: 'Sem permissão para acessar este chat' };
}

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

        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticket_id) }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Verificar se o usuário tem acesso ao chat
        const chatAccess = await checkChatAccess(req.user, ticket);
        if (!chatAccess.canAccess) {
            return res.status(403).json({ message: chatAccess.reason });
        }

        // Verificar se o ticket está fechado (não permite envio de mensagens)
        const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticket.status);
        if (isClosed) {
            return res.status(403).json({ message: 'Não é possível enviar mensagens em tickets fechados' });
        }

        // Verificar se o usuário pode enviar mensagens
        if (!chatAccess.canSend) {
            return res.status(403).json({ message: chatAccess.reason });
        }

        // Criar mensagem usando Prisma
        console.log('🔍 Criando mensagem para ticket:', parseInt(ticket_id));
        
        const message = await prisma.messages.create({
            data: {
                ticket_id: parseInt(ticket_id),
                sender_id: req.user.id,
                content: content || null,
                attachment_url: attachment_url || null
            }
        });

        console.log('✅ Mensagem criada:', message.id);

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

        // Verificar se o ticket existe
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticket_id) }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        // Verificar se o usuário tem acesso ao chat
        const chatAccess = await checkChatAccess(req.user, ticket);
        if (!chatAccess.canAccess) {
            return res.status(403).json({ message: chatAccess.reason });
        }

        // Buscar mensagens usando Prisma
        console.log('🔍 Buscando mensagens para ticket:', parseInt(ticket_id));
        
        const messages = await prisma.messages.findMany({
            where: {
                ticket_id: parseInt(ticket_id)
            },
            orderBy: {
                created_at: 'asc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

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
            },
            chatAccess: {
                canAccess: chatAccess.canAccess,
                canSend: chatAccess.canSend,
                reason: chatAccess.reason,
                ticketStatus: ticket.status
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

export {
    sendMessageController,
    getMessagesController,
    uploadAttachmentController,
    checkChatAccess
};
