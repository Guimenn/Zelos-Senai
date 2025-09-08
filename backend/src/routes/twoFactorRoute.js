/**
 * Rotas para autenticação de dois fatores
 * Suporta SMS e Email
 */

import express from 'express';
import { sendTwoFactorCode, verifyTwoFactorCode } from '../services/TwoFactorService.js';

const router = express.Router();

/**
 * Enviar código 2FA via Email
 * POST /api/2fa/send
 * Body: { email: 'string' }
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email é obrigatório',
        required: ['email']
      });
    }

    console.log(`🔄 [2FA API] Enviando código via email para ${email}`);

    const result = await sendTwoFactorCode(email);

    return res.status(200).json({
      message: result.message,
      method: 'email',
      contact: email,
      success: true
    });

  } catch (error) {
    console.error('❌ [2FA API] Erro ao enviar código:', error);
    
    let errorMessage = 'Erro ao enviar código de verificação';
    
    if (error.message.includes('rate limit')) {
      errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
    }

    return res.status(500).json({
      message: errorMessage,
      error: error.message
    });
  }
});

/**
 * Verificar código 2FA via Email
 * POST /api/2fa/verify
 * Body: { email: 'string', code: 'string' }
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Email e código são obrigatórios',
        required: ['email', 'code']
      });
    }

    console.log(`🔐 [2FA API] Verificando código via email para ${email}`);

    const result = await verifyTwoFactorCode(email, code);

    if (result.success) {
      return res.status(200).json({
        message: result.message,
        verified: true,
        method: 'email'
      });
    } else {
      return res.status(400).json({
        message: result.message,
        verified: false
      });
    }

  } catch (error) {
    console.error('❌ [2FA API] Erro ao verificar código:', error);
    
    return res.status(500).json({
      message: 'Erro ao verificar código',
      error: error.message
    });
  }
});

export default router;
