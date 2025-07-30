import { z } from 'zod/v4';

/**
 * Schema de validação para usuários do sistema de helpdesk
 * Define a estrutura base para todos os tipos de usuário (Admin, Agent, Client)
 * Inclui validações para email e dados básicos
 */
export const userSchema = z.object({
	name: z.string().min(3, { error: 'Invalid Name' }),
	email: z
		.email({ error: 'Invalid e-mail format' })
		.transform((email) => email.toLocaleLowerCase()),
	password: z.string(),
	phone: z.string().optional(),
	avatar: z.string().optional(),
	role: z.enum(['Admin', 'Agent', 'Client'], { error: 'Invalid role' }),
});

/**
 * Schema para atualização de usuários (senha opcional)
 */
export const userUpdateSchema = userSchema.partial({ password: true }); 