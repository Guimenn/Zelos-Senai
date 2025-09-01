import express from 'express';
import prisma from '../prisma/client.js';
import { createUser } from './models/User.js';
import env from 'dotenv';
import cors from 'cors';
import { compressionMiddleware, cacheMiddleware, optimizeHeadersMiddleware } from './middlewares/compression.js';

env.config(); // Carrega as variáveis de ambiente do .env

// Routes
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';

// Helpdesk Routes
import ticketRoute from './routes/ticketRoute.js';
import commentRoute from './routes/commentRoute.js';
import categoryRoute from './routes/categoryRoute.js';
import agentRoute from './routes/agentRoute.js';
import clientRoute from './routes/clientRoute.js';
import notificationRoute from './routes/notificationRoute.js';
import slaRoute from './routes/slaRoute.js';
import attachmentRoute from './routes/attachmentRoute.js';
import ticketAssignmentRoute from './routes/ticketAssignmentRoute.js';
import slaMonitorService from './services/SLAMonitorService.js';

/**
 * Configuração do servidor Express
 * API principal da plataforma Studdy
 */
const app = express();
const port = 3001;

// Middlewares globais de otimização
app.use(optimizeHeadersMiddleware);
// app.use(compressionMiddleware); // Temporariamente desabilitado devido a erro
app.use(cacheMiddleware);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração CORS otimizada
app.use(
	cors({
		origin: [
			'https://studdy-three.vercel.app', 
			'http://localhost:3000', 
			'http://localhost:3002', 
			'http://127.0.0.1:5500', 
			'file://',
			'https://zelos-senai.vercel.app',
			'https://zelos-senai-git-main-gui-menn.vercel.app',
			'https://zelos-senai-gui-menn.vercel.app'
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		optionsSuccessStatus: 200,
		maxAge: 86400 // Cache preflight por 24 horas
	}),
);

// Middleware de logging de performance
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const size = res.get('Content-Length') || 'unknown';
        
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${size} bytes`);
        
        // Alertar sobre respostas lentas
        if (duration > 1000) {
            console.warn(`⚠️ Resposta lenta detectada: ${req.method} ${req.path} levou ${duration}ms`);
        }
    });
    
    next();
});

/**
 * Configuração das rotas da API
 * Cada rota tem middlewares específicos de autenticação e autorização
 */

// Rota de autenticação (pública)
app.use('/login', authRoute);

// Rota de usuários (pública)
app.use('/user', userRoute);

// Rotas administrativas
app.use('/admin', adminRoute);

// Rotas do sistema de helpdesk
app.use('/helpdesk/tickets', ticketRoute);
app.use('/helpdesk', commentRoute);
app.use('/helpdesk', categoryRoute);
app.use('/helpdesk/agents', agentRoute);
app.use('/helpdesk/client', clientRoute);

// Rotas específicas para agentes
app.use('/agent', agentRoute);

// Rotas de notificações
app.use('/api/notifications', notificationRoute);

// Rotas de SLA
app.use('/api/sla', slaRoute);

// Rotas de anexos
app.use('/api/attachments', attachmentRoute);

// Rotas de atribuição de tickets
app.use('/api', ticketAssignmentRoute);

// Rota de health check para monitoramento
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// Rota de métricas de performance
app.get('/metrics', (req, res) => {
    const { cache } = require('./utils/cache.js');
    const stats = cache.getStats();
    
    res.status(200).json({
        cache: stats,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de erros otimizado
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    // Não expor detalhes internos em produção
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        message: isDevelopment ? err.message : 'Erro interno do servidor',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Middleware 404 otimizado
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method
    });
});



// Iniciar servidor com configurações otimizadas
const server = app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📈 Métricas: http://localhost:${port}/metrics`);
});

// Configurações de timeout otimizadas
server.timeout = 30000; // 30 segundos
server.keepAliveTimeout = 65000; // 65 segundos
server.headersTimeout = 66000; // 66 segundos

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});

export default app;
