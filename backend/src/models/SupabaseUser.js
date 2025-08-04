import { createClient } from '@supabase/supabase-js';
import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';

// Configurar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar se as variáveis estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
}

/**
 * Obtém todos os usuários do Supabase
 * @returns {Array} - Lista de usuários do Supabase
 * @throws {Error} - Erro ao buscar usuários
 */
async function getAllSupabaseUsers() {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Erro ao buscar usuários do Supabase:', error);
      throw new Error(`Erro ao buscar usuários do Supabase: ${error.message}`);
    }
    
    return users.users;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém um usuário do Supabase pelo ID
 * @param {string} supabaseId - ID do usuário no Supabase
 * @returns {Object} - Dados do usuário
 * @throws {Error} - Erro ao buscar usuário
 */
async function getSupabaseUserById(supabaseId) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(supabaseId);
    
    if (error) {
      console.error('Erro ao buscar usuário do Supabase:', error);
      throw new Error(`Erro ao buscar usuário do Supabase: ${error.message}`);
    }
    
    if (!data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém um usuário do Supabase pelo email
 * @param {string} email - Email do usuário
 * @returns {Object} - Dados do usuário
 * @throws {Error} - Erro ao buscar usuário
 */
async function getSupabaseUserByEmail(email) {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Erro ao buscar usuários do Supabase:', error);
      throw new Error(`Erro ao buscar usuários do Supabase: ${error.message}`);
    }
    
    const user = users.users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Cria um novo usuário no Supabase e no banco local
 * @param {Object} userData - Dados do usuário a ser criado
 * @returns {Object} - Usuário criado
 * @throws {Error} - Erro ao criar usuário
 */
async function createSupabaseUser(userData) {
  try {
    // 1. Verificar se o email já existe no Supabase
    const existingSupabaseUser = await getSupabaseUserByEmail(userData.email);
    
    if (existingSupabaseUser) {
      throw new Error('Email já está em uso no Supabase');
    }
    
    // 2. Verificar se o email já existe no banco local
    const existingLocalUser = await prisma.user.findFirst({
      where: { email: userData.email }
    });
    
    if (existingLocalUser) {
      throw new Error('Email já está em uso no banco local');
    }
    
    // 3. Criar usuário no Supabase
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        name: userData.name,
        role: userData.role || 'Client',
        phone: userData.phone || null
      }
    });
    
    if (createError) {
      console.error('Erro ao criar usuário no Supabase:', createError);
      throw new Error(`Erro ao criar usuário no Supabase: ${createError.message}`);
    }
    
    // 4. Criar usuário no banco local (Prisma)
    const hashedPassword = await generateHashPassword(userData.password);
    
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        avatar: userData.avatar || null,
        hashed_password: hashedPassword,
        role: userData.role || 'Client',
        is_active: true
      }
    });
    
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      supabase_id: authData.user.id
    };
  } catch (error) {
    // Se ocorrer um erro, tentar limpar o usuário criado no Supabase (se existir)
    if (error.message !== 'Email já está em uso no Supabase' && 
        error.message !== 'Email já está em uso no banco local') {
      try {
        const existingUser = await getSupabaseUserByEmail(userData.email);
        
        if (existingUser) {
          await supabase.auth.admin.deleteUser(existingUser.id);
          console.log(`Usuário removido do Supabase após falha: ${userData.email}`);
        }
      } catch (cleanupError) {
        console.error('Erro ao limpar usuário do Supabase após falha:', cleanupError);
      }
    }
    
    throw error;
  }
}

/**
 * Atualiza um usuário no Supabase e no banco local
 * @param {number} userId - ID do usuário no banco local
 * @param {string} supabaseId - ID do usuário no Supabase
 * @param {Object} userData - Novos dados do usuário
 * @returns {Object} - Usuário atualizado
 * @throws {Error} - Erro ao atualizar usuário
 */
async function updateSupabaseUser(userId, supabaseId, userData) {
  try {
    // Preparar dados para atualização
    const supabaseUpdateData = {};
    const prismaUpdateData = {};
    
    // Atualizar campos básicos
    if (userData.name) {
      prismaUpdateData.name = userData.name;
      supabaseUpdateData.user_metadata = { name: userData.name };
    }
    
    if (userData.phone) {
      prismaUpdateData.phone = userData.phone;
      if (!supabaseUpdateData.user_metadata) supabaseUpdateData.user_metadata = {};
      supabaseUpdateData.user_metadata.phone = userData.phone;
    }
    
    if (userData.avatar) {
      prismaUpdateData.avatar = userData.avatar;
    }
    
    if (userData.is_active !== undefined) {
      prismaUpdateData.is_active = userData.is_active;
    }
    
    // Atualizar papel (role) se fornecido
    if (userData.role) {
      prismaUpdateData.role = userData.role;
      if (!supabaseUpdateData.user_metadata) supabaseUpdateData.user_metadata = {};
      supabaseUpdateData.user_metadata.role = userData.role;
    }
    
    // Atualizar senha se fornecida
    if (userData.password) {
      // Atualizar no Supabase
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        supabaseId,
        { password: userData.password }
      );
      
      if (passwordError) {
        console.error('Erro ao atualizar senha no Supabase:', passwordError);
        throw new Error(`Erro ao atualizar senha: ${passwordError.message}`);
      }
      
      // Atualizar no banco local
      prismaUpdateData.hashed_password = await generateHashPassword(userData.password);
    }
    
    // Atualizar no Supabase se houver dados para atualizar
    if (Object.keys(supabaseUpdateData).length > 0) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        supabaseId,
        supabaseUpdateData
      );
      
      if (updateError) {
        console.error('Erro ao atualizar usuário no Supabase:', updateError);
        throw new Error(`Erro ao atualizar usuário no Supabase: ${updateError.message}`);
      }
    }
    
    // Atualizar no banco local se houver dados para atualizar
    if (Object.keys(prismaUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: prismaUpdateData
      });
    }
    
    // Buscar usuário atualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      is_active: updatedUser.is_active
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Exclui um usuário do Supabase e do banco local
 * @param {number} userId - ID do usuário no banco local
 * @param {string} supabaseId - ID do usuário no Supabase
 * @returns {boolean} - True se excluído com sucesso
 * @throws {Error} - Erro ao excluir usuário
 */
async function deleteSupabaseUser(userId, supabaseId) {
  try {
    // 1. Excluir do Supabase
    const { error: deleteError } = await supabase.auth.admin.deleteUser(supabaseId);
    
    if (deleteError) {
      console.error('Erro ao excluir usuário do Supabase:', deleteError);
      throw new Error(`Erro ao excluir usuário do Supabase: ${deleteError.message}`);
    }
    
    // 2. Excluir do banco local
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém o perfil do usuário autenticado com base no ID e função
 * @param {string} userId - ID do usuário
 * @param {string} role - Função do usuário (admin, agent, client)
 * @returns {Object} - Perfil do usuário
 * @throws {Error} - Erro ao buscar perfil do usuário
 */
async function getSupabaseUserProfile(userId, role) {
  try {
    // Buscar o usuário no Supabase
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw new Error(`Erro ao buscar perfil do usuário: ${error.message}`);
    }
    
    if (!data) {
      return null;
    }
    
    // Buscar informações adicionais com base na função
    let additionalInfo = {};
    
    if (role === 'admin') {
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!adminError && adminData) {
        additionalInfo = adminData;
      }
    } else if (role === 'agent') {
      const { data: agentData, error: agentError } = await supabase
        .from('agent')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!agentError && agentData) {
        additionalInfo = agentData;
      }
    } else if (role === 'client') {
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!clientError && clientData) {
        additionalInfo = clientData;
      }
    }
    
    // Combinar dados do usuário com informações adicionais
    return {
      ...data,
      ...additionalInfo,
      role
    };
  } catch (error) {
    throw error;
  }
}

export {
  getAllSupabaseUsers,
  getSupabaseUserById,
  getSupabaseUserByEmail,
  createSupabaseUser,
  updateSupabaseUser,
  deleteSupabaseUser,
  getSupabaseUserProfile
};