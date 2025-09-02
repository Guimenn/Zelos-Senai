// Sistema de retry ultra-robusto com fallbacks múltiplos
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 5,
    baseDelay = 500,
    maxDelay = 5000,
    backoffMultiplier = 1.5,
    jitter = 0.2,
    fallbackFn = null,
    mockData = null
  } = options
  
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Se for o último tentativa, não esperar
      if (attempt === maxRetries) {
        console.error(`❌ Falha após ${maxRetries + 1} tentativas:`, error.message)
        
        // Tentar fallback se disponível
        if (fallbackFn) {
          try {
            console.log('🔄 Tentando função de fallback...')
            return await fallbackFn()
          } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError.message)
          }
        }
        
        // Retornar dados mock se disponível
        if (mockData) {
          console.log('🔄 Retornando dados mock como último recurso')
          return mockData
        }
        
        throw error
      }
      
      // Verificar se o erro é recuperável
      if (!isRetryableError(error)) {
        console.error(`❌ Erro não recuperável:`, error.message)
        throw error
      }
      
      // Calcular delay com backoff exponencial
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      )
      
      // Adicionar jitter para evitar thundering herd
      const jitterAmount = delay * jitter * Math.random()
      const finalDelay = delay + jitterAmount
      
      console.warn(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente em ${Math.round(finalDelay)}ms:`, error.message)
      
      // Aguardar antes da próxima tentativa
      await sleep(finalDelay)
    }
  }
  
  throw lastError
}

// Função para verificar se o erro é recuperável
function isRetryableError(error) {
  // Erros de conectividade do Prisma
  const retryablePrismaErrors = [
    'P1001', // Can't reach database server
    'P1002', // Database server closed the connection
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
    'P2024', // Connection timeout
    'P2025', // Record not found (às vezes é temporário)
    'P2034', // Transaction failed due to a write conflict
    'P2037', // Too many connections
  ]
  
  // Erros de rede
  const retryableNetworkErrors = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNABORTED'
  ]
  
  // Verificar se é erro do Prisma
  if (error.code && retryablePrismaErrors.includes(error.code)) {
    return true
  }
  
  // Verificar se é erro de rede
  if (error.code && retryableNetworkErrors.includes(error.code)) {
    return true
  }
  
  // Verificar mensagens de erro específicas
  const errorMessage = error.message?.toLowerCase() || ''
  const retryableMessages = [
    'connection',
    'timeout',
    'network',
    'temporary',
    'unavailable',
    'busy',
    'locked',
    'pool',
    'supabase'
  ]
  
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Wrapper específico para operações do Prisma com fallback automático
export const withPrismaRetry = async (prismaOperation, options = {}) => {
  return withRetry(prismaOperation, {
    maxRetries: 3,
    baseDelay: 300,
    maxDelay: 3000,
    backoffMultiplier: 1.3,
    ...options
  })
}

// Wrapper para operações de leitura (mais tolerante)
export const withReadRetry = async (readOperation, options = {}) => {
  return withRetry(readOperation, {
    maxRetries: 2,
    baseDelay: 200,
    maxDelay: 1500,
    backoffMultiplier: 1.2,
    ...options
  })
}

// Wrapper para operações de escrita (menos tolerante)
export const withWriteRetry = async (writeOperation, options = {}) => {
  return withRetry(writeOperation, {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 2000,
    backoffMultiplier: 2,
    ...options
  })
}

// Função para retry com fallback múltiplo
export const withMultiFallback = async (primaryFn, fallbacks = [], options = {}) => {
  try {
    return await withRetry(primaryFn, options)
  } catch (error) {
    console.warn(`⚠️ Operação primária falhou, tentando fallbacks:`, error.message)
    
    // Tentar cada fallback em sequência
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        console.log(`🔄 Tentando fallback ${i + 1}/${fallbacks.length}...`)
        return await fallbacks[i]()
      } catch (fallbackError) {
        console.warn(`⚠️ Fallback ${i + 1} falhou:`, fallbackError.message)
        
        // Se for o último fallback, lançar erro
        if (i === fallbacks.length - 1) {
          console.error('❌ Todos os fallbacks falharam')
          throw fallbackError
        }
      }
    }
  }
}

// Função para retry com cache e fallback
export const withCachedRetry = async (fn, cacheKey, cacheDuration = 300000, options = {}) => {
  // Verificar cache primeiro
  const cached = await getFromCache(cacheKey)
  if (cached) {
    return cached
  }
  
  try {
    const result = await withRetry(fn, options)
    
    // Salvar no cache
    await setCache(cacheKey, result, cacheDuration)
    
    return result
  } catch (error) {
    // Se falhar, tentar retornar cache expirado
    const expiredCache = await getExpiredCache(cacheKey)
    if (expiredCache) {
      console.warn(`⚠️ Retornando cache expirado para ${cacheKey}`)
      return expiredCache
    }
    
    throw error
  }
}

// Função para operações críticas com fallback para dados mock
export const withCriticalFallback = async (operation, mockData, options = {}) => {
  return withRetry(operation, {
    ...options,
    fallbackFn: () => Promise.resolve(mockData),
    mockData: mockData
  })
}

// Função para operações de usuário com fallback para dados básicos
export const withUserFallback = async (operation, options = {}) => {
  const userMockData = {
    id: 'fallback-user',
    name: 'Usuário Temporário',
    email: 'temp@example.com',
    role: 'CLIENT',
    is_active: true
  }
  
  return withCriticalFallback(operation, userMockData, options)
}

// Função para operações de tickets com fallback para lista vazia
export const withTicketFallback = async (operation, options = {}) => {
  return withCriticalFallback(operation, [], options)
}

// Função para operações de categorias com fallback para categorias básicas
export const withCategoryFallback = async (operation, options = {}) => {
  const categoryMockData = [
    { id: 'fallback-1', name: 'Suporte Geral', color: '#3B82F6' },
    { id: 'fallback-2', name: 'Técnico', color: '#10B981' }
  ]
  
  return withCriticalFallback(operation, categoryMockData, options)
}

// Funções auxiliares de cache (implementar conforme necessário)
async function getFromCache(key) {
  // Implementar lógica de cache
  return null
}

async function setCache(key, value, duration) {
  // Implementar lógica de cache
}

async function getExpiredCache(key) {
  // Implementar lógica de cache expirado
  return null
}

export default {
  withRetry,
  withPrismaRetry,
  withReadRetry,
  withWriteRetry,
  withMultiFallback,
  withCachedRetry,
  withCriticalFallback,
  withUserFallback,
  withTicketFallback,
  withCategoryFallback
}
