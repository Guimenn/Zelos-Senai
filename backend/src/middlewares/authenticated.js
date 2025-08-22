import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';

const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

/**
 * Middleware de autenticação JWT
 * Verifica tokens Bearer e extrai informações do usuário para requisições autenticadas
 */
async function authenticated(req, res, next) {
	console.log('🔍 DEBUG - authenticated middleware:', {
		url: req.url,
		method: req.method,
		hasAuthHeader: !!req.headers.authorization,
		authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'null'
	});

	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.log('❌ Token não fornecido ou formato inválido');
		return res
			.status(401)
			.json({ message: 'Não autorizado, token não fornecido' });
	}

	const token = authHeader.split(' ')[1];
	console.log('🔐 Token extraído:', token ? `${token.substring(0, 20)}...` : 'null');

	try {
		const decoded = jwt.verify(token, secret);
		console.log('Decoded token:', decoded);
		if (!decoded.userId) {
			console.error('Token missing userId:', decoded);
			return res.status(401).json({ message: 'Token inválido - ID do usuário ausente' });
		}

		// Buscar informações completas do usuário incluindo client e agent
		console.log('🔍 Buscando usuário no banco:', decoded.userId);
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			include: {
				client: true,
				agent: true,
			}
		});

		if (!user) {
			console.log('❌ Usuário não encontrado no banco:', decoded.userId);
			return res.status(401).json({ message: 'Usuário não encontrado' });
		}

		console.log('✅ Usuário encontrado:', {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			is_active: user.is_active
		});

		if (!user.is_active) {
			console.log('❌ Usuário desativado:', user.id);
			return res.status(401).json({ message: 'Conta de usuário desativada' });
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
			.json({ message: 'Não autorizado, token inválido ou expirado' });
	}
}

export default authenticated;
