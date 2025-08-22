/**
 * Middleware de autorização por papel
 * Verifica se o usuário tem permissão baseada em seu role
 */
export default function authorizeRole(allowedRoles) {
	return (req, res, next) => {
		console.log('🔍 DEBUG - authorizeRole:', {
			userRole: req.user.role,
			allowedRoles,
			user: req.user
		});
		
		if (!allowedRoles.includes(req.user.role)) {
			console.log('❌ Acesso negado - role não permitido:', req.user.role);
			return res.status(403).json({
				message: 'You don\'t have permission to access this route',
			});
		}
		console.log('✅ Acesso permitido para role:', req.user.role);
		next();
	};
}
