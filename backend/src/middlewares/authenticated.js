import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

/**
 * Middleware de autenticação JWT
 * Verifica tokens Bearer e extrai informações do usuário para requisições autenticadas
 */
function authenticated(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res
			.status(401)
			.json({ message: 'Unauthorized, no token provided' });
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, secret);

		req.user = {
			id: decoded.user_id,
			role: decoded.role,
		};

		next();
	} catch (error) {
		return res
			.status(401)
			.json({ message: 'Unauthorized, invalid token or expired' });
	}
}

export default authenticated;
