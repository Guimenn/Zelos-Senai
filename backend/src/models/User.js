import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import { formatDateBR } from '../utils/parseDate.js';
import { syncUserAsync } from '../services/SupabaseSyncService.js';

/**
 * Model para operações relacionadas a usuários do sistema
 * Gerencia CRUD de usuários base (Admin, Professor, Estudante)
 * Contém validações de autenticação e dados pessoais
 */

/**
 * Obtém todos os usuários do sistema
 * @returns {Array} - Lista completa de usuários
 * @throws {Error} - Erro ao buscar usuários
 */
async function getAllUsers() {
	try {
		return await prisma.user.findMany();
	} catch (error) {
		throw error;
	}
}

async function getUserById(userId) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				two_factor_enabled: true,
				avatar: true,
				role: true,
				created_at: true,
				address: true,
				agent: {
					select: {
						id: true,
						employee_id: true,
						department: true,
						skills: true,
						agent_categories: {
							include: {
								category: {
									select: { id: true, name: true, color: true, icon: true }
								}
							}
						},
						primary_subcategory: {
							select: { id: true, name: true }
						}
					},
				},
				client: {
					select: {
						id: true,
						client_type: true,
						company: true,
						address: true,
						department: true,
						position: true,
					},
				},
			},
		});

		if (!user) {
			return null;
		}

		const result = {
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			two_factor_enabled: user.two_factor_enabled,
			avatar: user.avatar,
			created_at: formatDateBR(user.created_at),
			role: user.role,
		};

		// Adiciona dados específicos baseado no role
		if (user.role === 'Agent' && user.agent) {
			result.agent = {
				id: user.agent.id,
				employee_id: user.agent.employee_id,
				department: user.agent.department,
				categories: (user.agent.agent_categories || []).map((ac) => ac.category).filter(Boolean),
			};
			// address para agent vem do próprio user
			result.address = user.address || null;
			// Se houver subcategoria principal no relacionamento (caso implementado), expor como specialty
			if (user.agent && user.agent.primary_subcategory) {
				result.specialty = user.agent.primary_subcategory.name || null;
			} else if (Array.isArray(user.agent.skills)) {
				// skills salva a subcategoria como primeira posição no cadastro
				const firstSkill = user.agent.skills.find((s) => typeof s === 'string' && s && !s.startsWith('EXP:') && !s.startsWith('AVAIL:') && !s.startsWith('URGENCY:') && !s.startsWith('CERT:'));
				result.specialty = firstSkill || user.agent.department || null;
			} else {
				result.specialty = user.agent.department || null;
			}
		} else if (user.role === 'Client' && user.client) {
			result.client = {
				id: user.client.id,
				company: user.client.company,
				client_type: user.client.client_type,
			};
			// Expor endereço (e outros dados úteis) no nível superior para facilitar consumo no front
			result.address = user.client.address || user.address || null;
			result.department = user.client.department || null;
			result.position = user.client.position || null;
		} else {
			// Admin (ou outros): expõe address do próprio usuário
			result.address = user.address || null;
		}

		return result;
	} catch (error) {
		throw error;
	}
}

async function createUser(userData, tx = prisma) {
	try {
		// 1. Faz o hash da senha
		const hashed_password = await generateHashPassword(userData.password);
		userData.password = hashed_password;
		// 2. Substitui o password pelo hashed_password
		const { password, ...rest } = userData;
		const user = { ...rest, hashed_password: password };
		// 3. Cria o usuário no banco de dados
		const createdUser = await tx.user.create({
			data: user,
		});
		
		// 4. Sincronizar automaticamente com Supabase (apenas se não for transação)
		if (tx === prisma) {
			console.log('🔄 [AUTO-SYNC] Usuário criado no modelo, iniciando sincronização com Supabase...');
			syncUserAsync(createdUser, 'create');
		}
		
		return createdUser;
	} catch (error) {
		throw error;
	}
}

async function updateUser(userId, userData, tx = prisma) {
	try {
		const { password, ...rest } = userData;
		const data = { ...rest };
		if (password) {
			data.hashed_password = await generateHashPassword(password);
		}
		const updatedUser = await tx.user.update({ where: { id: userId }, data });
		
		// Sincronizar automaticamente com Supabase (apenas se não for transação)
		if (tx === prisma) {
			console.log('🔄 [AUTO-SYNC] Usuário atualizado no modelo, iniciando sincronização com Supabase...');
			syncUserAsync(updatedUser, 'update');
		}
		
		return updatedUser;
	} catch (error) {
		throw error;
	}
}

async function getUserProfile(user_id, role) {
	try {
		const baseUser = await prisma.user.findUnique({
			where: { id: user_id },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				created_at: true,
			},
		});
		if (!baseUser) return null;

		let roleData = {};

		// Student
		if (role === 'Student') {
			const student = await prisma.student.findUnique({
				where: { user_id },
				select: {
					id: true,
					enrollment: true,
					class: {
						select: { id: true, name: true },
					},
				},
			});

			if (student) {
				roleData = {
					id: student.id,
					enrollment: student.enrollment,
					classes: [student.class], // única turma
				};
			}
		}

		// Teacher
		if (role === 'Teacher') {
			const teacher = await prisma.teacher.findUnique({
				where: { user_id },
				select: {
					id: true,
					teacher_subjects: {
						select: {
							subject: { select: { id: true, name: true } },
							teacher_subject_classes: {
								select: {
									class: { select: { id: true, name: true } },
								},
							},
						},
					},
				},
			});

			if (teacher) {
				// Mapa temporário para agrupar por turma
				const classMap = new Map();

				teacher.teacher_subjects.forEach(
					({ subject, teacher_subject_classes }) => {
						teacher_subject_classes.forEach(({ class: cls }) => {
							if (!cls) return; // pula nulos

							// Se ainda não existe essa turma no mapa, cria com lista vazia
							if (!classMap.has(cls.id)) {
								classMap.set(cls.id, {
									class: cls,
									subjects: [],
								});
							}

							// Adiciona a matéria à lista daquela turma
							classMap.get(cls.id).subjects.push(subject);
						});
					},
				);

				// Converte o Map em array
				roleData = {
					id: teacher.id,
					classes: Array.from(classMap.values()),
				};
			}
		}

		return { user: baseUser, role_data: roleData };
	} catch (error) {
		console.error('Error fetching user profile:', error);
		throw error;
	}
}

/**
 * Obtém todos os usuários com role Admin
 * @returns {Array} - Lista de usuários administradores
 * @throws {Error} - Erro ao buscar administradores
 */
async function getAllAdmins() {
	try {
		const admins = await prisma.user.findMany({
			where: { role: 'Admin' },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				avatar: true,
				role: true,
				is_active: true,
				created_at: true,
				address: true,
			},
			orderBy: { name: 'asc' }
		});

		return admins.map(admin => ({
			...admin,
			created_at: formatDateBR(admin.created_at)
		}));
	} catch (error) {
		throw error;
	}
}

export { getAllUsers, getUserById, createUser, updateUser, getUserProfile, getAllAdmins };
