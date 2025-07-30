import { z } from 'zod/v4';

export const commentCreateSchema = z.object({
    content: z.string().min(1, { error: 'Conteúdo obrigatório' }),
    is_internal: z.boolean().default(false),
    attachments: z.array(z.string()).optional(),
});

export const commentUpdateSchema = z.object({
    content: z.string().min(1, { error: 'Conteúdo obrigatório' }).optional(),
    is_internal: z.boolean().optional(),
    attachments: z.array(z.string()).optional(),
});