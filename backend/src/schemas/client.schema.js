import { z } from 'zod/v4';

// Schema para dados do usuário
const userDataSchema = z.object({
    name: z.string().min(3, { error: 'Nome deve ter pelo menos 3 caracteres' }),
    email: z.email({ error: 'Formato de email inválido' }).transform((email) => email.toLowerCase()),
    password: z.string().min(6, { error: 'Senha deve ter pelo menos 6 caracteres' }),
    phone: z.string().min(1, { error: 'Telefone é obrigatório' }),
    avatar: z.string().optional(),
});

export const clientCreateSchema = z.object({
    // Dados do usuário (opcional - se não fornecido, usa user_id)
    user: userDataSchema.optional(),
    // ID do usuário existente (opcional - se não fornecido, cria novo usuário)
    user_id: z.number().optional(),
    // Campos obrigatórios
    matricu_id: z.string().min(1, { error: 'Matrícula do funcionário é obrigatória' }),
    cpf: z.string().min(11, { error: 'CPF deve ter pelo menos 11 caracteres' }).optional(),
    // Campos opcionais
    department: z.string().optional(),
    position: z.string().optional(),
    admission_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    birth_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    address: z.string().optional(),
    gender: z.string().optional(),
    education_level: z.string().optional(),
    education_field: z.string().optional(),
    contract_type: z.string().optional(),
    work_schedule: z.string().optional(),
    notes: z.string().optional(),
    // Campos mantidos para compatibilidade
    company: z.string().optional(),
    client_type: z.enum(['Individual', 'Business', 'Enterprise'], { error: 'Tipo de cliente deve ser Individual, Business ou Enterprise' }).optional().default('Individual'),
}).refine((data) => {
    // Deve ter ou user_id OU dados do usuário, mas não ambos
    return (data.user_id && !data.user) || (!data.user_id && data.user);
}, {
    message: 'Deve fornecer user_id OU dados do usuário, mas não ambos',
    path: ['user_id']
});

export const clientUpdateSchema = z.object({
    // Campos atualizáveis
    matricu_id: z.string().min(1, { error: 'Matrícula do funcionário é obrigatória' }).optional(),
    cpf: z.string().min(11, { error: 'CPF deve ter pelo menos 11 caracteres' }).optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    admission_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    birth_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    address: z.string().optional(),
    gender: z.string().optional(),
    education_level: z.string().optional(),
    education_field: z.string().optional(),
    contract_type: z.string().optional(),
    work_schedule: z.string().optional(),
    notes: z.string().optional(),
    // Campos mantidos para compatibilidade
    company: z.string().optional(),
    client_type: z.enum(['Individual', 'Business', 'Enterprise'], { error: 'Tipo de cliente deve ser Individual, Business ou Enterprise' }).optional(),
});