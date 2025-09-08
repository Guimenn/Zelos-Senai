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

console.log('🔍 Configuração do Supabase:');
console.log('🔍 URL:', supabaseUrl);
console.log('🔍 Key configurada:', supabaseKey ? 'Sim' : 'Não');

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.error('❌ Usando Prisma apenas');
} else {
    console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY configurada, mas pode não ter permissões adequadas');
    console.log('⚠️ Usando Prisma como fallback principal');
}

// Inicializar Supabase se as chaves estiverem configuradas
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

    // Converter IDs para números para comparação mais robusta
    const userId = parseInt(user.id);
    const ticketCreatorId = parseInt(ticket.created_by);
    const ticketAssignedToId = ticket.assigned_to ? parseInt(ticket.assigned_to) : null;

    console.log('🔍 IDs convertidos:', {
        userId,
        ticketCreatorId,
        ticketAssignedToId
    });

    // Verificar se há técnico atribuído (regra geral)
    const hasAssignee = !!(ticket.assigned_to);
    if (!hasAssignee) {
        console.log('❌ Sem técnico atribuído');
        return { canAccess: false, canSend: false, reason: 'chat.waitingTechnician' };
    }

    // Admin pode acessar todos os chats (após técnico aceitar)
    if (user.role === 'Admin') {
        // Se o admin criou o ticket, ele pode enviar mensagens
        if (ticketCreatorId === userId) {
            console.log('✅ Admin - criador do ticket');
            return { canAccess: true, canSend: true, reason: 'chat.adminCreator' };
        }
        // Se não criou, só pode visualizar
        console.log('✅ Admin - apenas visualização');
        return { canAccess: true, canSend: false, reason: 'chat.adminViewOnly' };
    }

    // Criador do chamado pode acessar e enviar mensagens
    if (ticketCreatorId === userId) {
        console.log('✅ Criador do ticket');
        return { canAccess: true, canSend: true, reason: 'chat.ticketCreator' };
    }

    // Técnico atribuído pode acessar e enviar mensagens
    if (ticketAssignedToId === userId) {
        console.log('✅ Técnico atribuído');
        return { canAccess: true, canSend: true, reason: 'chat.assignedTechnician' };
    }

    // Outros usuários não têm acesso
    console.log('❌ Sem permissão para acessar este chat');
    return { canAccess: false, canSend: false, reason: 'chat.noPermission' };
}

/**
 * Controller para enviar uma mensagem
 * POST /api/messages/send
 */
async function sendMessageController(req, res) {
    console.log('🔍 sendMessageController iniciado');
    console.log('🔍 Dados recebidos:', req.body);
    console.log('🔍 Usuário autenticado:', req.user);
    console.log('🔍 Headers:', req.headers);
    
    try {
        const { ticket_id, content, attachment_url, reply_to_id } = req.body;

        console.log('🔍 Dados extraídos:', {
            ticket_id,
            content,
            attachment_url,
            reply_to_id
        });

        // Validações básicas
        if (!ticket_id) {
            console.error('❌ ID do ticket não fornecido');
            return res.status(400).json({ message: 'ID do ticket é obrigatório' });
        }

        if ((!content || (typeof content === 'string' && content.trim() === '')) && !attachment_url) {
            console.error('❌ Nem conteúdo nem anexo fornecidos');
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

        // Criar mensagem usando Supabase (para Realtime funcionar) ou Prisma (fallback)
        let message;
        
        if (supabase) {
            console.log('🔍 Tentando criar mensagem no Supabase para ticket:', parseInt(ticket_id));
            
            try {
                const { data: supabaseMessage, error } = await supabase
                    .from('messages')
                    .insert({
                        ticket_id: parseInt(ticket_id),
                        sender_id: req.user.id,
                        content: (content && content.trim() !== '') ? content.trim() : null,
                        attachment_url: attachment_url || null,
                        reply_to_id: reply_to_id || null
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Erro ao criar mensagem no Supabase:', error);
                    console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
                    console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                    message = null; // Forçar fallback
                } else {
                    message = supabaseMessage;
                    console.log('✅ Mensagem criada no Supabase:', message.id);
                }
            } catch (supabaseError) {
                console.error('❌ Erro geral no Supabase:', supabaseError);
                console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                message = null; // Forçar fallback
            }
        } else {
            console.log('🔍 Supabase não disponível, usando Prisma diretamente');
        }
        
        // Fallback para Prisma se Supabase não estiver disponível ou falhar
        if (!message) {
            console.log('🔄 Criando mensagem no Prisma...');
            try {
                message = await prisma.messages.create({
                    data: {
                        ticket_id: parseInt(ticket_id),
                        sender_id: req.user.id,
                        content: (content && content.trim() !== '') ? content.trim() : null,
                        attachment_url: attachment_url || null,
                        reply_to_id: reply_to_id || null
                    }
                });
                
                console.log('✅ Mensagem criada no Prisma:', message.id);
            } catch (prismaError) {
                console.error('❌ Erro ao criar mensagem no Prisma:', prismaError);
                throw prismaError;
            }
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

        // Retornar mensagem com dados do remetente e campo FROM_Me
        const response = {
            ...message,
            id: message.id.toString(), // Garantir que o ID seja string
            sender: sender,
            FROM_Me: true // Sempre true para mensagens enviadas pelo usuário atual
        };

        console.log('📤 Retornando mensagem criada:', response.id, 'Tipo:', typeof response.id);
        return res.status(201).json(response);

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Controller para listar mensagens de um ticket
 * GET /api/messages/list?ticket_id=xxx
 */
async function getMessagesController(req, res) {
    try {
        const { ticket_id, page = 1, limit = 200 } = req.query;

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

        // Buscar mensagens usando Supabase ou Prisma (fallback)
        let messages;
        
        if (supabase) {
            console.log('🔍 Tentando buscar mensagens no Supabase para ticket:', parseInt(ticket_id));
            
            try {
                const { data: supabaseMessages, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('ticket_id', parseInt(ticket_id))
                    .order('created_at', { ascending: true })
                    .range((page - 1) * limit, page * limit - 1);

                if (error) {
                    console.error('❌ Erro ao buscar mensagens no Supabase:', error);
                    console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
                    console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                    messages = null; // Forçar fallback
                } else {
                    messages = supabaseMessages;
                    console.log('✅ Mensagens encontradas no Supabase:', messages?.length || 0);
                }
            } catch (supabaseError) {
                console.error('❌ Erro geral no Supabase:', supabaseError);
                console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                messages = null; // Forçar fallback
            }
        } else {
            console.log('🔍 Supabase não disponível, usando Prisma diretamente');
        }
        
        // Fallback para Prisma se Supabase não estiver disponível ou falhar
        if (!messages) {
            console.log('🔄 Buscando mensagens no Prisma...');
            
            // Buscar mensagens excluídas "só para mim" por este usuário
            const deletedMessageIds = await prisma.deleted_messages.findMany({
                where: {
                    user_id: req.user.id
                },
                select: {
                    message_id: true
                }
            });

            const deletedIds = deletedMessageIds.map(d => d.message_id);
            console.log('🔍 Mensagens excluídas só para mim:', deletedIds);

            messages = await prisma.messages.findMany({
                where: {
                    ticket_id: parseInt(ticket_id),
                    // Excluir mensagens que foram deletadas "só para mim" por este usuário
                    id: {
                        notIn: deletedIds
                    }
                },
                orderBy: {
                    created_at: 'asc'
                },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    ticket_id: true,
                    sender_id: true,
                    content: true,
                    attachment_url: true,
                    created_at: true,
                    edited_at: true,
                    is_deleted: true,
                    deleted_at: true,
                    deleted_by: true,
                    reply_to_id: true
                }
            });
            
            console.log('✅ Mensagens encontradas no Prisma:', messages?.length || 0);
            if (messages.length > 0) {
                console.log('📋 Primeira mensagem:', JSON.stringify(messages[0], null, 2));
            }
        }

        // Buscar dados dos remetentes (otimizado)
        const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
        const senders = senderIds.length > 0 ? await prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            }
        }) : [];

        // Mapear mensagens com dados dos remetentes e campo FROM_Me
        const messagesWithSenders = messages.map(message => {
            const sender = senders.find(sender => sender.id === message.sender_id);
            const isFromCurrentUser = message.sender_id === req.user.id;
            
            return {
                ...message,
                id: message.id.toString(), // Garantir que o ID seja string
                sender: sender,
                FROM_Me: isFromCurrentUser
            };
        });

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
    console.log('🔍 Upload iniciado - Supabase configurado:', !!supabase);
    console.log('🔍 Supabase URL:', supabaseUrl);
    console.log('🔍 Supabase Key configurada:', !!supabaseKey);
    
    try {
        upload.single('file')(req, res, async (err) => {
            console.log('🔍 Multer callback executado');
            
            if (err) {
                console.error('❌ Erro do Multer:', err);
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ message: 'Arquivo muito grande. Máximo 10MB.' });
                    }
                }
                return res.status(400).json({ message: err.message });
            }

            if (!req.file) {
                console.error('❌ Nenhum arquivo enviado');
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            console.log('📎 Arquivo recebido:', {
                originalname: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });

            try {
                // Verificar se Supabase está configurado
                if (!supabase) {
                    console.error('❌ Supabase não configurado - usando fallback local');
                    // Fallback: retornar URL local temporária
                    const localUrl = `http://localhost:3001/uploads/chat/${req.file.filename}`;
                    return res.status(200).json({
                        success: true,
                        data: {
                            filename: req.file.originalname,
                            url: localUrl,
                            size: req.file.size,
                            type: req.file.mimetype
                        }
                    });
                }

                // Upload para Supabase Storage
                console.log('📎 Iniciando upload para Supabase...');
                const fileBuffer = fs.readFileSync(req.file.path);
                const fileName = `chat/${req.file.filename}`;
                const bucketName = 'Anexo-chamado'; // Usar o mesmo bucket do AttachmentController

                // Garantir que o bucket existe
                try {
                    await supabase.storage.createBucket(bucketName, { public: true });
                } catch (e) {
                    // Ignorar erro se bucket já existe
                }

                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, fileBuffer, {
                        contentType: req.file.mimetype,
                        upsert: false
                    });

                if (error) {
                    console.error('❌ Erro no upload para Supabase:', error);
                    console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
                    return res.status(500).json({ message: 'Erro no upload do arquivo' });
                }

                console.log('✅ Upload para Supabase concluído:', data);

                // Obter URL pública
                const { data: publicUrl } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(fileName);

                console.log('🔗 URL pública gerada:', publicUrl.publicUrl);

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
                console.error('❌ Erro no upload:', uploadError);
                console.error('❌ Stack trace:', uploadError.stack);
                // Remover arquivo temporário em caso de erro
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: 'Erro no upload do arquivo' });
            }
        });

    } catch (error) {
        console.error('❌ Erro no upload de anexo:', error);
        console.error('❌ Stack trace:', error.stack);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Controller para editar uma mensagem
 * PUT /api/messages/:id
 */
async function editMessageController(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body;

        console.log('🔍 Editando mensagem - ID recebido:', id, 'Tipo:', typeof id);
        console.log('🔍 Editando mensagem - ID convertido:', parseInt(id));

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Conteúdo da mensagem é obrigatório' });
        }

        // Verificar se a mensagem existe
        const existingMessage = await prisma.messages.findUnique({
            where: { id: parseInt(id) }
        });

        console.log('🔍 Mensagem encontrada:', existingMessage ? 'Sim' : 'Não');

        if (!existingMessage) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }

        // Verificar se a mensagem foi deletada
        if (existingMessage.is_deleted) {
            return res.status(400).json({ message: 'Não é possível editar uma mensagem deletada' });
        }

        // Verificar se o usuário é o remetente da mensagem
        if (existingMessage.sender_id !== req.user.id) {
            return res.status(403).json({ message: 'Você só pode editar suas próprias mensagens' });
        }

        // Verificar se o ticket ainda está aberto
        const ticket = await prisma.ticket.findUnique({
            where: { id: existingMessage.ticket_id }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

        const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticket.status);
        if (isClosed) {
            return res.status(403).json({ message: 'Não é possível editar mensagens em tickets fechados' });
        }

        // Atualizar mensagem usando Supabase ou Prisma
        let updatedMessage;
        
        if (supabase) {
            console.log('🔍 Tentando editar mensagem no Supabase:', id);
            
            try {
                const { data: supabaseMessage, error } = await supabase
                    .from('messages')
                    .update({
                        content: content.trim(),
                        edited_at: new Date().toISOString()
                    })
                    .eq('id', parseInt(id))
                    .eq('sender_id', req.user.id)
                    .eq('is_deleted', false)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Erro ao editar mensagem no Supabase:', error);
                    console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                    updatedMessage = null; // Forçar fallback
                } else {
                    updatedMessage = supabaseMessage;
                    console.log('✅ Mensagem editada no Supabase:', updatedMessage.id);
                }
            } catch (supabaseError) {
                console.error('❌ Erro geral no Supabase:', supabaseError);
                console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                updatedMessage = null; // Forçar fallback
            }
        } else {
            console.log('🔍 Supabase não disponível, usando Prisma diretamente');
        }
        
        // Fallback para Prisma se Supabase não estiver disponível ou falhar
        if (!updatedMessage) {
            console.log('🔄 Editando mensagem no Prisma...');
            updatedMessage = await prisma.messages.update({
                where: { 
                    id: parseInt(id)
                },
                data: {
                    content: content.trim(),
                    edited_at: new Date()
                }
            });
            
            console.log('✅ Mensagem editada no Prisma:', updatedMessage.id);
            console.log('📋 Conteúdo editado:', updatedMessage.content);
            console.log('📋 Data de edição:', updatedMessage.edited_at);
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

        // Retornar mensagem editada com dados do remetente
        const response = {
            ...updatedMessage,
            id: updatedMessage.id.toString(), // Garantir que o ID seja string
            sender: sender,
            FROM_Me: true
        };

        console.log('📤 Retornando mensagem editada:', response.id, 'Tipo:', typeof response.id);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Erro ao editar mensagem:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Controller para excluir uma mensagem
 * DELETE /api/messages/:id
 */
async function deleteMessageController(req, res) {
    try {
        const { id } = req.params;
        const { deleteForAll = false } = req.body;

        // Verificar se a mensagem existe
        const existingMessage = await prisma.messages.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingMessage) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }

        // Verificar se a mensagem já foi deletada
        if (existingMessage.is_deleted) {
            return res.status(400).json({ message: 'Mensagem já foi deletada' });
        }

        // Verificar se o usuário é o remetente da mensagem
        if (existingMessage.sender_id !== req.user.id) {
            return res.status(403).json({ message: 'Você só pode excluir suas próprias mensagens' });
        }

        // Verificar se o ticket ainda está aberto (apenas para exclusão para todos)
        if (deleteForAll) {
            const ticket = await prisma.ticket.findUnique({
                where: { id: existingMessage.ticket_id }
            });

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket não encontrado' });
            }

            const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticket.status);
            if (isClosed) {
                return res.status(403).json({ message: 'Não é possível excluir mensagens em tickets fechados' });
            }
        }

        let updatedMessage;
        
        if (deleteForAll) {
            // Exclusão para todos - marcar como deletada no banco
            if (supabase) {
                console.log('🔍 Tentando excluir mensagem para todos no Supabase:', id);
                
                try {
                    const { data: supabaseMessage, error } = await supabase
                        .from('messages')
                        .update({
                            is_deleted: true,
                            deleted_at: new Date().toISOString(),
                            deleted_by: req.user.id,
                            content: 'Mensagem apagada',
                            attachment_url: null
                        })
                        .eq('id', parseInt(id))
                        .eq('sender_id', req.user.id)
                        .eq('is_deleted', false)
                        .select()
                        .single();

                    if (error) {
                        console.error('❌ Erro ao excluir mensagem no Supabase:', error);
                        console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                        updatedMessage = null; // Forçar fallback
                    } else {
                        updatedMessage = supabaseMessage;
                        console.log('✅ Mensagem excluída para todos no Supabase:', updatedMessage.id);
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro geral no Supabase:', supabaseError);
                    console.log('🔄 Fallback para Prisma devido ao erro do Supabase');
                    updatedMessage = null; // Forçar fallback
                }
            } else {
                console.log('🔍 Supabase não disponível, usando Prisma diretamente');
            }
            
            // Fallback para Prisma se Supabase não estiver disponível ou falhar
            if (!updatedMessage) {
                console.log('🔄 Excluindo mensagem para todos no Prisma...');
                updatedMessage = await prisma.messages.update({
                    where: { 
                        id: parseInt(id)
                    },
                    data: {
                        is_deleted: true,
                        deleted_at: new Date(),
                        deleted_by: req.user.id,
                        content: 'Mensagem apagada',
                        attachment_url: null
                    }
                });
                
                console.log('✅ Mensagem excluída para todos no Prisma:', updatedMessage.id);
            }
        } else {
            // Exclusão só para mim - salvar no banco de dados
            console.log('🔄 Excluindo mensagem só para mim no banco...');
            console.log('🔍 Dados da exclusão:', { messageId: parseInt(id), userId: req.user.id });
            
            try {
                // Verificar se já não foi excluída por este usuário
                const existingDeletion = await prisma.deleted_messages.findFirst({
                    where: {
                        message_id: parseInt(id),
                        user_id: req.user.id
                    }
                });

                console.log('🔍 Exclusão existente encontrada:', existingDeletion ? 'Sim' : 'Não');

                if (!existingDeletion) {
                    // Criar registro de exclusão
                    const deletion = await prisma.deleted_messages.create({
                        data: {
                            message_id: parseInt(id),
                            user_id: req.user.id
                        }
                    });
                    console.log('✅ Mensagem excluída só para mim no banco:', id);
                    console.log('📋 Registro de exclusão criado:', deletion.id);
                } else {
                    console.log('ℹ️ Mensagem já estava excluída só para mim:', id);
                }
                
                updatedMessage = existingMessage;
            } catch (deletionError) {
                console.error('❌ Erro ao excluir mensagem só para mim:', deletionError);
                throw deletionError;
            }
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

        // Retornar resposta
        const response = {
            ...updatedMessage,
            id: updatedMessage.id.toString(), // Garantir que o ID seja string
            sender: sender,
            FROM_Me: true,
            deletedForAll: deleteForAll
        };

        console.log('📤 Retornando mensagem excluída:', response.id, 'Tipo:', typeof response.id);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

/**
 * Controller para obter contagem de mensagens não lidas
 * GET /api/messages/unread-count?ticket_id=xxx
 */
async function getUnreadCountController(req, res) {
    try {
        const { ticket_id, since } = req.query;

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

        // Construir filtros para mensagens não lidas
        const whereClause = {
            ticket_id: parseInt(ticket_id),
            sender_id: {
                not: req.user.id // Não contar mensagens próprias
            },
            is_deleted: false
        };

        // Se foi fornecido um timestamp "since", filtrar mensagens criadas após essa data
        if (since) {
            try {
                const sinceDate = new Date(since);
                if (!isNaN(sinceDate.getTime())) {
                    whereClause.created_at = {
                        gt: sinceDate
                    };
                }
            } catch (error) {
                console.error('Erro ao processar parâmetro since:', error);
                // Continuar sem o filtro de data se houver erro
            }
        }

        const unreadCount = await prisma.messages.count({
            where: whereClause
        });

        return res.status(200).json({
            unread_count: unreadCount,
            ticket_id: parseInt(ticket_id),
            since: since || null
        });

    } catch (error) {
        console.error('Erro ao buscar contagem de mensagens não lidas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

export {
    sendMessageController,
    getMessagesController,
    uploadAttachmentController,
    editMessageController,
    deleteMessageController,
    getUnreadCountController,
    checkChatAccess
};
