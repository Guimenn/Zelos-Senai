/**
 * Rotas administrativas do sistema
 * Gerencia operações CRUD para disciplinas, professores, alunos, turmas e estatísticas
 */
import express from 'express';

import { getAdminStatisticsController } from '../controllers/AdminController.js';

import {
	getAllSubjectsController,
	getSubjectByIdController,
	createSubjectController,
	updateSubjectController,
	deleteSubjectController,
} from '../controllers/SubjectController.js';

import {
	getAllTeachersController,
	getTeacherByIdController,
	createTeacherController,
	updateTeacherController,
	deleteTeacherController,
} from '../controllers/TeacherController.js';

import {
	getAllStudentsController,
	getStudentByIdController,
	createStudentController,
	updateStudentController,
	deleteStudentController,
} from '../controllers/StudentController.js';

import {
	getAllClassesController,
	getClassByIdController,
	createClassController,
	updateClassController,
	deleteClassController,
} from '../controllers/ClassController.js';

const router = express.Router();

// Rotas para gerenciar disciplinas
router.get('/subjects', getAllSubjectsController);
router.get('/subjects/:subjectId', getSubjectByIdController);
router.post('/subjects', createSubjectController);
router.put('/subjects/:subjectId', updateSubjectController);
router.delete('/subjects/:subjectId', deleteSubjectController);

// Rotas para gerenciar professores
router.get('/teachers', getAllTeachersController);
router.get('/teachers/:teacherId', getTeacherByIdController);
router.post('/teachers', createTeacherController);
router.put('/teachers/:teacherId', updateTeacherController);
router.delete('/teachers/:teacherId', deleteTeacherController);

// Rotas para gerenciar alunos
router.get('/students', getAllStudentsController);
router.get('/students/:studentId', getStudentByIdController);
router.post('/students', createStudentController);
router.put('/students/:studentId', updateStudentController);
router.delete('/students/:studentId', deleteStudentController);

// Rotas para gerenciar turmas
router.get('/classes', getAllClassesController);
router.get('/classes/:classId', getClassByIdController);
router.post('/classes', createClassController);
router.put('/classes/:classId', updateClassController);
router.delete('/classes/:classId', deleteClassController);

// Rota para obter as estatísticas do admin
router.get('/status', getAdminStatisticsController);

export default router;
