/**
 * Serviço de sincronização automática com Supabase Auth
 * Sincroniza usuários automaticamente quando são criados/atualizados
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
 * Formatar telefone para E.164 (formato internacional)
 */
function formatPhoneToE164(phone) {
  if (!phone) return null;
  
  // Remover todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se não começa com 55 (Brasil), adicionar
  if (!cleanPhone.startsWith('55')) {
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '55' + cleanPhone.substring(1);
    } else {
      cleanPhone = '55' + cleanPhone;
    }
  }
  
  // Adicionar o + no início
  return '+' + cleanPhone;
}

/**
 * Verificar se usuário já existe no Supabase
 */
async function userExistsInSupabase(email) {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao listar usuários do Supabase:', error);
      return false;
    }
    
    return users.users.some(user => user.email === email);
  } catch (error) {
    console.error('❌ Erro ao verificar usuário no Supabase:', error);
    return false;
  }
}

/**
 * Criar usuário no Supabase Auth
 */
async function createSupabaseUser(user) {
  try {
    console.log(`🔄 [AUTO-SYNC] Criando usuário no Supabase: ${user.email}`);
    
    // Verificar se já existe
    const exists = await userExistsInSupabase(user.email);
    if (exists) {
      console.log(`✅ [AUTO-SYNC] Usuário já existe no Supabase: ${user.email}`);
      return { success: true, alreadyExists: true };
    }
    
    // Formatar telefone se existir
    const formattedPhone = formatPhoneToE164(user.phone);
    
    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'temp-password-123', // Senha temporária
      email_confirm: true, // Confirmar email automaticamente
      phone: formattedPhone, // Telefone formatado
      user_metadata: {
        name: user.name,
        role: user.role,
        original_user_id: user.id
      }
    });

    if (error) {
      console.error(`❌ [AUTO-SYNC] Erro ao criar usuário ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [AUTO-SYNC] Usuário criado no Supabase: ${user.email} (ID: ${data.user.id})`);
    return { success: true, user: data.user, alreadyExists: false };

  } catch (error) {
    console.error(`❌ [AUTO-SYNC] Erro geral ao criar usuário ${user.email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualizar usuário no Supabase Auth
 */
async function updateSupabaseUser(user) {
  try {
    console.log(`🔄 [AUTO-SYNC] Atualizando usuário no Supabase: ${user.email}`);
    
    // Buscar usuário por email
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      throw searchError;
    }
    
    const targetUser = users.users.find(u => u.email === user.email);
    if (!targetUser) {
      console.log(`⚠️ [AUTO-SYNC] Usuário não encontrado no Supabase: ${user.email}`);
      return { success: false, error: 'Usuário não encontrado no Supabase' };
    }
    
    // Formatar telefone se existir
    const formattedPhone = formatPhoneToE164(user.phone);
    
    // Atualizar usuário
    const { data, error } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        phone: formattedPhone,
        user_metadata: {
          name: user.name,
          role: user.role,
          original_user_id: user.id
        }
      }
    );

    if (error) {
      console.error(`❌ [AUTO-SYNC] Erro ao atualizar usuário ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [AUTO-SYNC] Usuário atualizado no Supabase: ${user.email}`);
    return { success: true, user: data.user };

  } catch (error) {
    console.error(`❌ [AUTO-SYNC] Erro geral ao atualizar usuário ${user.email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sincronizar usuário automaticamente (criar ou atualizar)
 */
async function syncUserToSupabase(user, operation = 'create') {
  try {
    console.log(`🚀 [AUTO-SYNC] Iniciando sincronização: ${user.email} (${operation})`);
    
    if (operation === 'create') {
      return await createSupabaseUser(user);
    } else if (operation === 'update') {
      return await updateSupabaseUser(user);
    }
    
    return { success: false, error: 'Operação não suportada' };
    
  } catch (error) {
    console.error(`❌ [AUTO-SYNC] Erro na sincronização de ${user.email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sincronizar usuário de forma assíncrona (não bloqueia a operação principal)
 */
function syncUserAsync(user, operation = 'create') {
  // Executar em background para não bloquear a operação principal
  setImmediate(async () => {
    try {
      await syncUserToSupabase(user, operation);
    } catch (error) {
      console.error(`❌ [AUTO-SYNC] Erro na sincronização assíncrona:`, error);
    }
  });
}

export { 
  syncUserToSupabase, 
  syncUserAsync, 
  formatPhoneToE164,
  userExistsInSupabase 
};
