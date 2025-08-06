import multer from 'multer';

/**
 * Middleware para tratar erros de upload do multer
 */
export const uploadErrorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo permitido: 10MB'
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Muitos arquivos. Máximo permitido: 5 arquivos'
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de arquivo inesperado'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'Erro no upload do arquivo'
        });
    }
    
    if (error.message.includes('Tipo de arquivo não permitido')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    // Outros erros
    console.error('Erro de upload:', error);
    return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor no upload'
    });
}; 