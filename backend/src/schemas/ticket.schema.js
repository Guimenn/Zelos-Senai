import { z } from 'zod/v4';

export const ticketCreateSchema = z.object({
    title: z.string().min(3, { error: 'Título obrigatório' }),
    description: z.string().min(5, { error: 'Descrição obrigatória' }),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'], { error: 'Prioridade inválida' }),
    category_id: z.number({ required_error: 'Categoria obrigatória' }),
    subcategory_id: z.number().optional(),
    client_id: z.number().optional(),
    attachments: z.array(z.string()).optional(),
});

export const ticketUpdateSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    category_id: z.number().optional(),
    subcategory_id: z.number().optional(),
    status: z.enum(['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty', 'Resolved', 'Closed']).optional(),
    attachments: z.array(z.string()).optional(),
});