/**
 * Script para testar a sincronização automática
 * Cria um usuário de teste e verifica se foi sincronizado com Supabase
 */

import prisma from '../prisma/client.js';
import { userExistsInSupabase } from '../src/services/SupabaseSyncService.js';
import { createUser } from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAutoSync() {
  try {
    console.log('🧪 Testando sincronização automática...');
    
    // Dados do usuário de teste
    const testUserData = {
      name: 'Usuário Teste Auto Sync',
      email: `teste-auto-sync-${Date.now()}@exemplo.com`,
      phone: '11999999999',
      role: 'Client',
      password: 'senha123', // Senha em texto plano para ser hasheada
      is_active: true
    };
    
    console.log(`📝 Criando usuário de teste: ${testUserData.email}`);
    
    // Criar usuário usando o modelo (que tem sincronização automática)
    const createdUser = await createUser(testUserData);
    
    console.log(`✅ Usuário criado na tabela: ${createdUser.email} (ID: ${createdUser.id})`);
    
    // Aguardar um pouco para a sincronização assíncrona
    console.log('⏳ Aguardando sincronização automática...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se foi sincronizado com Supabase
    const existsInSupabase = await userExistsInSupabase(createdUser.email);
    
    if (existsInSupabase) {
      console.log('✅ SUCESSO: Usuário foi sincronizado automaticamente com Supabase!');
    } else {
      console.log('❌ FALHA: Usuário não foi encontrado no Supabase');
    }
    
    // Limpar usuário de teste
    console.log('🧹 Limpando usuário de teste...');
    await prisma.user.delete({
      where: { id: createdUser.id }
    });
    
    console.log('✅ Usuário de teste removido');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testAutoSync();
