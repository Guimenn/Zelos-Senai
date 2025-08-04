import { getUserProfile } from '../models/User.js';

// Controller para obter o perfil do usuário autenticado
async function meController(req, res) {
	const { user_id, role } = req.user;

	try {
		if (!user_id || !role) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		const userProfile = await getUserProfile(user_id, role);

		if (!userProfile) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.status(200).json(userProfile);
	} catch (error) {
		console.error('Error in meController:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export { meController };
