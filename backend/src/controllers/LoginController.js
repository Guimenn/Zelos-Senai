import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import notificationService from '../services/NotificationService.js';

// Configurar dotenv
dotenv.config();

// Configurar Supabase (temporariamente comentado para permitir inicialização)
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// Verificar se as variáveis estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
}

/**
 * Função auxiliar para comparar senhas
 * Compara senha em texto plano com hash bcrypt
 */
async function compare(password, hashedPassword) {
	try {
		return await bcrypt.compare(password, hashedPassword);
	} catch (error) {
		console.error('Error comparing passwords:', error);
		return false;
	}
}

/**
 * Controller para definir nova senha
 * Atualiza senha do usuário usando Supabase E Backend
 */
async function newPasswordController(req, res) {
	return res.status(503).json({ 
		message: 'Atualização de senha temporariamente desabilitada. Tente novamente mais tarde.' 
	});
}

/**
 * Controller para recuperação de senha
 * Verifica se usuário existe para processo de recuperação
 */
async function recoveryController(req, res) {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ message: 'Email é obrigatório' });
	}

	try {
		const user = await prisma.user.findFirst({
			where: { email },
		});

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json({ message: 'Recuperação realizada com sucesso' });
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Erro interno do servidor', error });
	}
}

/**
 * Controller principal de login
 * Autentica usuário e gera token JWT
 */
async function loginController(req, res) {
	const SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

	const { email, password, twoFactorVerified } = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ message: 'Email e senha são obrigatórios' });
	}

	try {
		// Buscar usuário no backend
		const user = await prisma.user.findFirst({
			where: {
				email: email,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		// Verificar senha no backend
		const correctPassword = await compare(password, user.hashed_password);

		if (!correctPassword) {
			// Supabase temporarily disabled
			return res.status(401).json({ message: 'Senha inválida' });
		}

		// Verificar se o usuário tem 2FA habilitado
		const hasTwoFactor = user.two_factor_enabled || false;
		const phoneNumber = user.phone || "";

		// Se tem 2FA e não foi verificado ainda
		if (hasTwoFactor && !twoFactorVerified) {
			return res.status(200).json({
				message: '2FA requerido',
				requiresTwoFactor: true,
				phoneNumber: phoneNumber,
			});
		}

		const payload = {
		  userId: user.id,
		  name: user.name,
		  email: user.email,
		  userRole: user.role
		};
		console.log('Generating token with payload:', payload);
		const token = jwt.sign(payload, SECRET, {
		  expiresIn: '24h', // Aumentado para 24 horas para debug
		});
		
		console.log('🔐 Token gerado com payload:', payload);
		console.log('🔐 Token expira em 24 horas');

		return res.status(200).json({
			message: 'Login realizado com sucesso',
			token,
			user: { id: user.id, name: user.name, email: user.email, role: user.role },
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Erro interno do servidor', error });
	}
}

export { loginController, recoveryController, newPasswordController };
