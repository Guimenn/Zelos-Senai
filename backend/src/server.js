import express from 'express';
import prisma from '../prisma/client.js';
import { createUser } from './models/User.js';
import env from 'dotenv';
import cors from 'cors';

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
import slaMonitorService from './services/SLAMonitorService.js';

/**
 * Configuração do servidor Express
 * API principal da plataforma Studdy
 */
const app = express();
const port = 3001;
env.config();

// Middlewares globais
app.use(express.json());
app.use(
	cors({
		origin: ['https://studdy-three.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:5500', 'file://'],
		credentials: true,
	}),
);

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

// Rotas de notificações
app.use('/api/notifications', notificationRoute);

// Rotas de SLA
app.use('/api/sla', slaRoute);

try {
	const adminExists = await prisma.user.findFirst({
		where: { role: 'Admin' },
	});

	const admin = {
		name: 'Admin',
		email: 'admin@admin.com',
		password: 'admin123',
		phone: '11933705007',
		avatar: null,
		role: 'Admin',
		is_active: true,
	};

	if (!adminExists) await createUser(admin);
} catch (error) {
	console.error('Error creating admin user:', error);
}

slaMonitorService.start();

app.listen(port, () => {
	console.log(`Servidor rodando na porta ${port}`);
	console.log('SLA Monitor Service iniciado automaticamente');
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('Recebido SIGTERM, parando serviços...');
	slaMonitorService.stop();
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('Recebido SIGINT, parando serviços...');
	slaMonitorService.stop();
	process.exit(0);
});
