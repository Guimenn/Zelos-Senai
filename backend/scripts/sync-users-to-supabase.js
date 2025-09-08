/**
 * Script para sincronizar usuários da tabela PostgreSQL com Supabase Auth
 * Cria usuários no Supabase Auth para permitir 2FA via SMS
 */

import prisma from '../prisma/client.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar Supabase Admin
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Criar usuário no Supabase Auth
 */
async function createSupabaseUser(user) {
  try {
    console.log(`🔄 Criando usuário no Supabase: ${user.email}`);
    
    // Criar usuário no Supabase Auth usando a API REST
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'temp-password-123', // Senha temporária
      email_confirm: true, // Confirmar email automaticamente
      phone: user.phone || null, // Adicionar telefone se existir
      user_metadata: {
        name: user.name,
        role: user.role,
        original_user_id: user.id
      }
    });

    if (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Usuário criado no Supabase: ${user.email} (ID: ${data.user.id})`);
    return { success: true, user: data.user, alreadyExists: false };

  } catch (error) {
    console.error(`❌ Erro geral ao criar usuário ${user.email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualizar usuário no Supabase Auth com telefone
 */
async function updateSupabaseUserPhone(email, phone) {
  try {
    if (!phone) return { success: true, message: 'Sem telefone para atualizar' };
    
    console.log(`📱 Atualizando telefone no Supabase: ${email} -> ${phone}`);
    
    // Buscar usuário por email primeiro
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      throw searchError;
    }
    
    const targetUser = users.users.find(u => u.email === email);
    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        phone: phone,
        phone_confirm: false // Não confirmar automaticamente
      }
    );

    if (error) {
      console.error(`❌ Erro ao atualizar telefone ${email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Telefone atualizado no Supabase: ${email}`);
    return { success: true, user: data.user };

  } catch (error) {
    console.error(`❌ Erro geral ao atualizar telefone ${email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Função principal de sincronização
 */
async function syncUsersToSupabase() {
  try {
    console.log('🚀 Iniciando sincronização de usuários para Supabase Auth...');
    
    // Buscar todos os usuários da tabela
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true
      }
    });

    console.log(`📊 Encontrados ${users.length} usuários na tabela`);

    if (users.length === 0) {
      console.log('✅ Nenhum usuário para sincronizar');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let alreadyExistsCount = 0;

    // Processar cada usuário
    for (const user of users) {
      console.log(`\n--- Processando: ${user.email} ---`);
      
      // Criar usuário no Supabase
      const result = await createSupabaseUser(user);
      
      if (result.success) {
        if (result.alreadyExists) {
          alreadyExistsCount++;
          
          // Se já existe, tentar atualizar o telefone
          if (user.phone) {
            await updateSupabaseUserPhone(user.email, user.phone);
          }
        } else {
          successCount++;
          
          // Se foi criado, atualizar com telefone
          if (user.phone) {
            await updateSupabaseUserPhone(user.email, user.phone);
          }
        }
      } else {
        errorCount++;
        console.error(`❌ Falha ao processar ${user.email}: ${result.error}`);
      }
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Relatório final
    console.log('\n📋 RELATÓRIO DE SINCRONIZAÇÃO:');
    console.log(`✅ Usuários criados: ${successCount}`);
    console.log(`🔄 Usuários já existentes: ${alreadyExistsCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${users.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Sincronização concluída com sucesso!');
      console.log('📱 Agora os usuários podem usar 2FA via SMS');
    } else {
      console.log('\n⚠️ Sincronização concluída com alguns erros');
    }
    
  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
syncUsersToSupabase();
