import { z } from 'zod/v4';

// Schema para dados do usuário
const userDataSchema = z.object({
    name: z.string().min(3, { error: 'Nome deve ter pelo menos 3 caracteres' }),
    email: z.string().email({ error: 'Formato de email inválido' }).transform((email) => email.toLowerCase()),
    password: z.string().min(6, { error: 'Senha deve ter pelo menos 6 caracteres' }),
    phone: z.string().min(1, { error: 'Telefone é obrigatório' }),
    avatar: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
});

export const agentCreateSchema = z.object({
    // Dados do usuário (opcional - se não fornecido, usa user_id)
    user: userDataSchema.optional(),
    // ID do usuário existente (opcional - se não fornecido, cria novo usuário)
    user_id: z.number().optional(),
    employee_id: z.string().min(1, { error: 'Matrícula obrigatória' }),
    department: z.string().min(1, { error: 'Departamento obrigatório' }),
    skills: z.array(z.string()).optional(),
    max_tickets: z.number().min(1).optional(),
    categories: z.array(z.number()).optional(), // Array de IDs de categorias
}).refine((data) => {
    // Deve ter ou user_id OU dados do usuário, mas não ambos
    return (data.user_id && !data.user) || (!data.user_id && data.user);
}, {
    message: 'Deve fornecer user_id OU dados do usuário, mas não ambos',
    path: ['user_id']
});

export const agentUpdateSchema = z.object({
    employee_id: z.string().min(1, { error: 'Matrícula obrigatória' }).optional(),
    department: z.string().min(1, { error: 'Departamento obrigatório' }).optional(),
    skills: z.array(z.string()).optional(),
    max_tickets: z.number().min(1).optional(),
    is_active: z.boolean().optional(),
    categories: z.array(z.number()).optional(), // Array de IDs de categorias
});