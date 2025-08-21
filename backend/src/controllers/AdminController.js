import { getAdminStatistics } from '../models/Admin.js';
import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import notificationService from '../services/NotificationService.js';

// Usa prisma singleton

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
		
		// Enviar notificação sobre reatribuição
		try {
			const ticketWithDetails = await prisma.ticket.findUnique({
				where: { id: ticketId },
				include: {
					client: { include: { user: true } },
					assignee: true
				}
			});
			const agentWithUser = await prisma.agent.findUnique({
				where: { id: agent.id },
				include: { user: true }
			});
			await notificationService.notifyTicketAssigned(ticketWithDetails, agentWithUser);
		} catch (notificationError) {
			console.error('Erro ao enviar notificação de reatribuição:', notificationError);
		}

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
		
		// Enviar notificação sobre fechamento/cancelamento
		try {
			const ticketWithDetails = await prisma.ticket.findUnique({
				where: { id: ticketId },
				include: {
					client: { include: { user: true } }
				}
			});
			if (status === 'Closed') {
				await notificationService.notifyTicketCompleted(ticketWithDetails);
			} else {
				await notificationService.notifyTicketRejected(ticketWithDetails, resolution_note || 'Ticket cancelado pelo administrador');
			}
		} catch (notificationError) {
			console.error('Erro ao enviar notificação de fechamento/cancelamento:', notificationError);
		}

		return res.status(200).json({
			message: `Ticket ${status === 'Closed' ? 'fechado' : 'cancelado'} com sucesso`,
			ticket: updatedTicket
		});
	} catch (error) {
		console.error('Erro ao fechar/cancelar ticket:', error);
		return res.status(500).json({ message: 'Erro ao fechar/cancelar ticket' });
	}
}

// Controller para criar uma nova categoria
async function createCategoryController(req, res) {
	try {
		const { name, description } = req.body;
		
		// Verificar se a categoria já existe
		const existingCategory = await prisma.category.findFirst({
			where: { name }
		});
		
		if (existingCategory) {
			return res.status(400).json({ message: 'Categoria já existe' });
		}
		
		// Criar a categoria
		const category = await prisma.category.create({
			data: {
				name,
				description
			}
		});
		
		return res.status(201).json({
			message: 'Categoria criada com sucesso',
			category
		});
	} catch (error) {
		console.error('Erro ao criar categoria:', error);
		return res.status(500).json({ message: 'Erro ao criar categoria' });
	}
}

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

// Controller para criar um administrador
async function createAdminController(req, res) {
	try {
		const { user } = req.body;
		
		// Verificar se o email já existe
		const existingUser = await prisma.user.findUnique({
			where: { email: user.email }
		});
		
		if (existingUser) {
			return res.status(400).json({ message: 'Email já está em uso' });
		}
		
		// Criar o usuário com papel de Admin
		const hashedPassword = await generateHashPassword(user.password);
		
		const newUser = await prisma.user.create({
			data: {
				name: user.name,
				email: user.email,
				phone: user.phone,
				avatar: user.avatar,
				position: user.position,
				hashed_password: hashedPassword,
				role: 'Admin'
			}
		});
		
		return res.status(201).json({
			message: 'Administrador criado com sucesso',
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				role: newUser.role
			}
		});
	} catch (error) {
		console.error('Erro ao criar administrador:', error);
		return res.status(500).json({ message: 'Erro ao criar administrador' });
	}
}

// Controller para listar todos os administradores
async function getAllAdminsController(req, res) {
    try {
        const { search = '', is_active } = req.query;

        const where = {
            role: 'Admin',
            ...(search
                ? {
                      OR: [
                          { name: { contains: String(search), mode: 'insensitive' } },
                          { email: { contains: String(search), mode: 'insensitive' } },
                          { phone: { contains: String(search), mode: 'insensitive' } },
                          { position: { contains: String(search), mode: 'insensitive' } },
                      ],
                  }
                : {}),
            ...(is_active !== undefined
                ? { is_active: String(is_active) === 'true' }
                : {}),
        };

        const admins = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                position: true,
                avatar: true,
                is_active: true,
                created_at: true,
                modified_at: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return res.status(200).json({ admins });
    } catch (error) {
        console.error('Erro ao listar administradores:', error);
        return res.status(500).json({ message: 'Erro ao listar administradores' });
    }
}

// Controller para admin avaliar tickets
async function rateTicketAsAdminController(req, res) {
    try {
        const { ticketId } = req.params;
        const { satisfaction_rating, feedback } = req.body;

        if (satisfaction_rating < 1 || satisfaction_rating > 5) {
            return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
        }

        // Verificar se o ticket existe e foi criado pelo admin
        const ticket = await prisma.ticket.findFirst({
            where: {
                id: parseInt(ticketId),
                created_by: req.user.id, // Verifica se foi criado pelo admin
                status: {
                    in: ['Resolved', 'Closed']
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado ou não pode ser avaliado' });
        }

        if (ticket.satisfaction_rating) {
            return res.status(400).json({ message: 'Ticket já foi avaliado' });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                satisfaction_rating: parseInt(satisfaction_rating),
            },
            include: {
                category: true,
                assignee: true,
                client: { include: { user: true } },
            }
        });

        // Adicionar comentário com feedback se fornecido
        if (feedback) {
            await prisma.comment.create({
                data: {
                    ticket_id: parseInt(ticketId),
                    user_id: req.user.id,
                    content: `Avaliação do Admin: ${satisfaction_rating}/5\nFeedback: ${feedback}`,
                    is_internal: false,
                }
            });
        }

        // Notificar feedback negativo (<= 2) a outros admins
        try {
            const rating = parseInt(satisfaction_rating);
            if (!isNaN(rating) && rating <= 2) {
                const otherAdmins = await prisma.user.findMany({ 
                    where: { 
                        role: 'Admin', 
                        is_active: true,
                        id: { not: req.user.id } // Excluir o admin que fez a avaliação
                    }, 
                    select: { id: true } 
                });
                const notifyAll = otherAdmins.map(a => notificationService.notifyUser(
                    a.id,
                    'NEGATIVE_FEEDBACK',
                    'Feedback negativo recebido',
                    `Chamado #${updatedTicket.ticket_number} recebeu avaliação ${rating}/5 de um administrador.`,
                    'warning',
                    { ticketId: updatedTicket.id, rating }
                ));
                await Promise.all(notifyAll);
            }
        } catch (e) {
            console.error('Erro ao notificar feedback negativo:', e);
        }

        return res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao avaliar ticket como admin:', error);
        return res.status(500).json({ message: 'Erro ao avaliar ticket' });
    }
}

export { 
	getAdminStatisticsController,
	toggleUserStatusController,
	changeUserRoleController,
	changeUserPasswordController,
	reassignTicketController,
	closeOrCancelTicketController,
	createCategoryController,
	createResponseTemplateController,
	createSLAController,
	updateSystemSettingsController,
	getDetailedReportsController,
	createAdminController,
	getAllAdminsController,
	rateTicketAsAdminController
};