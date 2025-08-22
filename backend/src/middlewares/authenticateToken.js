import jwt from 'jsonwebtoken';

// Cache simples para tokens já verificados (5 segundos)
const tokenCache = new Map();
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Middleware de autenticação JWT
 * Verifica e valida tokens de acesso nas requisições
 */
export default function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'Token não fornecido' });
	}

	// Verificar cache primeiro
	const now = Date.now();
	const cached = tokenCache.get(token);
	if (cached && (now - cached.timestamp) < CACHE_DURATION) {
		req.user = cached.user;
		return next();
	}

	try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024');
        
        // Log apenas uma vez por token para debug
        if (!cached) {
            console.log('Token decoded in authenticateToken:', {
                userId: decoded.userId,
                name: decoded.name,
                userRole: decoded.userRole || decoded.role,
                iat: decoded.iat,
                exp: decoded.exp
            });
        }

        // Normaliza o payload para garantir compatibilidade entre tokens que usam
        // "role" (novo) e "userRole" (antigo), e entre "id" e "userId".
        const normalizedUser = {
            ...decoded,
            id: decoded.userId ?? decoded.id,
            role: decoded.role ?? decoded.userRole,
        };

        if (!normalizedUser.id && !decoded.userId) {
            console.error('Token missing user id in authenticateToken:', decoded);
            return res.status(401).json({ message: 'Token inválido - ID do usuário ausente' });
        }

        if (!normalizedUser.role) {
            console.error('Token missing role in authenticateToken:', { 
                decoded, 
                normalizedUser, 
                hasRole: !!decoded.role,
                hasUserRole: !!decoded.userRole 
            });
            // Ainda permitimos seguir sem role para não quebrar rotas públicas, mas
            // como este middleware é usado em rotas protegidas, retornamos 403.
            return res.status(403).json({ message: 'Token inválido - função ausente' });
        }

        // Salvar no cache
        tokenCache.set(token, {
            user: normalizedUser,
            timestamp: now
        });

        // Limpar cache antigo (manter apenas últimos 100 tokens)
        if (tokenCache.size > 100) {
            const oldestKey = tokenCache.keys().next().value;
            tokenCache.delete(oldestKey);
        }

        req.user = normalizedUser;
		next();
	} catch (error) {
		console.error('Erro na autenticação:', error);
		return res.status(403).json({ message: 'Token inválido' });
	}
}
