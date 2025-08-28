import { getAdminStatistics } from '../models/Admin.js';
import { getAllAdmins } from '../models/User.js';
import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import notificationService from '../services/NotificationService.js';
import { NOTIFICATION_TYPES } from '../models/Notification.js';

// Controller para obter estatísticas administrativas do sistema
async function getAdminStatisticsController(req, res) {
	try {
		const statistics = await getAdminStatistics(req.user.id);
		return res.status(200).json(statistics);
	} catch (error) {
		console.error('Erro ao buscar estatísticas:', error);
		
		// Se for erro de conexão com banco, retornar dados mock
		if (error.code === 'P1001' || error.message.includes('database server')) {
			console.log('⚠️ Banco de dados indisponível, retornando dados mock...');
			return res.status(200).json({
				users: {
					total: 0,
					admins: 0,
					agents: 0,
					clients: 0
				},
				tickets: {
					total: 0,
					open: 0,
					inProgress: 0,
					waitingForClient: 0,
					resolved: 0,
					closed: 0,
					recent: 0,
					monthly: 0
				},
				categories: {
					total: 0,
					subcategories: 0
				},
				agents: {
					active: 0
				},
				clients: {
					active: 0
				},
				performance: {
					avgResolutionTime: 0,
					avgSatisfaction: 0
				},
				status: 'offline'
			});
		}
		
		if (error.message.includes('not found')) {
			return res.status(404).json({ message: error.message });
		}

		if (error.message.includes('not admin')) {
			return res.status(403).json({ message: error.message });
		}

		return res
			.status(500)
			.json({ message: 'Erro ao buscar estatísticas do administrador' });
	}
}

// Controller para alternar o status de um usuário (ativar/desativar)
async function toggleUserStatusController(req, res) {
	try {
		const userId = parseInt(req.params.userId);
		
		// Verificar se o usuário existe
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		
		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}
		
		// Alternar o status do usuário
        const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { is_active: !user.is_active }
		});
		
        // Notificar o próprio usuário
        try {
            await notificationService.notifyUser(
                updatedUser.id,
                'USER_STATUS_CHANGED',
                updatedUser.is_active ? 'Conta ativada' : 'Conta desativada',
                updatedUser.is_active ? 'Sua conta foi reativada pelo administrador.' : 'Sua conta foi desativada pelo administrador.',
                'info'
            );
        } catch (e) {
            console.error('Erro ao notificar status do usuário:', e);
        }

        return res.status(200).json({
			message: `Usuário ${updatedUser.is_active ? 'ativado' : 'desativado'} com sucesso`,
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				is_active: updatedUser.is_active
			}
		});
	} catch (error) {
		console.error('Erro ao alternar status do usuário:', error);
		return res.status(500).json({ message: 'Erro ao alternar status do usuário' });
	}
}

// Controller para alterar o papel (role) de um usuário
async function changeUserRoleController(req, res) {
	try {
		const userId = parseInt(req.params.userId);
		const { role } = req.body;
		
		// Validar o papel fornecido
		const validRoles = ['Admin', 'Agent', 'Client'];
		if (!validRoles.includes(role)) {
			return res.status(400).json({ 
				message: 'Papel inválido', 
				validRoles 
			});
		}
		
		// Verificar se o usuário existe
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		
		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}
		
		// Atualizar o papel do usuário
        const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { role }
		});
		
        // Notificar o usuário sobre mudança de papel
        try {
            await notificationService.notifyUser(
                updatedUser.id,
                'USER_ROLE_CHANGED',
                'Seu papel foi alterado',
                `Seu papel de acesso foi alterado para ${role}.`,
                'info',
                { role }
            );
        } catch (e) {
            console.error('Erro ao notificar mudança de papel:', e);
        }

        return res.status(200).json({
			message: `Papel do usuário alterado para ${role} com sucesso`,
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				role: updatedUser.role
			}
		});
	} catch (error) {
		console.error('Erro ao alterar papel do usuário:', error);
		return res.status(500).json({ message: 'Erro ao alterar papel do usuário' });
	}
}

// Controller para alterar senha de um usuário (apenas Admin)
async function changeUserPasswordController(req, res) {
	try {
		const userId = parseInt(req.params.userId);
		const { password } = req.body;
		
		// Validar se o ID do usuário é válido
		if (!userId || isNaN(userId)) {
			return res.status(400).json({ message: 'ID do usuário inválido' });
		}
		
		// Validar se a senha foi fornecida
		if (!password || password.trim().length === 0) {
			return res.status(400).json({ message: 'Senha é obrigatória' });
		}
		
		// Verificar se o usuário existe
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		
		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}
		
		// Gerar hash da nova senha
		const hashedPassword = await generateHashPassword(password);
		
		// Atualizar a senha do usuário
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { hashed_password: hashedPassword }
		});
		
		// Notificar o usuário sobre a mudança de senha
		try {
			await notificationService.notifyPasswordChanged(userId, 'Administrador');
		} catch (e) {
			console.error('Erro ao notificar mudança de senha:', e);
		}
		
		return res.status(200).json({
			message: 'Senha alterada com sucesso',
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email
			}
		});
	} catch (error) {
		console.error('Erro ao alterar senha:', error);
		return res.status(500).json({ message: 'Erro ao alterar senha' });
	}
}

// Controller para obter relatórios detalhados
async function getDetailedReportsController(req, res) {
	try {
		const { start_date, end_date, report_type } = req.query;
		
		// Implementar lógica de relatórios baseada no tipo
		let reportData = {};
		
		switch (report_type) {
			case 'tickets':
				// Relatório de tickets
				reportData = await prisma.ticket.findMany({
					where: {
						created_at: {
							gte: new Date(start_date),
							lte: new Date(end_date)
						}
					},
					include: {
						client: {
							include: {
								user: true
							}
						},
						category: true,
						ticket_assignments: {
							include: {
								agent: {
									include: {
										user: true
									}
								}
							}
						}
					}
				});
				break;
			case 'agents':
				// Relatório de desempenho de agentes
				reportData = await prisma.agent.findMany({
					include: {
						user: true,
						ticket_assignments: {
							include: {
								ticket: true
							},
							where: {
								assigned_at: {
									gte: new Date(start_date),
									lte: new Date(end_date)
								}
							}
						}
					}
				});
				break;
			case 'categories':
				// Relatório por categorias
				reportData = await prisma.category.findMany({
					include: {
						tickets: {
							where: {
								created_at: {
									gte: new Date(start_date),
									lte: new Date(end_date)
								}
							}
						}
					}
				});
				break;
			default:
				return res.status(400).json({ message: 'Tipo de relatório inválido' });
		}
		
		return res.status(200).json({
			report_type,
			start_date,
			end_date,
			data: reportData
		});
	} catch (error) {
		console.error('Erro ao gerar relatório:', error);
		return res.status(500).json({ message: 'Erro ao gerar relatório' });
	}
}

// Controller para listar todos os administradores
async function getAllAdminsController(req, res) {
	try {
		const admins = await getAllAdmins();
		return res.status(200).json(admins);
	} catch (error) {
		console.error('Erro ao buscar administradores:', error);
		return res.status(500).json({ message: 'Erro ao buscar administradores' });
	}
}

// Controller para criar um novo administrador (apenas admin master)
async function createAdminController(req, res) {
	try {
		const { user } = req.body;
		
		if (!user) {
			return res.status(400).json({ message: 'Dados do usuário são obrigatórios' });
		}
		
		const { name, email, phone, password, avatar, position } = user;
		
		// Validações básicas
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
		}
		
		// Verificar se o email já existe
		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() }
		});
		
		if (existingUser) {
			return res.status(400).json({ message: 'Email já está em uso' });
		}
		
		// Criar hash da senha
		const hashedPassword = await generateHashPassword(password);
		
		// Criar o usuário administrador
		const newAdmin = await prisma.user.create({
			data: {
				name: name.trim(),
				email: email.toLowerCase().trim(),
				phone: phone || null,
				hashed_password: hashedPassword,
				avatar: avatar || null,
				role: 'Admin',
				is_active: true,
				position: position || 'Administrador'
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				avatar: true,
				role: true,
				is_active: true,
				position: true,
				created_at: true
			}
		});
		
		// Notificar o novo administrador (se possível)
		try {
			await notificationService.notifyUser(
				newAdmin.id,
				'ACCOUNT_CREATED',
				'Conta de administrador criada',
				'Sua conta de administrador foi criada com sucesso.',
				'success'
			);
		} catch (e) {
			console.error('Erro ao notificar novo administrador:', e);
		}
		
		return res.status(201).json({
			message: 'Administrador criado com sucesso',
			admin: newAdmin
		});
		
	} catch (error) {
		console.error('Erro ao criar administrador:', error);
		return res.status(500).json({ message: 'Erro ao criar administrador' });
	}
}

// Controller para excluir um administrador (apenas admin master)
async function deleteAdminController(req, res) {
	try {
		const adminId = parseInt(req.params.adminId);
		
		// Verificar se o administrador existe
		const admin = await prisma.user.findUnique({
			where: { id: adminId, role: 'Admin' }
		});
		
		if (!admin) {
			return res.status(404).json({ message: 'Administrador não encontrado' });
		}
		
		// Verificar se não está tentando excluir a si mesmo
		if (adminId === req.user.id) {
			return res.status(400).json({ message: 'Não é possível excluir sua própria conta' });
		}
		
		// Verificar se não está tentando excluir o admin master
		if (admin.email === 'admin@helpdesk.com') {
			return res.status(403).json({ message: 'Não é possível excluir o administrador master' });
		}
		
		// Excluir o administrador
		await prisma.user.delete({
			where: { id: adminId }
		});
		
		// Notificar o administrador excluído (se possível)
		try {
			await notificationService.notifyUser(
				adminId,
				'ACCOUNT_DELETED',
				'Conta excluída',
				'Sua conta de administrador foi excluída pelo administrador master.',
				'warning'
			);
		} catch (e) {
			console.error('Erro ao notificar exclusão:', e);
		}
		
		return res.status(200).json({ 
			message: 'Administrador excluído com sucesso',
			deletedAdmin: {
				id: admin.id,
				name: admin.name,
				email: admin.email
			}
		});
		
	} catch (error) {
		console.error('Erro ao excluir administrador:', error);
		return res.status(500).json({ message: 'Erro ao excluir administrador' });
	}
}

export { 
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	changeUserPasswordController,
	getDetailedReportsController,
	getAllAdminsController,
	createAdminController,
	deleteAdminController
};