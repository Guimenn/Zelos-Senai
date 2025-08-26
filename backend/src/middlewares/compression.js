/**
 * Middleware de compressão para otimizar respostas HTTP
 * Reduz o tamanho das respostas usando compressão gzip
 */

import { createGzip, createDeflate } from 'zlib';
import { pipeline } from 'stream/promises';

// Configurações de compressão
const COMPRESSION_CONFIG = {
    gzip: {
        level: 6, // Nível de compressão (1-9, 9 = máxima compressão)
        threshold: 1024, // Tamanho mínimo para comprimir (1KB)
        windowBits: 16 // Gzip com header
    },
    deflate: {
        level: 6,
        threshold: 1024,
        windowBits: 15
    }
};

// Verificar se o cliente aceita compressão
function acceptsCompression(req) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    return {
        gzip: acceptEncoding.includes('gzip'),
        deflate: acceptEncoding.includes('deflate'),
        br: acceptEncoding.includes('br')
    };
}

// Middleware de compressão
export function compressionMiddleware(req, res, next) {
    const acceptEncodings = acceptsCompression(req);
    
    // Se não aceita compressão, continuar sem comprimir
    if (!acceptEncodings.gzip && !acceptEncodings.deflate) {
        return next();
    }

    // Interceptar o método end para comprimir a resposta
    const originalEnd = res.end;
    const originalWrite = res.write;
    const originalSetHeader = res.setHeader;

    let compressionStream = null;
    let useCompression = false;

    // Sobrescrever setHeader para capturar Content-Type
    res.setHeader = function(name, value) {
        if (name.toLowerCase() === 'content-type') {
            // Verificar se o tipo de conteúdo deve ser comprimido
            const contentType = value.toLowerCase();
            const shouldCompress = 
                contentType.includes('application/json') ||
                contentType.includes('text/') ||
                contentType.includes('application/xml') ||
                contentType.includes('application/javascript');

            if (shouldCompress) {
                useCompression = true;
                
                // Escolher o melhor método de compressão
                if (acceptEncodings.gzip) {
                    compressionStream = createGzip(COMPRESSION_CONFIG.gzip);
                    res.setHeader('Content-Encoding', 'gzip');
                } else if (acceptEncodings.deflate) {
                    compressionStream = createDeflate(COMPRESSION_CONFIG.deflate);
                    res.setHeader('Content-Encoding', 'deflate');
                }
            }
        }
        
        return originalSetHeader.call(this, name, value);
    };

    // Sobrescrever write para comprimir dados
    res.write = function(chunk, encoding) {
        if (useCompression && compressionStream) {
            compressionStream.write(chunk, encoding);
        } else {
            return originalWrite.call(this, chunk, encoding);
        }
    };

    // Sobrescrever end para finalizar compressão
    res.end = function(chunk, encoding) {
        if (useCompression && compressionStream) {
            if (chunk) {
                compressionStream.write(chunk, encoding);
            }
            
            compressionStream.end();
            
            // Pipe do stream comprimido para a resposta original
            pipeline(compressionStream, res)
                .catch(err => {
                    console.error('Erro na compressão:', err);
                    // Em caso de erro, enviar sem compressão
                    if (chunk) {
                        originalWrite.call(res, chunk, encoding);
                    }
                    originalEnd.call(res);
                });
        } else {
            return originalEnd.call(this, chunk, encoding);
        }
    };

    next();
}

// Middleware de cache para respostas estáticas
export function cacheMiddleware(req, res, next) {
    // Cache para recursos estáticos por 1 hora
    if (req.path.includes('/uploads/') || req.path.includes('/static/')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    // Cache para dados JSON por 30 segundos
    if (req.path.includes('/api/') && req.method === 'GET') {
        res.setHeader('Cache-Control', 'private, max-age=30');
    }
    
    next();
}

// Middleware para otimizar headers
export function optimizeHeadersMiddleware(req, res, next) {
    // Remover headers desnecessários
    res.removeHeader('X-Powered-By');
    
    // Adicionar headers de segurança e performance
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Headers de performance
    res.setHeader('Connection', 'keep-alive');
    
    next();
}
