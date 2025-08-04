import { registerWithSupabase } from '../models/SupabaseAuth.js';

/**
 * Controller para registro de novos usuários
 * Registra usuário usando Supabase e banco local
 */
async function registerController(req, res) {
  const userData = req.body;

  if (!userData || !userData.email || !userData.password || !userData.name) {
    return res.status(400).json({ 
      message: 'Dados incompletos. Nome, email e senha são obrigatórios' 
    });
  }

  try {
    // Registrar usuário usando o modelo Supabase
    const newUser = await registerWithSupabase(userData);
    
    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    
    // Retornar mensagem de erro específica
    if (error.message.includes('já está em uso')) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ 
      message: 'Erro ao registrar usuário', 
      error: error.message 
    });
  }
}

export { registerController };