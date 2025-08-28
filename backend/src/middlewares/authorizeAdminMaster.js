/**
 * Middleware para autorizar apenas o administrador master
 * Apenas o usuário com email admin@helpdesk.com pode executar ações de admin master
 */
import prisma from '../../prisma/client.js';

export default async function authorizeAdminMaster(req, res, next) {
	try {
		// Verificar se o usuário está autenticado
		if (!req.user) {
			return res.status(401).json({ message: 'Usuário não autenticado' });
		}

		// Verificar se o usuário é admin
		if (req.user.role !== 'Admin') {
			return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
		}

		// Verificar se é o admin master (admin@helpdesk.com)
		if (req.user.email !== 'admin@helpdesk.com') {
			return res.status(403).json({ 
				message: 'Acesso negado. Apenas o administrador master pode executar esta ação.',
				code: 'ADMIN_MASTER_REQUIRED'
			});
		}

		// Verificar se o usuário está ativo
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: { is_active: true }
		});

		if (!user || !user.is_active) {
			return res.status(403).json({ message: 'Usuário inativo' });
		}

		next();
	} catch (error) {
		console.error('Erro no middleware authorizeAdminMaster:', error);
		return res.status(500).json({ message: 'Erro interno do servidor' });
	}
}
