import prisma from '../../prisma/client.js';
import bcrypt from 'bcryptjs';

/**
 * Controller para atualizar configurações de 2FA do usuário
 */
async function updateTwoFactorController(req, res) {
  console.log('🔐 updateTwoFactorController chamado');
  console.log('📝 Body da requisição:', req.body);
  console.log('👤 Usuário autenticado:', req.user);
  
  const { userId, twoFactorEnabled, phoneNumber } = req.body;

  if (!userId) {
    console.log('❌ userId não fornecido');
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  try {
    console.log('💾 Atualizando usuário no banco:', {
      userId: parseInt(userId),
      twoFactorEnabled,
      phoneNumber
    });

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        two_factor_enabled: twoFactorEnabled || false,
        phone: phoneNumber || null
      }
    });

    console.log('✅ Usuário atualizado com sucesso:', updatedUser);

    return res.status(200).json({
      message: 'Configurações de 2FA atualizadas com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        twoFactorEnabled: updatedUser.two_factor_enabled,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar 2FA settings:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}

export { updateTwoFactorController };
