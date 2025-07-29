import { PrismaClient } from '../generated/prisma/index.js';
import { categoryCreateSchema, categoryUpdateSchema, subcategoryCreateSchema, subcategoryUpdateSchema } from '../schemas/category.schema.js';
import { ZodError } from 'zod/v4';

const prisma = new PrismaClient();

// ==================== CATEGORIAS ====================

// Controller para criar uma nova categoria
async function createCategoryController(req, res) {
    let categoryData;

    try {
        categoryData = categoryCreateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
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

        return res.status(201).json(category);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        return res.status(500).json({ message: 'Erro ao criar categoria' });
    }
}

// Controller para listar todas as categorias
async function getAllCategoriesController(req, res) {
    try {
        const { include_inactive = false } = req.query;

        const where = {};
        
        if (include_inactive !== 'true') {
            where.is_active = true;
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                subcategories: {
                    where: include_inactive === 'true' ? {} : { is_active: true },
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

        return res.status(200).json(categories);
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        return res.status(500).json({ message: 'Erro ao buscar categorias' });
    }
}

// Controller para obter uma categoria específica
async function getCategoryByIdController(req, res) {
    try {
        const categoryId = parseInt(req.params.categoryId);

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
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

        return res.status(200).json(category);
    } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        return res.status(500).json({ message: 'Erro ao buscar categoria' });
    }
}

// Controller para atualizar uma categoria
async function updateCategoryController(req, res) {
    let categoryData;

    try {
        categoryData = categoryUpdateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        const categoryId = parseInt(req.params.categoryId);

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

        return res.status(200).json(category);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        return res.status(500).json({ message: 'Erro ao atualizar categoria' });
    }
}

// Controller para deletar uma categoria
async function deleteCategoryController(req, res) {
    try {
        const categoryId = parseInt(req.params.categoryId);

        // Verificar se a categoria tem tickets
        const ticketCount = await prisma.ticket.count({
            where: { category_id: categoryId }
        });

        if (ticketCount > 0) {
            return res.status(400).json({ 
                message: 'Não é possível deletar uma categoria que possui tickets associados' 
            });
        }

        // Verificar se a categoria tem subcategorias
        const subcategoryCount = await prisma.subcategory.count({
            where: { category_id: categoryId }
        });

        if (subcategoryCount > 0) {
            return res.status(400).json({ 
                message: 'Não é possível deletar uma categoria que possui subcategorias' 
            });
        }

        await prisma.category.delete({
            where: { id: categoryId }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        return res.status(500).json({ message: 'Erro ao deletar categoria' });
    }
}

// ==================== SUBCATEGORIAS ====================

// Controller para criar uma nova subcategoria
async function createSubcategoryController(req, res) {
    let subcategoryData;

    try {
        subcategoryData = subcategoryCreateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        // Verificar se a categoria existe
        const category = await prisma.category.findUnique({
            where: { id: subcategoryData.category_id }
        });

        if (!category) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

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

        return res.status(201).json(subcategory);
    } catch (error) {
        console.error('Erro ao criar subcategoria:', error);
        return res.status(500).json({ message: 'Erro ao criar subcategoria' });
    }
}

// Controller para listar subcategorias de uma categoria
async function getSubcategoriesByCategoryController(req, res) {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const { include_inactive = false } = req.query;

        // Verificar se a categoria existe
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

        const where = { category_id: categoryId };
        
        if (include_inactive !== 'true') {
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

        return res.status(200).json(subcategories);
    } catch (error) {
        console.error('Erro ao buscar subcategorias:', error);
        return res.status(500).json({ message: 'Erro ao buscar subcategorias' });
    }
}

// Controller para obter uma subcategoria específica
async function getSubcategoryByIdController(req, res) {
    try {
        const subcategoryId = parseInt(req.params.subcategoryId);

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
            return res.status(404).json({ message: 'Subcategoria não encontrada' });
        }

        return res.status(200).json(subcategory);
    } catch (error) {
        console.error('Erro ao buscar subcategoria:', error);
        return res.status(500).json({ message: 'Erro ao buscar subcategoria' });
    }
}

// Controller para atualizar uma subcategoria
async function updateSubcategoryController(req, res) {
    let subcategoryData;

    try {
        subcategoryData = subcategoryUpdateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        const subcategoryId = parseInt(req.params.subcategoryId);

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

        return res.status(200).json(subcategory);
    } catch (error) {
        console.error('Erro ao atualizar subcategoria:', error);
        return res.status(500).json({ message: 'Erro ao atualizar subcategoria' });
    }
}

// Controller para deletar uma subcategoria
async function deleteSubcategoryController(req, res) {
    try {
        const subcategoryId = parseInt(req.params.subcategoryId);

        // Verificar se a subcategoria tem tickets
        const ticketCount = await prisma.ticket.count({
            where: { subcategory_id: subcategoryId }
        });

        if (ticketCount > 0) {
            return res.status(400).json({ 
                message: 'Não é possível deletar uma subcategoria que possui tickets associados' 
            });
        }

        await prisma.subcategory.delete({
            where: { id: subcategoryId }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar subcategoria:', error);
        return res.status(500).json({ message: 'Erro ao deletar subcategoria' });
    }
}

export {
    // Categorias
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController,
    
    // Subcategorias
    createSubcategoryController,
    getSubcategoriesByCategoryController,
    getSubcategoryByIdController,
    updateSubcategoryController,
    deleteSubcategoryController,
}; 