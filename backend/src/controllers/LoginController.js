import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';

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
 * Atualiza senha do usuário no banco de dados
 */
async function newPasswordController(req, res) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required' });
	}

	try {
		const user = await prisma.user.findFirst({
			where: { email },
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await prisma.user.update({
			where: { id: user.id },
			data: { hashed_password: hashedPassword }
		});

		return res.status(200).json({ message: 'New password set successfully' });
	} catch (error) {
		console.error('Error updating password:', error);
		res.status(500).json({ message: 'Internal server error', error });
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
		const user = await prisma.user.findFirst({
			where: {
				email: email,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const correctPassword = await compare(password, user.hashed_password);

		if (!correctPassword) {
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
