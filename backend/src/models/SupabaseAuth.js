import { createClient } from '@supabase/supabase-js';
import prisma from '../../prisma/client.js';
import { generateHashPassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';

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
 * Autentica um usuário usando Supabase
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Object} - Dados da sessão e usuário
 * @throws {Error} - Erro de autenticação
 */
async function loginWithSupabase(email, password) {
  try {
    console.log(`Tentando autenticar usuário ${email} no Supabase...`);
    
    // 1. Autenticar no Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Erro de autenticação no Supabase:', authError);
      
      // Verificar se o usuário existe no Supabase
      const { data: users } = await supabase.auth.admin.listUsers();
      const userExists = users.users.some(u => u.email === email);
      
      if (!userExists) {
        console.log(`Usuário ${email} não encontrado no Supabase. Tentando criar...`);
        
        // Criar usuário no Supabase
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: 'Administrador',
            role: 'Admin'
          }
        });
        
        if (createError) {
          console.error('Erro ao criar usuário no Supabase:', createError);
          throw new Error('Falha ao criar usuário no Supabase');
        }
        
        console.log(`Usuário ${email} criado com sucesso no Supabase!`);
        
        // Tentar autenticar novamente
        return await loginWithSupabase(email, password);
      }
      
      throw new Error('Credenciais inválidas');
    }
    
    // 2. Verificar se o usuário existe no banco local
    const user = await prisma.user.findFirst({
      where: { email }
    });
    
    if (!user) {
      // Se o usuário existe no Supabase mas não no banco local, criar no banco local
      console.log(`Usuário ${email} existe no Supabase mas não no banco local. Criando...`);
      
      // Obter dados do usuário do Supabase
      const { data: userData } = await supabase.auth.admin.getUserById(authData.user.id);
      
      // Determinar o papel do usuário a partir dos metadados do Supabase
      const role = userData.user.user_metadata?.role || 'Client';
      
      // Criar usuário no banco local
      const hashedPassword = await generateHashPassword(password);
      
      const newUser = await prisma.user.create({
        data: {
          name: userData.user.user_metadata?.name || email.split('@')[0],
          email: email,
          phone: userData.user.user_metadata?.phone || null,
          avatar: userData.user.user_metadata?.avatar || null,
          hashed_password: hashedPassword,
          role: role
        }
      });
      
      console.log(`Usuário ${email} criado no banco local com ID ${newUser.id}`);
      
      // Gerar token JWT
      const token = jwt.sign(
        { user_id: newUser.id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );
      
      return {
        message: 'Login successful (user synchronized from Supabase)',
        token,
        user: {
          id: newUser.id,
          role: newUser.role,
          supabase_id: authData.user.id
        }
      };
    }
    
    // 3. Se o usuário existe no banco local, gerar token JWT
    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    
    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        role: user.role,
        supabase_id: authData.user.id
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Registra um novo usuário usando Supabase
 * @param {Object} userData - Dados do usuário a ser registrado
 * @returns {Object} - Usuário registrado
 * @throws {Error} - Erro ao registrar usuário
 */
async function registerWithSupabase(userData) {
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
        role: userData.role || 'Client'
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
 * Recupera senha de usuário usando Supabase
 * @param {string} email - Email do usuário
 * @returns {boolean} - True se o email de recuperação foi enviado
 * @throws {Error} - Erro ao recuperar senha
 */
async function recoverPasswordWithSupabase(email) {
  try {
    // 1. Verificar se o usuário existe no Supabase
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Erro ao buscar usuários no Supabase:', fetchError);
      throw new Error('Erro ao acessar banco de dados Supabase');
    }
    
    const existingUser = users.users.find(u => u.email === email);
    
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }
    
    // 2. Enviar email de recuperação de senha
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });
    
    if (resetError) {
      console.error('Erro ao enviar email de recuperação:', resetError);
      throw new Error(`Erro ao enviar email de recuperação: ${resetError.message}`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza senha de usuário usando Supabase
 * @param {string} email - Email do usuário
 * @param {string} password - Nova senha
 * @returns {boolean} - True se a senha foi atualizada
 * @throws {Error} - Erro ao atualizar senha
 */
async function updatePasswordWithSupabase(email, password) {
  try {
    // 1. Buscar usuário no Supabase
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Erro ao buscar usuários no Supabase:', fetchError);
      throw new Error('Erro ao acessar banco de dados Supabase');
    }
    
    const supabaseUser = users.users.find(u => u.email === email);
    
    if (!supabaseUser) {
      throw new Error('Usuário não encontrado no Supabase');
    }
    
    // 2. Buscar usuário no banco local
    const backendUser = await prisma.user.findFirst({
      where: { email }
    });
    
    if (!backendUser) {
      throw new Error('Usuário não encontrado no banco local');
    }
    
    // 3. Atualizar senha no Supabase
    const { error: supabaseUpdateError } = await supabase.auth.admin.updateUserById(
      supabaseUser.id,
      { password: password }
    );
    
    if (supabaseUpdateError) {
      console.error('Erro ao atualizar senha no Supabase:', supabaseUpdateError);
      
      // Verificar se é o erro de senha igual
      if (supabaseUpdateError.message.includes('different from the old password')) {
        throw new Error('A nova senha deve ser diferente da senha antiga');
      }
      
      throw new Error(`Erro ao atualizar senha no Supabase: ${supabaseUpdateError.message}`);
    }
    
    // 4. Atualizar senha no banco local
    const hashedPassword = await generateHashPassword(password);
    await prisma.user.update({
      where: { id: backendUser.id },
      data: { hashed_password: hashedPassword }
    });
    
    console.log(`Senha atualizada com sucesso para usuário: ${email} em ambos os sistemas`);
    
    return true;
  } catch (error) {
    throw error;
  }
}

export {
  loginWithSupabase,
  registerWithSupabase,
  recoverPasswordWithSupabase,
  updatePasswordWithSupabase
};