import { getAdminStatistics } from '../models/Admin.js';

// Controller para obter estatísticas administrativas do sistema
async function getAdminStatisticsController(req, res) {
	try {
		const statistics = await getAdminStatistics(req.user.id);
		return res.status(200).json(statistics);
	} catch (error) {
		console.error(error);
		if (error.message.includes('not found')) {
			return res.status(404).json({ message: error.message });
		}

		if (error.message.includes('not admin')) {
			return res.status(403).json({ message: error.message });
		}

		return res
			.status(500)
			.json({ message: 'Error fetching admin statistics' });
	}
}

export { getAdminStatisticsController };