import prisma from '../../prisma/client.js';
import { getSystemStatistics } from './Statistics.js';

/**
 * Model para operações relacionadas a administradores
 * Gerencia funcionalidades específicas do perfil de administrador
 */

/**
 * Obtém estatísticas do sistema para administradores
 * @param {number} userId - ID do usuário administrador
 * @returns {Object} - Estatísticas gerais do sistema
 * @throws {Error} - Se o usuário não for encontrado ou não for admin
 */
async function getAdminStatistics(userId) {
	try {
		const admin = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!admin) {
			throw new Error('Admin not found');
		}

		if (admin.role !== 'Admin') {
			throw new Error('User is not an admin');
		}

		const statistics = await getSystemStatistics();
		return statistics;
	} catch (error) {
		throw error;
	}
}

export { getAdminStatistics };
