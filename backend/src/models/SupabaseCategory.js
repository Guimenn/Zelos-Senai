import { PrismaClient } from '../generated/prisma/index.js';
import { supabase } from '../config/supabase.js';

const prisma = new PrismaClient();

// Função para criar uma categoria no Supabase e no banco de dados local
async function createSupabaseCategory(categoryData) {
    try {
        // Criar categoria no banco de dados local usando Prisma
        const category = await prisma.category.create({
            data: categoryData,
            include: {
                subcategories: true,
                _count: {
                    select: {
                        tickets: true,
                        subcategories: true,
                    }
                }
            }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'create',
            entity_type: 'category',
            entity_id: category.id.toString(),
            details: JSON.stringify(category),
            created_by: categoryData.created_by || 'system'
        });

        return category;
    } catch (error) {
        console.error('Erro ao criar categoria no Supabase:', error);
        throw error;
    }
}

// Função para obter todas as categorias
async function getAllSupabaseCategories(options = {}) {
    try {
        const { include_inactive = false } = options;

        const where = {};
        
        if (!include_inactive) {
            where.is_active = true;
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                subcategories: {
                    where: include_inactive ? {} : { is_active: true },
                    orderBy: {
                        name: 'asc'
                    }
                },
                _count: {
                    select: {
                        tickets: true,
                        subcategories: true,
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return categories;
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
    }
}

// Função para obter uma categoria específica
async function getSupabaseCategoryById(categoryId) {
    try {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                subcategories: {
                    orderBy: {
                        name: 'asc'
                    }
                },
                tickets: {
                    select: {
                        id: true,
                        ticket_number: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 10
                },
                _count: {
                    select: {
                        tickets: true,
                        subcategories: true,
                    }
                }
            }
        });

        if (!category) {
            throw new Error('Categoria não encontrada');
        }

        // Registrar visualização no Supabase
        await supabase.from('activities').insert({
            action: 'view',
            entity_type: 'category',
            entity_id: category.id.toString(),
            details: JSON.stringify({ viewed_at: new Date().toISOString() }),
            created_by: 'system'
        });

        return category;
    } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        throw error;
    }
}

// Função para atualizar uma categoria
async function updateSupabaseCategory(categoryId, categoryData) {
    try {
        // Atualizar categoria no banco de dados local usando Prisma
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: categoryData,
            include: {
                subcategories: true,
                _count: {
                    select: {
                        tickets: true,
                        subcategories: true,
                    }
                }
            }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'update',
            entity_type: 'category',
            entity_id: category.id.toString(),
            details: JSON.stringify({
                previous: await prisma.category.findUnique({ where: { id: categoryId } }),
                current: category
            }),
            created_by: categoryData.updated_by || 'system'
        });

        return category;
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        throw error;
    }
}

// Função para deletar uma categoria
async function deleteSupabaseCategory(categoryId) {
    try {
        // Verificar se a categoria tem tickets
        const ticketCount = await prisma.ticket.count({
            where: { category_id: categoryId }
        });

        if (ticketCount > 0) {
            throw new Error('Não é possível deletar uma categoria que possui tickets associados');
        }

        // Verificar se a categoria tem subcategorias
        const subcategoryCount = await prisma.subcategory.count({
            where: { category_id: categoryId }
        });

        if (subcategoryCount > 0) {
            throw new Error('Não é possível deletar uma categoria que possui subcategorias');
        }

        // Obter dados da categoria antes de deletar para registro
        const categoryToDelete = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        // Deletar categoria no banco de dados local
        await prisma.category.delete({
            where: { id: categoryId }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'delete',
            entity_type: 'category',
            entity_id: categoryId.toString(),
            details: JSON.stringify(categoryToDelete),
            created_by: 'system'
        });

        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        throw error;
    }
}

// ==================== SUBCATEGORIAS ====================

// Função para criar uma subcategoria
async function createSupabaseSubcategory(subcategoryData) {
    try {
        // Verificar se a categoria existe
        const category = await prisma.category.findUnique({
            where: { id: subcategoryData.category_id }
        });

        if (!category) {
            throw new Error('Categoria não encontrada');
        }

        // Criar subcategoria no banco de dados local
        const subcategory = await prisma.subcategory.create({
            data: subcategoryData,
            include: {
                category: true,
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'create',
            entity_type: 'subcategory',
            entity_id: subcategory.id.toString(),
            details: JSON.stringify(subcategory),
            created_by: subcategoryData.created_by || 'system'
        });

        return subcategory;
    } catch (error) {
        console.error('Erro ao criar subcategoria:', error);
        throw error;
    }
}

// Função para obter subcategorias de uma categoria
async function getSupabaseSubcategoriesByCategory(categoryId, options = {}) {
    try {
        const { include_inactive = false } = options;

        // Verificar se a categoria existe
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            throw new Error('Categoria não encontrada');
        }

        const where = { category_id: categoryId };
        
        if (!include_inactive) {
            where.is_active = true;
        }

        const subcategories = await prisma.subcategory.findMany({
            where,
            include: {
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return subcategories;
    } catch (error) {
        console.error('Erro ao buscar subcategorias:', error);
        throw error;
    }
}

// Função para obter uma subcategoria específica
async function getSupabaseSubcategoryById(subcategoryId) {
    try {
        const subcategory = await prisma.subcategory.findUnique({
            where: { id: subcategoryId },
            include: {
                category: true,
                tickets: {
                    select: {
                        id: true,
                        ticket_number: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 10
                },
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        if (!subcategory) {
            throw new Error('Subcategoria não encontrada');
        }

        // Registrar visualização no Supabase
        await supabase.from('activities').insert({
            action: 'view',
            entity_type: 'subcategory',
            entity_id: subcategory.id.toString(),
            details: JSON.stringify({ viewed_at: new Date().toISOString() }),
            created_by: 'system'
        });

        return subcategory;
    } catch (error) {
        console.error('Erro ao buscar subcategoria:', error);
        throw error;
    }
}

// Função para atualizar uma subcategoria
async function updateSupabaseSubcategory(subcategoryId, subcategoryData) {
    try {
        // Atualizar subcategoria no banco de dados local
        const subcategory = await prisma.subcategory.update({
            where: { id: subcategoryId },
            data: subcategoryData,
            include: {
                category: true,
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'update',
            entity_type: 'subcategory',
            entity_id: subcategory.id.toString(),
            details: JSON.stringify({
                previous: await prisma.subcategory.findUnique({ where: { id: subcategoryId } }),
                current: subcategory
            }),
            created_by: subcategoryData.updated_by || 'system'
        });

        return subcategory;
    } catch (error) {
        console.error('Erro ao atualizar subcategoria:', error);
        throw error;
    }
}

// Função para deletar uma subcategoria
async function deleteSupabaseSubcategory(subcategoryId) {
    try {
        // Verificar se a subcategoria tem tickets
        const ticketCount = await prisma.ticket.count({
            where: { subcategory_id: subcategoryId }
        });

        if (ticketCount > 0) {
            throw new Error('Não é possível deletar uma subcategoria que possui tickets associados');
        }

        // Obter dados da subcategoria antes de deletar para registro
        const subcategoryToDelete = await prisma.subcategory.findUnique({
            where: { id: subcategoryId }
        });

        // Deletar subcategoria no banco de dados local
        await prisma.subcategory.delete({
            where: { id: subcategoryId }
        });

        // Registrar atividade no Supabase
        await supabase.from('activities').insert({
            action: 'delete',
            entity_type: 'subcategory',
            entity_id: subcategoryId.toString(),
            details: JSON.stringify(subcategoryToDelete),
            created_by: 'system'
        });

        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar subcategoria:', error);
        throw error;
    }
}

export {
    // Categorias
    createSupabaseCategory,
    getAllSupabaseCategories,
    getSupabaseCategoryById,
    updateSupabaseCategory,
    deleteSupabaseCategory,
    
    // Subcategorias
    createSupabaseSubcategory,
    getSupabaseSubcategoriesByCategory,
    getSupabaseSubcategoryById,
    updateSupabaseSubcategory,
    deleteSupabaseSubcategory,
};