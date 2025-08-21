import { getUserProfile } from '../models/User.js';

// Controller para obter o perfil do usuário autenticado
async function meController(req, res) {
	const { user_id, role } = req.user;

	try {
		if (!user_id || !role) {
			return res.status(401).json({ message: 'Não autorizado' });
		}

		const userProfile = await getUserProfile(user_id, role);

		if (!userProfile) {
			return res.status(404).json({ message: 'Usuário não encontrado' });
		}

		return res.status(200).json(userProfile);
	} catch (error) {
		console.error('Error in meController:', error);
		return res.status(500).json({ message: 'Erro interno do servidor' });
	}
}

export { meController };
