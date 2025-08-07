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
		const user = jwt.verify(token, process.env.JWT_SECRET);
		console.log('Token decoded in authenticateToken:', user);
		if (!user.userId) {
			console.error('Token missing userId in authenticateToken:', user);
			return res.status(401).json({ message: 'Invalid token payload - missing userId' });
		}
		req.user = user;
		next();
	} catch (error) {
		console.error('Erro na autenticação:', error);
		return res.status(403).json({ message: 'Token inválido' });
	}
}
