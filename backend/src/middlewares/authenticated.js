import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/index.js';

const secret = process.env.JWT_SECRET;
const prisma = new PrismaClient();

/**
 * Middleware de autenticação JWT
 * Verifica tokens Bearer e extrai informações do usuário para requisições autenticadas
 */
async function authenticated(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res
			.status(401)
			.json({ message: 'Unauthorized, no token provided' });
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, secret);
		console.log('Decoded token:', decoded);
		if (!decoded.userId) {
			console.error('Token missing userId:', decoded);
			return res.status(401).json({ message: 'Invalid token payload - missing userId' });
		}

		// Buscar informações completas do usuário incluindo client e agent
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			include: {
				client: true,
				agent: true,
			}
		});

		if (!user) {
			return res.status(401).json({ message: 'User not found' });
		}

		if (!user.is_active) {
			return res.status(401).json({ message: 'User account is deactivated' });
		}

		req.user = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			client: user.client,
			agent: user.agent,
		};

		next();
	} catch (error) {
		console.error('Authentication error:', error);
		return res
			.status(401)
			.json({ message: 'Unauthorized, invalid token or expired' });
	}
}

export default authenticated;
