import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required' });
	}

	try {
		// 1. Buscar usuário no Supabase
		const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
		
		if (fetchError) {
			console.error('Error fetching users:', fetchError);
			return res.status(500).json({ message: 'Error accessing Supabase user database' });
		}

		const supabaseUser = users.users.find(u => u.email === email);
		
		if (!supabaseUser) {
			return res.status(404).json({ message: 'User not found in Supabase' });
		}

		// 2. Buscar usuário no Backend
		const backendUser = await prisma.user.findFirst({
			where: { email },
		});

		if (!backendUser) {
			return res.status(404).json({ message: 'User not found in backend database' });
		}

		// 3. Atualizar senha no Supabase
		const { error: supabaseUpdateError } = await supabase.auth.admin.updateUserById(
			supabaseUser.id,
			{ password: password }
		);

		if (supabaseUpdateError) {
			console.error('Error updating password in Supabase:', supabaseUpdateError);
			
			// Verificar se é o erro de senha igual
			if (supabaseUpdateError.message.includes('different from the old password')) {
				return res.status(422).json({ 
					message: 'New password should be different from the old password' 
				});
			}
			
			return res.status(500).json({ 
				message: 'Error updating password in Supabase', 
				error: supabaseUpdateError.message 
			});
		}

		// 4. Atualizar senha no Backend
		const hashedPassword = await bcrypt.hash(password, 10);
		await prisma.user.update({
			where: { id: backendUser.id },
			data: { hashed_password: hashedPassword }
		});

		console.log(`Password updated successfully for user: ${email} in both Supabase and Backend`);

		return res.status(200).json({ 
			message: 'New password set successfully in both systems',
			user: {
				id: backendUser.id,
				email: email,
				role: backendUser.role
			}
		});
	} catch (error) {
		console.error('Error updating password:', error);
		res.status(500).json({ message: 'Internal server error', error: error.message });
	}
}

/**
 * Controller para recuperação de senha
 * Verifica se usuário existe para processo de recuperação
 */
async function recoveryController(req, res) {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ message: 'Email is required' });
	}

	try {
		const user = await prisma.user.findFirst({
			where: { email },
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.status(200).json({ message: 'Recovery successful' });
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Internal server error', error });
	}
}

/**
 * Controller principal de login
 * Autentica usuário e gera token JWT
 */
async function loginController(req, res) {
	const SECRET = process.env.JWT_SECRET;

	const { email, password } = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ message: 'Email and password are required' });
	}

	try {
		// Buscar usuário no backend
		const user = await prisma.user.findFirst({
			where: {
				email: email,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Verificar senha no backend
		const correctPassword = await compare(password, user.hashed_password);

		if (!correctPassword) {
			// Se a senha não bate no backend, verificar no Supabase
			console.log(`Password mismatch in backend for user: ${email}, checking Supabase...`);
			
			try {
				const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
				
				if (!fetchError) {
					const supabaseUser = users.users.find(u => u.email === email);
					
					if (supabaseUser) {
						// Tentar autenticar no Supabase
						const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
							type: 'signup',
							email: email,
							password: password
						});
						
						if (!authError) {
							console.log(`User authenticated via Supabase: ${email}`);
							// Se autenticou no Supabase, atualizar senha no backend
							const hashedPassword = await bcrypt.hash(password, 10);
							await prisma.user.update({
								where: { id: user.id },
								data: { hashed_password: hashedPassword }
							});
							console.log(`Password synchronized from Supabase to Backend for user: ${email}`);
						}
					}
				}
			} catch (syncError) {
				console.error('Error syncing password from Supabase:', syncError);
			}
			
			return res.status(401).json({ message: 'Invalid password' });
		}

		const token = jwt.sign({ user_id: user.id, role: user.role }, SECRET, {
			expiresIn: '2h',
		});

		return res.status(200).json({
			message: 'Login successful',
			token,
			user: { id: user.id, role: user.role },
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ message: 'Internal server error', error });
	}
}

export { loginController, recoveryController, newPasswordController };
