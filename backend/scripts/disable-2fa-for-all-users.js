/**
 * Script para desativar 2FA para todos os usuários existentes
 */

import prisma from '../prisma/client.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function disable2FAForAllUsers() {
  try {
    console.log('🚀 Desativando 2FA para todos os usuários...');
    
    // Desativar 2FA para todos os usuários
    const updateResult = await prisma.user.updateMany({
      data: {
        two_factor_enabled: false,
        skip_two_factor_until: null // Limpar também o campo de pular 2FA
      }
    });

    console.log(`✅ 2FA desativado para ${updateResult.count} usuários`);
    console.log('🎉 Script executado com sucesso!');
    console.log('📝 Agora o login funcionará normalmente sem verificação 2FA');
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
disable2FAForAllUsers();
