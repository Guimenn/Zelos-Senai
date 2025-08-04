import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';
import { loginWithSupabase, recoverPasswordWithSupabase, updatePasswordWithSupabase } from '../models/SupabaseAuth.js';

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
 * Atualiza senha do usuário usando Supabase e banco local
 */
async function newPasswordController(req, res) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: 'Email e senha são obrigatórios' });
	}

	try {
		// Atualizar senha usando o modelo Supabase
		await updatePasswordWithSupabase(email, password);

		// Buscar usuário no banco local para retornar dados
		const user = await prisma.user.findFirst({
			where: { email },
		});

		return res.status(200).json({ 
			message: 'Nova senha definida com sucesso em ambos os sistemas',
			user: {
				id: user.id,
				email: email,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Erro ao atualizar senha:', error);
		
		// Retornar mensagem de erro específica
		if (error.message.includes('diferente da senha antiga')) {
			return res.status(422).json({ 
				message: 'A nova senha deve ser diferente da senha antiga' 
			});
		}
		
		if (error.message.includes('não encontrado')) {
			return res.status(404).json({ 
				message: 'Usuário não encontrado' 
			});
		}
		
		res.status(500).json({ 
			message: 'Erro interno do servidor', 
			error: error.message 
		});
	}
}

/**
 * Controller para recuperação de senha
 * Envia email de recuperação usando Supabase
 */
async function recoveryController(req, res) {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ message: 'Email é obrigatório' });
	}

	try {
		// Enviar email de recuperação usando o modelo Supabase
		await recoverPasswordWithSupabase(email);
		
		return res.status(200).json({ 
			message: 'Email de recuperação enviado com sucesso' 
		});
	} catch (error) {
		console.error('Erro ao processar recuperação de senha:', error);
		
		// Retornar mensagem de erro específica
		if (error.message.includes('não encontrado')) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}
		
		res.status(500).json({ 
			message: 'Erro interno do servidor', 
			error: error.message 
		});
	}
}

/**
 * Controller principal de login
 * Autentica usuário usando Supabase e gera token JWT
 */
async function loginController(req, res) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ message: 'Email e senha são obrigatórios' });
	}

	try {
		// Autenticar usando Supabase
		const authResult = await loginWithSupabase(email, password);
		
		return res.status(200).json(authResult);
	} catch (error) {
		console.error('Erro de autenticação:', error);
		
		// Retornar mensagem de erro específica
		if (error.message === 'Credenciais inválidas') {
			return res.status(401).json({ message: 'Email ou senha inválidos' });
		}
		
		res.status(500).json({ 
			message: 'Erro interno do servidor', 
			error: error.message 
		});
	}
}

export { loginController, recoveryController, newPasswordController };
