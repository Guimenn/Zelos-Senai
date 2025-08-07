import { PrismaClient } from '../generated/prisma/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Configurar diretório de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

// Criar diretório de uploads se não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload
const storage = multer.diskStorage({
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov|wmv|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Apenas imagens, vídeos, documentos e arquivos compactados são aceitos.'), false);
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // Máximo 5 arquivos por upload
    },
    fileFilter
});

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

        const { ticketId, commentId, isAvatar } = req.body;
        const file = req.file;

        // Se for um upload de avatar, não precisa de ticketId ou commentId
        if (isAvatar === 'true') {
            // Criar registro do anexo no banco sem associação a ticket ou comentário
            const attachment = await prisma.attachment.create({
                data: {
                    filename: file.filename,
                    original_name: file.originalname,
                    file_path: file.path,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    ticket_id: null,
                    comment_id: null
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Avatar enviado com sucesso',
                data: attachment
            });
        }
        
        // Para outros tipos de anexos, validar se pelo menos um ID foi fornecido
        if (!ticketId && !commentId) {
            // Deletar arquivo se não foi associado
            fs.unlinkSync(file.path);
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
        const attachment = await prisma.attachment.create({
            data: {
                filename: file.filename,
                original_name: file.originalname,
                file_path: file.path,
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

        return res.status(201).json({
            success: true,
            message: 'Anexo enviado com sucesso',
            data: attachment
        });

    } catch (error) {
        console.error('Erro ao fazer upload do anexo:', error);
        
        // Deletar arquivo se houve erro
        if (req.file && fs.existsSync(req.file.path)) {
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

        const { ticketId, commentId, isAvatar } = req.body;

        // Se for um upload de avatar, não precisa de ticketId ou commentId
        if (isAvatar === 'true') {
            const attachments = [];
            
            for (const file of req.files) {
                const attachment = await prisma.attachment.create({
                    data: {
                        filename: file.filename,
                        original_name: file.originalname,
                        file_path: file.path,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        ticket_id: null,
                        comment_id: null
                    }
                });
                attachments.push(attachment);
            }
            
            return res.status(201).json({
                success: true,
                message: 'Arquivos enviados com sucesso',
                data: attachments
            });
        }
        
        // Para outros tipos de anexos, validar se pelo menos um ID foi fornecido
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
                const attachment = await prisma.attachment.create({
                    data: {
                        filename: file.filename,
                        original_name: file.originalname,
                        file_path: file.path,
                        file_size: file.size,
                        mime_type: file.mimetype,
                        ticket_id: ticketId && ticketId.trim() !== '' ? parseInt(ticketId) : null,
                        comment_id: commentId && commentId.trim() !== '' ? parseInt(commentId) : null
                    }
                });
                attachments.push(attachment);
            } catch (error) {
                // Deletar arquivo se houve erro
                if (fs.existsSync(file.path)) {
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
                if (fs.existsSync(file.path)) {
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

        // Verificar se o arquivo existe
        if (!fs.existsSync(attachment.file_path)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado no servidor'
            });
        }

        // Verificar se é uma imagem
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
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