import { categoryCreateSchema, categoryUpdateSchema, subcategoryCreateSchema, subcategoryUpdateSchema } from '../schemas/category.schema.js';
import { ZodError } from 'zod/v4';
import {
    createSupabaseCategory,
    getAllSupabaseCategories,
    getSupabaseCategoryById,
    updateSupabaseCategory,
    deleteSupabaseCategory,
    createSupabaseSubcategory,
    getSupabaseSubcategoriesByCategory,
    getSupabaseSubcategoryById,
    updateSupabaseSubcategory,
    deleteSupabaseSubcategory
} from '../models/SupabaseCategory.js';

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
        // Adicionar informações do usuário que criou a categoria
        if (req.user && req.user.id) {
            categoryData.created_by = req.user.id.toString();
        }
        
        const category = await createSupabaseCategory(categoryData);

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
        const isActive = include_inactive === 'true' ? undefined : true;

        const categories = await getAllSupabaseCategories(isActive);

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
        
        // Adicionar informações do usuário que está visualizando a categoria
        const userId = req.user && req.user.id ? req.user.id.toString() : null;

        const category = await getSupabaseCategoryById(categoryId, userId);

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
        
        // Adicionar informações do usuário que está atualizando a categoria
        if (req.user && req.user.id) {
            categoryData.updated_by = req.user.id.toString();
        }

        // Atualizar a categoria
        const updatedCategory = await updateSupabaseCategory(categoryId, categoryData);
        
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

        return res.status(200).json(updatedCategory);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        return res.status(500).json({ message: 'Erro ao atualizar categoria' });
    }
}

// Controller para deletar uma categoria
async function deleteCategoryController(req, res) {
    try {
        const categoryId = parseInt(req.params.categoryId);
        
        // Adicionar informações do usuário que está deletando a categoria
        const userId = req.user && req.user.id ? req.user.id.toString() : null;

        // Tentar deletar a categoria
        const result = await deleteSupabaseCategory(categoryId, userId);
        
        if (result.error) {
            return res.status(result.status || 400).json({ message: result.error });
        }

        return res.status(200).json({ message: 'Categoria excluída com sucesso' });
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
        // Adicionar informações do usuário que está criando a subcategoria
        if (req.user && req.user.id) {
            subcategoryData.created_by = req.user.id.toString();
        }
        
        // Criar a subcategoria
        const subcategory = await createSupabaseSubcategory(subcategoryData);
        
        if (!subcategory) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

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
        const isActive = include_inactive === 'true' ? undefined : true;

        // Obter as subcategorias
        const subcategories = await getSupabaseSubcategoriesByCategory(categoryId, isActive);
        
        if (subcategories === null) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

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
        
        // Adicionar informações do usuário que está visualizando a subcategoria
        const userId = req.user && req.user.id ? req.user.id.toString() : null;

        const subcategory = await getSupabaseSubcategoryById(subcategoryId, userId);

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
        
        // Adicionar informações do usuário que está atualizando a subcategoria
        if (req.user && req.user.id) {
            subcategoryData.updated_by = req.user.id.toString();
        }

        // Atualizar a subcategoria
        const updatedSubcategory = await updateSupabaseSubcategory(subcategoryId, subcategoryData);
        
        if (!updatedSubcategory) {
            return res.status(404).json({ message: 'Subcategoria não encontrada' });
        }

        return res.status(200).json(updatedSubcategory);
    } catch (error) {
        console.error('Erro ao atualizar subcategoria:', error);
        return res.status(500).json({ message: 'Erro ao atualizar subcategoria' });
    }
}

// Controller para deletar uma subcategoria
async function deleteSubcategoryController(req, res) {
    try {
        const subcategoryId = parseInt(req.params.subcategoryId);
        
        // Adicionar informações do usuário que está deletando a subcategoria
        const userId = req.user && req.user.id ? req.user.id.toString() : null;

        // Tentar deletar a subcategoria
        const result = await deleteSupabaseSubcategory(subcategoryId, userId);
        
        if (result.error) {
            return res.status(result.status || 400).json({ message: result.error });
        }

        return res.status(200).json({ message: 'Subcategoria excluída com sucesso' });
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