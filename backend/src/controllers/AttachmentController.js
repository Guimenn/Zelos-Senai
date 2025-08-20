import prisma from '../../prisma/client.js';
import notificationService from '../services/NotificationService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;
const ATTACHMENTS_BUCKET = 'Anexo-chamado';
const AVATARS_BUCKET = 'avatars';

// Usa prisma singleton

// Configurar diretório de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

// Criar diretório de uploads se não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload (usa memória quando Supabase está configurado)
const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Configurar filtros de arquivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp4|avi|mov|wmv|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Apenas imagens, vídeos, documentos e arquivos compactados são aceitos.'), false);
    }
};

export const upload = multer({
    storage: supabase ? memoryStorage : diskStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // Máximo 5 arquivos por upload
    },
    fileFilter
});

function generateStoredFileName(fieldname, originalName) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(originalName || '') || '';
    return `${fieldname || 'file'}-${uniqueSuffix}${ext}`;
}

async function ensureBucket(bucket) {
    if (!supabase) return;
    try {
        // Cria bucket se não existir; ignora erro de conflito
        await supabase.storage.createBucket(bucket, { public: true });
    } catch (e) {
        // ignore
    }
}

async function uploadBufferToSupabase(params) {
    const { buffer, mimeType, objectPath, bucket = ATTACHMENTS_BUCKET } = params;
    if (!supabase) return { error: new Error('Supabase não configurado') };
    await ensureBucket(bucket);
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(objectPath, buffer, { contentType: mimeType, upsert: true });
    if (error) return { error };
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return { key: data?.path || objectPath, publicUrl: pub?.publicUrl || null };
}

/**
 * Controller para fazer upload de anexo
 */
export const uploadAttachmentController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }

        const { ticketId: bodyTicketId, ticket_id: bodyTicket_Id, commentId: bodyCommentId, comment_id: bodyComment_Id, isAvatar } = req.body;
        const ticketId = (bodyTicketId ?? bodyTicket_Id ?? '').toString();
        const commentId = (bodyCommentId ?? bodyComment_Id ?? '').toString();
        const file = req.file;
        const isAvatarUpload = (isAvatar === true) || (isAvatar === 'true') || (isAvatar === '1');

        // Se for um upload de avatar, não precisa de ticketId ou commentId
        if (isAvatarUpload) {
            // Criar registro do anexo no banco sem associação a ticket ou comentário
            let storedName = file.filename || generateStoredFileName(file.fieldname, file.originalname);
            let filePathToStore = file.path;
            if (supabase && file.buffer) {
                const objectPath = `${storedName}`;
                const up = await uploadBufferToSupabase({ buffer: file.buffer, mimeType: file.mimetype, objectPath, bucket: AVATARS_BUCKET });
                if (up.error) throw up.error;
                filePathToStore = up.publicUrl || objectPath;
            }
            const attachment = await prisma.attachment.create({
                data: {
                    filename: storedName,
                    original_name: file.originalname,
                    file_path: filePathToStore,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    ticket_id: null,
                    comment_id: null
                }
            });

            // Construir URL pública para visualização (absoluta)
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const avatarUrl = `${baseUrl}/api/attachments/view/${attachment.id}`;

            // Atualizar avatar do usuário autenticado, se disponível
            if (req.user && req.user.id) {
                try {
                    await prisma.user.update({
                        where: { id: req.user.id },
                        data: { avatar: avatarUrl }
                    });
                } catch (e) {
                    console.error('Erro ao atualizar avatar do usuário:', e);
                    // Não falhar o upload por causa disso
                }
            }

            return res.status(201).json({
                success: true,
                message: 'Avatar enviado com sucesso',
                attachmentId: attachment.id,
                data: {
                    id: attachment.id,
                    attachment,
                    avatarUrl
                }
            });
        }
        
        // Para outros tipos de anexos, validar se pelo menos um ID foi fornecido
        if (!ticketId && !commentId) {
            // Deletar arquivo se não foi associado
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'É necessário fornecer ticketId ou commentId'
            });
        }

        // Verificar se o ticket existe (se ticketId foi fornecido)
        if (ticketId && ticketId.trim() !== '') {
            const ticketIdInt = parseInt(ticketId);
            if (isNaN(ticketIdInt)) {
                fs.unlinkSync(file.path);
                return res.status(400).json({
                    success: false,
                    message: 'ID do ticket deve ser um número válido'
                });
            }

            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketIdInt }
            });

            if (!ticket) {
                fs.unlinkSync(file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Ticket não encontrado'
                });
            }
        }

        // Verificar se o comentário existe (se commentId foi fornecido)
        if (commentId && commentId.trim() !== '') {
            const commentIdInt = parseInt(commentId);
            if (isNaN(commentIdInt)) {
                fs.unlinkSync(file.path);
                return res.status(400).json({
                    success: false,
                    message: 'ID do comentário deve ser um número válido'
                });
            }

            const comment = await prisma.comment.findUnique({
                where: { id: commentIdInt }
            });

            if (!comment) {
                fs.unlinkSync(file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Comentário não encontrado'
                });
            }
        }

        // Criar registro do anexo no banco
        let storedName = file.filename || generateStoredFileName(file.fieldname, file.originalname);
        let filePathToStore = file.path;
        if (supabase && file.buffer) {
            const prefix = ticketId ? `tickets/${parseInt(ticketId)}` : (commentId ? `comments/${parseInt(commentId)}` : 'misc');
            const objectPath = `${prefix}/${storedName}`;
            const up = await uploadBufferToSupabase({ buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname, objectPath });
            if (up.error) throw up.error;
            filePathToStore = up.publicUrl || objectPath;
        }
        const attachment = await prisma.attachment.create({
            data: {
                filename: storedName,
                original_name: file.originalname,
                file_path: filePathToStore,
                file_size: file.size,
                mime_type: file.mimetype,
                ticket_id: ticketId && ticketId.trim() !== '' ? parseInt(ticketId) : null,
                comment_id: commentId && commentId.trim() !== '' ? parseInt(commentId) : null
            },
            include: {
                ticket: {
                    select: {
                        id: true,
                        ticket_number: true,
                        title: true
                    }
                },
                comment: {
                    select: {
                        id: true,
                        content: true
                    }
                }
            }
        });

        // Notificação: novo anexo para quem tem acesso ao ticket
        try {
            const ticketIdInt = attachment.ticket_id || (attachment.comment_id ? (await prisma.comment.findUnique({ where: { id: attachment.comment_id }, select: { ticket_id: true } })).ticket_id : null);
            if (ticketIdInt) {
                const ticket = await prisma.ticket.findUnique({
                    where: { id: ticketIdInt },
                    include: {
                        client: { include: { user: true } },
                        assignee: true,
                    }
                });
                if (ticket) {
                    const notify = [];
                    // Cliente
                    notify.push(notificationService.notifyUser(
                        ticket.client.user_id,
                        'ATTACHMENT_ADDED',
                        'Novo anexo no chamado',
                        `Um novo anexo foi adicionado ao chamado #${ticket.ticket_number}.`,
                        'info',
                        { ticketId: ticket.id, attachmentId: attachment.id }
                    ));
                    // Técnico
                    if (ticket.assigned_to) {
                        notify.push(notificationService.notifyUser(
                            ticket.assigned_to,
                            'ATTACHMENT_ADDED',
                            'Novo anexo no chamado',
                            `Um novo anexo foi adicionado ao chamado #${ticket.ticket_number}.`,
                            'info',
                            { ticketId: ticket.id, attachmentId: attachment.id }
                        ));
                    }
                    await Promise.all(notify);
                }
            }
        } catch (notificationError) {
            console.error('Erro ao notificar anexo adicionado:', notificationError);
        }

        return res.status(201).json({
            success: true,
            message: 'Anexo enviado com sucesso',
            attachmentId: attachment.id,
            data: attachment
        });

    } catch (error) {
        console.error('Erro ao fazer upload do anexo:', error);
        
        // Deletar arquivo se houve erro
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao fazer upload do anexo'
        });
    }
};

/**
 * Controller para fazer upload de múltiplos anexos
 */
export const uploadMultipleAttachmentsController = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }

        const { ticketId: bodyTicketId, ticket_id: bodyTicket_Id, commentId: bodyCommentId, comment_id: bodyComment_Id } = req.body;
        const ticketId = (bodyTicketId ?? bodyTicket_Id ?? '').toString();
        const commentId = (bodyCommentId ?? bodyComment_Id ?? '').toString();

        // Validar se pelo menos um ID foi fornecido
        if ((!ticketId || ticketId.trim() === '') && (!commentId || commentId.trim() === '')) {
            // Deletar arquivos se não foram associados
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            return res.status(400).json({
                success: false,
                message: 'É necessário fornecer ticketId ou commentId'
            });
        }

        const attachments = [];

        for (const file of req.files) {
            try {
                let storedName = file.filename || generateStoredFileName(file.fieldname, file.originalname);
                let filePathToStore = file.path;
                if (supabase && file.buffer) {
                    const prefix = ticketId ? `tickets/${parseInt(ticketId)}` : (commentId ? `comments/${parseInt(commentId)}` : 'misc');
                    const objectPath = `${prefix}/${storedName}`;
                    const up = await uploadBufferToSupabase({ buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname, objectPath });
                    if (up.error) throw up.error;
                    filePathToStore = up.publicUrl || objectPath;
                }
                const attachment = await prisma.attachment.create({
                    data: {
                        filename: storedName,
                        original_name: file.originalname,
                        file_path: filePathToStore,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        ticket_id: ticketId && ticketId.trim() !== '' ? parseInt(ticketId) : null,
                        comment_id: commentId && commentId.trim() !== '' ? parseInt(commentId) : null
                    }
                });
                attachments.push(attachment);
            } catch (error) {
                // Deletar arquivo se houve erro (somente se existir no disco)
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                console.error('Erro ao salvar anexo:', error);
            }
        }

        return res.status(201).json({
            success: true,
            message: `${attachments.length} anexo(s) enviado(s) com sucesso`,
            data: attachments
        });

    } catch (error) {
        console.error('Erro ao fazer upload dos anexos:', error);
        
        // Deletar arquivos se houve erro
        if (req.files) {
            req.files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao fazer upload dos anexos'
        });
    }
};

/**
 * Controller para baixar anexo
 */
export const downloadAttachmentController = async (req, res) => {
    try {
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Anexo não encontrado'
            });
        }

        // Se for URL (Supabase público), redireciona
        if (/^https?:\/\//i.test(attachment.file_path)) {
            return res.redirect(attachment.file_path);
        }
        // Verificar se o arquivo existe
        if (!fs.existsSync(attachment.file_path)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado no servidor'
            });
        }

        // Configurar headers para download
        res.setHeader('Content-Type', attachment.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
        res.setHeader('Content-Length', attachment.file_size);

        // Enviar arquivo
        const fileStream = fs.createReadStream(attachment.file_path);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Erro ao baixar anexo:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao baixar anexo'
        });
    }
};

/**
 * Controller para visualizar anexo (para imagens)
 */
export const viewAttachmentController = async (req, res) => {
    try {
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Anexo não encontrado'
            });
        }

        // Se for URL (Supabase público), redireciona
        if (/^https?:\/\//i.test(attachment.file_path)) {
            res.setHeader('Content-Type', attachment.mime_type);
            return res.redirect(attachment.file_path);
        }
        // Verificar se o arquivo existe
        if (!fs.existsSync(attachment.file_path)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado no servidor'
            });
        }

        // Verificar se é uma imagem
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!imageTypes.includes(attachment.mime_type)) {
            return res.status(400).json({
                success: false,
                message: 'Este arquivo não pode ser visualizado'
            });
        }

        // Configurar headers para visualização
        res.setHeader('Content-Type', attachment.mime_type);
        res.setHeader('Content-Length', attachment.file_size);

        // Enviar arquivo
        const fileStream = fs.createReadStream(attachment.file_path);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Erro ao visualizar anexo:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao visualizar anexo'
        });
    }
};

/**
 * Controller para deletar anexo
 */
export const deleteAttachmentController = async (req, res) => {
    try {
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Anexo não encontrado'
            });
        }

        // Deletar arquivo do sistema de arquivos
        if (fs.existsSync(attachment.file_path)) {
            fs.unlinkSync(attachment.file_path);
        }

        // Deletar registro do banco
        await prisma.attachment.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({
            success: true,
            message: 'Anexo deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao deletar anexo'
        });
    }
};

/**
 * Controller para listar anexos de um ticket
 */
export const getTicketAttachmentsController = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const attachments = await prisma.attachment.findMany({
            where: {
                ticket_id: parseInt(ticketId)
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: attachments
        });

    } catch (error) {
        console.error('Erro ao listar anexos do ticket:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao listar anexos'
        });
    }
};

/**
 * Controller para listar anexos de um comentário
 */
export const getCommentAttachmentsController = async (req, res) => {
    try {
        const { commentId } = req.params;

        const attachments = await prisma.attachment.findMany({
            where: {
                comment_id: parseInt(commentId)
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: attachments
        });

    } catch (error) {
        console.error('Erro ao listar anexos do comentário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao listar anexos'
        });
    }
};