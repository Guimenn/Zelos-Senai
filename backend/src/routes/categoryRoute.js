/**
 * Rotas para gerenciamento de categorias e subcategorias
 * Operações CRUD para organização dos tickets
 */
import express from 'express';
import {
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
} from '../controllers/CategoryController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// ==================== ROTAS DE CATEGORIAS ====================
router.post('/categories', authorizeRole(['Admin']), createCategoryController);
router.get('/categories', authorizeRole(['Admin', 'Agent', 'Client']), getAllCategoriesController);
router.get('/categories/:categoryId', authorizeRole(['Admin', 'Agent', 'Client']), getCategoryByIdController);
router.put('/categories/:categoryId', authorizeRole(['Admin']), updateCategoryController);
router.delete('/categories/:categoryId', authorizeRole(['Admin']), deleteCategoryController);

// ==================== ROTAS DE SUBCATEGORIAS ====================
router.post('/subcategories', authorizeRole(['Admin']), createSubcategoryController);
router.get('/categories/:categoryId/subcategories', authorizeRole(['Admin', 'Agent', 'Client']), getSubcategoriesByCategoryController);
router.get('/subcategories/:subcategoryId', authorizeRole(['Admin', 'Agent', 'Client']), getSubcategoryByIdController);
router.put('/subcategories/:subcategoryId', authorizeRole(['Admin']), updateSubcategoryController);
router.delete('/subcategories/:subcategoryId', authorizeRole(['Admin']), deleteSubcategoryController);

export default router; 