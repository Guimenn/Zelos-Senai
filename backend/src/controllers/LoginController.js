import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import notificationService from '../services/NotificationService.js';
import { generateHashPassword } from '../utils/hash.js';

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
	const { email, newPassword, password, code } = req.body;

	// Aceitar tanto 'newPassword' quanto 'password' para compatibilidade
	const finalPassword = newPassword || password;

	if (!email || !finalPassword) {
		return res.status(400).json({ 
			message: 'Email e nova senha são obrigatórios' 
		});
	}

	// Se não há código, pular verificação (para compatibilidade com fluxo antigo)
	if (!code) {
		console.log('⚠️ [PASSWORD RESET] Código não fornecido, pulando verificação');
	}

	try {
		// Verificar se o usuário existe
		const user = await prisma.user.findFirst({
			where: { email },
		});

		if (!user) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		// Verificar se o usuário está ativo
		if (!user.is_active) {
			return res.status(401).json({ message: 'Conta de usuário desativada' });
		}

		// Verificar código via Supabase (se fornecido)
		if (code) {
			const { createClient } = await import('@supabase/supabase-js');
			
			const supabase = createClient(
				process.env.SUPABASE_URL,
				process.env.SUPABASE_SERVICE_ROLE_KEY,
				{
					auth: {
						autoRefreshToken: false,
						persistSession: false
					}
				}
			);

			const { data, error } = await supabase.auth.verifyOtp({
				email: email,
				token: code,
				type: 'email'
			});

			if (error) {
				console.error('❌ [PASSWORD RESET] Erro na verificação do código:', error);
				return res.status(400).json({ 
					message: 'Código inválido ou expirado' 
				});
			}
		}

		// Hash da nova senha
		const hashedPassword = await generateHashPassword(finalPassword);

		// Atualizar senha no banco
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: { hashed_password: hashedPassword }
		});

		console.log(`✅ [PASSWORD RESET] Senha atualizada para: ${email}`);

		return res.status(200).json({ 
			message: 'Senha atualizada com sucesso',
			success: true
		});

	} catch (error) {
		console.error('❌ [PASSWORD RESET] Erro ao atualizar senha:', error);
		return res.status(500).json({ 
			message: 'Erro interno do servidor',
			error: error.message 
		});
	}
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

		// Verificar se o usuário está ativo
		if (!user.is_active) {
			return res.status(401).json({ message: 'Conta de usuário desativada' });
		}

		// Enviar código de recuperação via Supabase (mesmo sistema do 2FA)
		const { createClient } = await import('@supabase/supabase-js');
		
		const supabase = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false
				}
			}
		);

		const { data, error } = await supabase.auth.signInWithOtp({
			email: email,
			options: {
				shouldCreateUser: true,
				channel: "email",
			},
		});

		if (error) {
			console.error('❌ [PASSWORD RECOVERY] Erro ao enviar código:', error);
			return res.status(500).json({ 
				message: 'Erro ao enviar código de recuperação',
				error: error.message 
			});
		}

		console.log(`✅ [PASSWORD RECOVERY] Código enviado para: ${email}`);

		return res.status(200).json({ 
			message: 'Código de recuperação enviado para seu email',
			success: true
		});

	} catch (error) {
		console.error('❌ [PASSWORD RECOVERY] Erro geral:', error);
		return res.status(500).json({ 
			message: 'Erro interno do servidor',
			error: error.message 
		});
	}
}

/**
 * Controller principal de login
 * Autentica usuário e gera token JWT
 */
async function loginController(req, res) {
	const SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

	const { email, password, twoFactorVerified, rememberMe } = req.body;

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

		// Verificar se o usuário está ativo
		if (!user.is_active) {
			return res.status(401).json({ message: 'Conta de usuário desativada' });
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

		// Verificar se deve pular 2FA devido ao "lembrar de mim"
		const shouldSkipTwoFactor = user.skip_two_factor_until && new Date() < new Date(user.skip_two_factor_until);

		// SEMPRE solicitar 2FA via email se o usuário tem email cadastrado
		if (user.email && !twoFactorVerified && !shouldSkipTwoFactor) {
			return res.status(200).json({
				message: '2FA requerido',
				requiresTwoFactor: true,
				email: user.email,
				method: 'email'
			});
		}

		const payload = {
		  userId: user.id,
		  name: user.name,
		  email: user.email,
		  userRole: user.role
		};
		
		// Definir expiração baseada no rememberMe
		const expiresIn = rememberMe ? '15d' : '24h'; // 15 dias se rememberMe, 24h se não
		
		
		const token = jwt.sign(payload, SECRET, {
		  expiresIn: expiresIn,
		});
		


		// Se rememberMe está ativo, atualizar o campo skip_two_factor_until
		if (rememberMe && hasTwoFactor) {
			const skipUntil = new Date();
			skipUntil.setDate(skipUntil.getDate() + 30); // 30 dias a partir de agora
			
			await prisma.user.update({
				where: { id: user.id },
				data: { skip_two_factor_until: skipUntil }
			});
			
		
		}

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

/**
 * Controller para logout
 * Limpa a preferência de "lembrar de mim" do usuário
 */
async function logoutController(req, res) {
	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({ message: 'ID do usuário é obrigatório' });
	}

	try {
		// Limpar a preferência de pular 2FA
		await prisma.user.update({
			where: { id: parseInt(userId) },
			data: { skip_two_factor_until: null }
		});

	
		return res.status(200).json({
			message: 'Logout realizado com sucesso',
		});
	} catch (error) {
		console.error('Error during logout:', error);
		res.status(500).json({ message: 'Erro interno do servidor', error });
	}
}

export { loginController, recoveryController, newPasswordController, logoutController };
