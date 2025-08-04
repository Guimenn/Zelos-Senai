import { getAdminStatistics } from '../models/Admin.js';
import { createSupabaseAdmin, updateSupabaseAdmin, deleteSupabaseAdmin, getAllSupabaseAdmins } from '../models/SupabaseAdmin.js';
import { PrismaClient } from '../generated/prisma/index.js';
import { generateHashPassword } from '../utils/hash.js';

const prisma = new PrismaClient();

// Controller para obter estatísticas administrativas do sistema
async function getAdminStatisticsController(req, res) {
	try {
		const statistics = await getAdminStatistics(req.user.id);
		return res.status(200).json(statistics);
	} catch (error) {
		console.error(error);
		if (error.message.includes('not found')) {
			return res.status(404).json({ message: error.message });
		}

		if (error.message.includes('not admin')) {
			return res.status(403).json({ message: error.message });
		}

		return res
			.status(500)
			.json({ message: 'Error fetching admin statistics' });
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

// Controller para reatribuir um ticket a outro agente
async function reassignTicketController(req, res) {
	try {
		const ticketId = parseInt(req.params.ticketId);
		const { agentId } = req.body;
		
		// Verificar se o ticket existe
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId }
		});
		
		if (!ticket) {
			return res.status(404).json({ message: 'Ticket não encontrado' });
		}
		
		// Verificar se o agente existe
		const agent = await prisma.agent.findUnique({
			where: { user_id: parseInt(agentId) }
		});
		
		if (!agent) {
			return res.status(404).json({ message: 'Agente não encontrado' });
		}
		
		// Atualizar a atribuição do ticket
		const updatedTicket = await prisma.ticket.update({
			where: { id: ticketId },
			data: {
				ticket_assignments: {
					create: {
						agent_id: agent.id,
						assigned_at: new Date(),
						is_active: true
					}
				}
			},
			include: {
				ticket_assignments: {
					include: {
						agent: {
							include: {
								user: true
							}
						}
					},
					where: {
						is_active: true
					}
				}
			}
		});
		
		return res.status(200).json({
			message: 'Ticket reatribuído com sucesso',
			ticket: updatedTicket
		});
	} catch (error) {
		console.error('Erro ao reatribuir ticket:', error);
		return res.status(500).json({ message: 'Erro ao reatribuir ticket' });
	}
}

// Controller para fechar ou cancelar um ticket
async function closeOrCancelTicketController(req, res) {
	try {
		const ticketId = parseInt(req.params.ticketId);
		const { status, resolution_note } = req.body;
		
		// Validar o status fornecido
		const validCloseStatuses = ['Closed', 'Cancelled'];
		if (!validCloseStatuses.includes(status)) {
			return res.status(400).json({ 
				message: 'Status inválido para fechamento', 
				validStatuses: validCloseStatuses 
			});
		}
		
		// Verificar se o ticket existe
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId }
		});
		
		if (!ticket) {
			return res.status(404).json({ message: 'Ticket não encontrado' });
		}
		
		// Atualizar o status do ticket
		const updatedTicket = await prisma.ticket.update({
			where: { id: ticketId },
			data: {
				status,
				resolution_note,
				closed_at: new Date()
			}
		});
		
		return res.status(200).json({
			message: `Ticket ${status === 'Closed' ? 'fechado' : 'cancelado'} com sucesso`,
			ticket: updatedTicket
		});
	} catch (error) {
		console.error('Erro ao fechar/cancelar ticket:', error);
		return res.status(500).json({ message: 'Erro ao fechar/cancelar ticket' });
	}
}

// Controller para criar categoria removido - usando a versão do CategoryController.js

// Controller para criar um template de resposta
async function createResponseTemplateController(req, res) {
	try {
		const { title, content, category_id } = req.body;
		
		// Verificar se a categoria existe
		if (category_id) {
			const category = await prisma.category.findUnique({
				where: { id: parseInt(category_id) }
			});
			
			if (!category) {
				return res.status(404).json({ message: 'Categoria não encontrada' });
			}
		}
		
		// Criar o template
		const template = await prisma.responseTemplate.create({
			data: {
				title,
				content,
				category_id: category_id ? parseInt(category_id) : null
			}
		});
		
		return res.status(201).json({
			message: 'Template criado com sucesso',
			template
		});
	} catch (error) {
		console.error('Erro ao criar template:', error);
		return res.status(500).json({ message: 'Erro ao criar template' });
	}
}

// Controller para criar um SLA (Service Level Agreement)
async function createSLAController(req, res) {
	try {
		const { name, description, response_time, resolution_time, priority } = req.body;
		
		// Validar a prioridade
		const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
		if (!validPriorities.includes(priority)) {
			return res.status(400).json({ 
				message: 'Prioridade inválida', 
				validPriorities 
			});
		}
		
		// Verificar se já existe um SLA para esta prioridade
		const existingSLA = await prisma.sLA.findFirst({
			where: { priority }
		});
		
		if (existingSLA) {
			return res.status(400).json({ message: `Já existe um SLA para a prioridade ${priority}` });
		}
		
		// Criar o SLA
		const sla = await prisma.sLA.create({
			data: {
				name,
				description,
				response_time: parseInt(response_time),
				resolution_time: parseInt(resolution_time),
				priority
			}
		});
		
		return res.status(201).json({
			message: 'SLA criado com sucesso',
			sla
		});
	} catch (error) {
		console.error('Erro ao criar SLA:', error);
		return res.status(500).json({ message: 'Erro ao criar SLA' });
	}
}

// Controller para atualizar configurações do sistema
async function updateSystemSettingsController(req, res) {
	try {
		const { setting_key, setting_value } = req.body;
		
		// Verificar se a configuração existe
		const existingSetting = await prisma.systemSetting.findUnique({
			where: { key: setting_key }
		});
		
		let setting;
		
		if (existingSetting) {
			// Atualizar configuração existente
			setting = await prisma.systemSetting.update({
				where: { key: setting_key },
				data: { value: setting_value }
			});
		} else {
			// Criar nova configuração
			setting = await prisma.systemSetting.create({
				data: {
					key: setting_key,
					value: setting_value
				}
			});
		}
		
		return res.status(200).json({
			message: 'Configuração atualizada com sucesso',
			setting
		});
	} catch (error) {
		console.error('Erro ao atualizar configuração:', error);
		return res.status(500).json({ message: 'Erro ao atualizar configuração' });
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

// Controller para criar um administrador usando Supabase e Prisma
async function createAdminController(req, res) {
	try {
		const { user } = req.body;
		
		if (!user || !user.email || !user.password || !user.name) {
			return res.status(400).json({ message: 'Dados incompletos. Nome, email e senha são obrigatórios' });
		}
		
		// Criar usuário usando o modelo Supabase
		const newUser = await createSupabaseAdmin({
			name: user.name,
			email: user.email,
			password: user.password,
			phone: user.phone || null,
			avatar: user.avatar || null
		});
		
		return res.status(201).json({
			message: 'Administrador criado com sucesso no Supabase e no banco local',
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				role: newUser.role
			}
		});
	} catch (error) {
		console.error('Erro ao criar administrador:', error);
		
		// Retornar mensagem de erro mais específica
		if (error.message.includes('já está em uso')) {
			return res.status(400).json({ message: error.message });
		}
		
		return res.status(500).json({ 
			message: 'Erro ao criar administrador', 
			error: error.message 
		});
	}
}

// Controller para atualizar um administrador usando Supabase
async function updateAdminController(req, res) {
	try {
		const { userId } = req.params;
		const { supabaseId, userData } = req.body;
		
		if (!userId || !supabaseId) {
			return res.status(400).json({ message: 'IDs de usuário são obrigatórios' });
		}
		
		if (!userData || Object.keys(userData).length === 0) {
			return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
		}
		
		// Atualizar usuário usando o modelo Supabase
		const updatedUser = await updateSupabaseAdmin(
			parseInt(userId),
			supabaseId,
			userData
		);
		
		return res.status(200).json({
			message: 'Administrador atualizado com sucesso',
			user: updatedUser
		});
	} catch (error) {
		console.error('Erro ao atualizar administrador:', error);
		return res.status(500).json({ 
			message: 'Erro ao atualizar administrador', 
			error: error.message 
		});
	}
}

// Controller para excluir um administrador usando Supabase
async function deleteAdminController(req, res) {
	try {
		const { userId } = req.params;
		const { supabaseId } = req.body;
		
		if (!userId || !supabaseId) {
			return res.status(400).json({ message: 'IDs de usuário são obrigatórios' });
		}
		
		// Excluir usuário usando o modelo Supabase
		await deleteSupabaseAdmin(parseInt(userId), supabaseId);
		
		return res.status(200).json({
			message: 'Administrador excluído com sucesso'
		});
	} catch (error) {
		console.error('Erro ao excluir administrador:', error);
		return res.status(500).json({ 
			message: 'Erro ao excluir administrador', 
			error: error.message 
		});
	}
}

// Controller para listar todos os administradores
async function getAllAdminsController(req, res) {
	try {
		// Buscar todos os administradores usando o modelo Supabase
		const admins = await getAllSupabaseAdmins();
		
		return res.status(200).json({
			message: 'Administradores encontrados',
			admins
		});
	} catch (error) {
		console.error('Erro ao buscar administradores:', error);
		return res.status(500).json({ 
			message: 'Erro ao buscar administradores', 
			error: error.message 
		});
	}
}

export { 
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	reassignTicketController,
	closeOrCancelTicketController,
	createResponseTemplateController,
	createSLAController,
	updateSystemSettingsController,
	getDetailedReportsController,
	createAdminController,
	updateAdminController,
	deleteAdminController,
	getAllAdminsController
};