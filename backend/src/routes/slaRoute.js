import express from 'express';
import authenticated from '../middlewares/authenticated.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import {
    getSLAStatistics,
    checkTicketSLA,
    forceCheckSLA,
    getSLAMonitorStatus,
    startSLAMonitor,
    stopSLAMonitor
} from '../controllers/SLAController.js';

const router = express.Router();

/**
 * Rotas para gerenciamento de SLA
 * Todas as rotas requerem autenticação
 * Algumas rotas são restritas a administradores
 */

// Obter estatísticas de SLA (Admin e Técnico)
router.get('/statistics', 
    authenticated, 
    authorizeRole(['Admin', 'Técnico']), 
    getSLAStatistics
);

// Verificar SLA de um ticket específico (Admin e Técnico)
router.get('/ticket/:ticketId', 
    authenticated, 
    authorizeRole(['Admin', 'Técnico']), 
    checkTicketSLA
);

// Forçar verificação manual de SLA (Admin apenas)
router.post('/check', 
    authenticated, 
    authorizeRole(['Admin']), 
    forceCheckSLA
);

// Obter status do monitor de SLA (Admin apenas)
router.get('/monitor/status', 
    authenticated, 
    authorizeRole(['Admin']), 
    getSLAMonitorStatus
);

// Iniciar monitor de SLA (Admin apenas)
router.post('/monitor/start', 
    authenticated, 
    authorizeRole(['Admin']), 
    startSLAMonitor
);

// Parar monitor de SLA (Admin apenas)
router.post('/monitor/stop', 
    authenticated, 
    authorizeRole(['Admin']), 
    stopSLAMonitor
);

export default router;
