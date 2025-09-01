/**
 * Middleware de autorização por papel
 * Verifica se o usuário tem permissão baseada em seu role
 */
export default function authorizeRole(allowedRoles) {
	return (req, res, next) => {

		
		if (!allowedRoles.includes(req.user.role)) {
			console.log('❌ Acesso negado - role não permitido:', req.user.role);
			return res.status(403).json({
				message: 'You don\'t have permission to access this route',
			});
		}
		
		next();
	};
}
