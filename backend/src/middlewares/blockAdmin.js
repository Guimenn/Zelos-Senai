/**
 * Middleware para bloquear acesso de administradores
 * Impede que usuários com role 'Admin' acessem determinadas rotas
 */
function blockAdmin(req, res, next) {
	if (req.user.role === 'Admin') {
		return res.status(403).json({
			message: 'Admins are not allowed to access this route',
		});
	}
	next();
}

export default blockAdmin;