/**
 * Serviço de autenticação de dois fatores
 * Usa apenas Email via Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Supabase
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
 * Enviar código 2FA via Email
 */
async function sendEmailCode(email) {
  try {
    console.log(`📧 [2FA] Enviando email para: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        channel: "email",
      },
    });

    if (error) {
      console.error('❌ [2FA] Erro ao enviar email:', error);
      throw error;
    }

    console.log('✅ [2FA] Email enviado com sucesso');
    return { success: true, message: 'Código enviado via email' };

  } catch (error) {
    console.error('❌ [2FA] Erro geral ao enviar email:', error);
    throw error;
  }
}

/**
 * Verificar código Email
 */
async function verifyEmailCode(email, code) {
  try {
    console.log(`🔐 [2FA] Verificando código email: ${email}`);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('❌ [2FA] Erro na verificação email:', error);
      return { success: false, message: error.message };
    }

    console.log('✅ [2FA] Código email verificado com sucesso');
    return { success: true, message: 'Código verificado com sucesso' };

  } catch (error) {
    console.error('❌ [2FA] Erro geral na verificação email:', error);
    return { success: false, message: 'Erro na verificação' };
  }
}

/**
 * Enviar código 2FA via Email (função principal)
 */
async function sendTwoFactorCode(email) {
  try {
    return await sendEmailCode(email);
  } catch (error) {
    console.error(`❌ [2FA] Erro ao enviar código via email:`, error);
    throw error;
  }
}

/**
 * Verificar código 2FA via Email (função principal)
 */
async function verifyTwoFactorCode(email, code) {
  try {
    return await verifyEmailCode(email, code);
  } catch (error) {
    console.error(`❌ [2FA] Erro ao verificar código via email:`, error);
    throw error;
  }
}

export { 
  sendTwoFactorCode, 
  verifyTwoFactorCode
};