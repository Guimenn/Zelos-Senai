// Schemas de subcategoria
export const subcategoryCreateSchema = z.object({
    name: z.string().min(2, { error: 'Nome obrigatório' }),
    category_id: z.number({ required_error: 'ID da categoria é obrigatório' }),
    description: z.string().optional(),
});

export const subcategoryUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
});
import { z } from 'zod/v4';

export const categoryCreateSchema = z.object({
    name: z.string().min(2, { error: 'Nome obrigatório' }),
    description: z.string().optional(),
});

export const categoryUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
});