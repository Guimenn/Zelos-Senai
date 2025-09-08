/**
 * Middleware para sincronização automática com Supabase
 * Intercepta operações de usuários e sincroniza automaticamente
 */

import { syncUserAsync } from '../services/SupabaseSyncService.js';

/**
 * Middleware para interceptar criação de usuários
 */
function supabaseSyncMiddleware(req, res, next) {
  // Interceptar resposta de criação de usuário
  const originalSend = res.send;
  
  res.send = function(data) {
    // Verificar se é uma resposta de sucesso de criação de usuário
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Verificar se é uma resposta de criação de usuário
        if (responseData.user || responseData.message?.includes('criado') || responseData.message?.includes('created')) {
          console.log('🔄 [MIDDLEWARE] Interceptando criação de usuário para sincronização');
          
          // Sincronizar com Supabase de forma assíncrona
          if (responseData.user) {
            syncUserAsync(responseData.user, 'create');
          }
        }
      } catch (error) {
        console.error('❌ [MIDDLEWARE] Erro ao processar resposta:', error);
      }
    }
    
    // Chamar o método original
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Middleware específico para rotas de usuários
 */
function userSyncMiddleware(req, res, next) {
  // Interceptar requisições POST e PUT em rotas de usuários
  if ((req.method === 'POST' || req.method === 'PUT') && req.path.includes('/user')) {
    console.log(`🔄 [MIDDLEWARE] Interceptando ${req.method} em ${req.path}`);
    
    // Interceptar resposta
    const originalSend = res.send;
    
    res.send = function(data) {
      // Verificar se é uma resposta de sucesso
      if (res.statusCode === 200 || res.statusCode === 201) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          
          // Verificar se contém dados de usuário
          if (responseData.user) {
            const operation = req.method === 'POST' ? 'create' : 'update';
            console.log(`🔄 [MIDDLEWARE] Sincronizando usuário: ${responseData.user.email} (${operation})`);
            syncUserAsync(responseData.user, operation);
          }
        } catch (error) {
          console.error('❌ [MIDDLEWARE] Erro ao processar resposta de usuário:', error);
        }
      }
      
      // Chamar o método original
      originalSend.call(this, data);
    };
  }
  
  next();
}

export { supabaseSyncMiddleware, userSyncMiddleware };
