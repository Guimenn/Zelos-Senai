import slaMonitorService from '../services/SLAMonitorService.js';

/**
 * Controller para gerenciamento de SLA
 * Permite controlar o monitoramento de SLA e obter estatísticas
 */

/**
 * Obtém estatísticas de SLA
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getSLAStatistics = async (req, res) => {
    try {
        const statistics = await slaMonitorService.getSLAStatistics();
        
        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas de SLA:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao obter estatísticas de SLA'
        });
    }
};

/**
 * Verifica SLA de um ticket específico
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const checkTicketSLA = async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        if (!ticketId || isNaN(parseInt(ticketId))) {
            return res.status(400).json({
                success: false,
                message: 'ID do ticket é obrigatório e deve ser um número válido'
            });
        }

        const slaInfo = await slaMonitorService.checkTicketSLA(parseInt(ticketId));
        
        res.status(200).json({
            success: true,
            data: slaInfo
        });
    } catch (error) {
        console.error('Erro ao verificar SLA do ticket:', error);
        
        if (error.message === 'Ticket não encontrado') {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao verificar SLA do ticket'
        });
    }
};

/**
 * Força verificação manual de SLA
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const forceCheckSLA = async (req, res) => {
    try {
        // Executar verificação manual de SLA
        await slaMonitorService.checkSLAViolations();
        
        res.status(200).json({
            success: true,
            message: 'Verificação de SLA executada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao forçar verificação de SLA:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao executar verificação de SLA'
        });
    }
};

/**
 * Obtém status do serviço de monitoramento de SLA
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getSLAMonitorStatus = async (req, res) => {
    try {
        const status = {
            isRunning: slaMonitorService.isRunning,
            checkInterval: slaMonitorService.checkInterval,
            checkIntervalMinutes: slaMonitorService.checkInterval / (60 * 1000),
            lastCheck: new Date().toISOString() // Placeholder - seria melhor ter timestamp real
        };
        
        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Erro ao obter status do monitor de SLA:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao obter status do monitor'
        });
    }
};

/**
 * Inicia o serviço de monitoramento de SLA
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const startSLAMonitor = async (req, res) => {
    try {
        slaMonitorService.start();
        
        res.status(200).json({
            success: true,
            message: 'Serviço de monitoramento de SLA iniciado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao iniciar monitor de SLA:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao iniciar monitor de SLA'
        });
    }
};

/**
 * Para o serviço de monitoramento de SLA
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const stopSLAMonitor = async (req, res) => {
    try {
        slaMonitorService.stop();
        
        res.status(200).json({
            success: true,
            message: 'Serviço de monitoramento de SLA parado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao parar monitor de SLA:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao parar monitor de SLA'
        });
    }
};
