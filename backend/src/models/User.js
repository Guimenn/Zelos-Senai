import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import { formatDateBR } from '../utils/parseDate.js';

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
				cpf: true,
				birth_date: true,
				role: true,
				created_at: true,
				teacher: {
					select: {
						id: true,
					},
				},
				student: {
					select: {
						id: true,
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
			cpf: user.cpf,
			birth_date: formatDateBR(user.birth_date),
			role: user.role,
			created_at: formatDateBR(user.created_at),
		};

		// Adiciona apenas o ID relevante baseado no role
		if (user.role === 'Teacher' && user.teacher) {
			result.teacher_id = user.teacher.id;
		} else if (user.role === 'Student' && user.student) {
			result.student_id = user.student.id;
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
		return tx.user.update({ where: { id: userId }, data });
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

export { getAllUsers, getUserById, createUser, updateUser, getUserProfile };
