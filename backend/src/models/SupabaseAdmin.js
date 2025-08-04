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
 * Cria um novo usuário administrador no Supabase e no banco de dados local
 * @param {Object} userData - Dados do usuário a ser criado
 * @returns {Object} - Usuário criado
 * @throws {Error} - Erro ao criar usuário
 */
async function createSupabaseAdmin(userData) {
  try {
    // 1. Verificar se o email já existe no Supabase
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Erro ao buscar usuários no Supabase:', fetchError);
      throw new Error('Erro ao acessar banco de dados Supabase');
    }
    
    const existingSupabaseUser = users.users.find(u => u.email === userData.email);
    
    if (existingSupabaseUser) {
      throw new Error('Email já está em uso no Supabase');
    }
    
    // 2. Criar usuário no Supabase
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        name: userData.name,
        role: 'Admin',
        phone: userData.phone || null
      }
    });
    
    if (createError) {
      console.error('Erro ao criar usuário no Supabase:', createError);
      throw new Error(`Erro ao criar usuário no Supabase: ${createError.message}`);
    }
    
    // 3. Criar usuário no banco de dados local (Prisma)
    const hashedPassword = await generateHashPassword(userData.password);
    
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        avatar: userData.avatar || null,
        hashed_password: hashedPassword,
        role: 'Admin'
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
    if (error.message !== 'Email já está em uso no Supabase') {
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const createdUser = users.users.find(u => u.email === userData.email);
        
        if (createdUser) {
          await supabase.auth.admin.deleteUser(createdUser.id);
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
 * Autentica um usuário administrador usando Supabase
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Object} - Dados da sessão e usuário
 * @throws {Error} - Erro de autenticação
 */
async function loginSupabaseAdmin(email, password) {
  try {
    // 1. Autenticar no Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Erro de autenticação no Supabase:', authError);
      throw new Error('Credenciais inválidas');
    }
    
    // 2. Verificar se o usuário existe no banco local e é um Admin
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: 'Admin'
      }
    });
    
    if (!user) {
      // Se o usuário existe no Supabase mas não no banco local ou não é Admin
      throw new Error('Usuário não encontrado ou não tem permissão de administrador');
    }
    
    return {
      session: authData.session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        supabase_id: authData.user.id
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza dados de um usuário administrador no Supabase e no banco local
 * @param {number} userId - ID do usuário no banco local
 * @param {string} supabaseId - ID do usuário no Supabase
 * @param {Object} userData - Novos dados do usuário
 * @returns {Object} - Usuário atualizado
 * @throws {Error} - Erro ao atualizar usuário
 */
async function updateSupabaseAdmin(userId, supabaseId, userData) {
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
      role: updatedUser.role
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Exclui um usuário administrador do Supabase e do banco local
 * @param {number} userId - ID do usuário no banco local
 * @param {string} supabaseId - ID do usuário no Supabase
 * @returns {boolean} - True se excluído com sucesso
 * @throws {Error} - Erro ao excluir usuário
 */
async function deleteSupabaseAdmin(userId, supabaseId) {
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
 * Recupera todos os administradores do banco local
 * @returns {Array} - Lista de administradores
 * @throws {Error} - Erro ao buscar administradores
 */
async function getAllSupabaseAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'Admin' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        created_at: true
      }
    });
    
    return admins;
  } catch (error) {
    throw error;
  }
}

export {
  createSupabaseAdmin,
  loginSupabaseAdmin,
  updateSupabaseAdmin,
  deleteSupabaseAdmin,
  getAllSupabaseAdmins
};