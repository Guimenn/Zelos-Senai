import jwt from 'jsonwebtoken';

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

	try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded in authenticateToken:', decoded);

        // Normaliza o payload para garantir compatibilidade entre tokens que usam
        // "role" (novo) e "userRole" (antigo), e entre "id" e "userId".
        const normalizedUser = {
            ...decoded,
            id: decoded.userId ?? decoded.id,
            role: decoded.role ?? decoded.userRole,
        };

        if (!normalizedUser.id && !decoded.userId) {
            console.error('Token missing user id in authenticateToken:', decoded);
            return res.status(401).json({ message: 'Invalid token payload - missing user id' });
        }

        if (!normalizedUser.role) {
            console.error('Token missing role in authenticateToken:', decoded);
            // Ainda permitimos seguir sem role para não quebrar rotas públicas, mas
            // como este middleware é usado em rotas protegidas, retornamos 403.
            return res.status(403).json({ message: 'Token inválido - missing role' });
        }

        req.user = normalizedUser;
		next();
	} catch (error) {
		console.error('Erro na autenticação:', error);
		return res.status(403).json({ message: 'Token inválido' });
	}
}
