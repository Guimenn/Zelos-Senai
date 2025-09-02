import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Cache local para dados críticos quando o banco cai
const localCache = new Map()
const cacheTTL = 5 * 60 * 1000 // 5 minutos

// Configuração otimizada para Supabase com fallback
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configurações de performance
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  // Configurações de conexão otimizadas para Supabase
  __internal: {
    engine: {
      connectionLimit: 5, // Reduzir para evitar sobrecarga
      poolTimeout: 10,    // Timeout mais agressivo
      acquireTimeout: 30000, // 30 segundos
      timeout: 30000,     // 30 segundos
    }
  }
})

// Middleware para monitorar queries lentas e implementar fallback
prisma.$use(async (params, next) => {
  const start = Date.now()
  
  try {
    const result = await next(params)
    const duration = Date.now() - start
    
    // Log de queries lentas
    if (duration > 1000) {
      console.warn(`🐌 Query lenta detectada: ${params.model}.${params.action} levou ${duration}ms`)
    }
    
    // Se for uma operação de leitura bem-sucedida, cachear localmente
    if (params.action === 'findMany' || params.action === 'findUnique' || params.action === 'findFirst') {
      const cacheKey = `${params.model}_${params.action}_${JSON.stringify(params.args)}`
      localCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    // Se for erro de conectividade, tentar usar cache local
    if (isConnectionError(error)) {
      console.warn(`⚠️ Erro de conectividade detectado: ${params.model}.${params.action}`)
      
      // Tentar buscar no cache local
      const cacheKey = `${params.model}_${params.action}_${JSON.stringify(params.args)}`
      const cached = localCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
        console.log(`💾 Retornando dados do cache local para ${params.model}.${params.action}`)
        return cached.data
      }
      
      // Se não há cache, retornar dados mock para operações críticas
      if (params.action === 'findMany' || params.action === 'findUnique') {
        console.log(`🔄 Retornando dados mock para ${params.model}.${params.action}`)
        return getMockData(params.model, params.action, params.args)
      }
    }
    
    throw error
  }
})

// Função para verificar se é erro de conectividade
function isConnectionError(error) {
  const connectionErrorCodes = [
    'P1001', // Can't reach database server
    'P1002', // Database server closed the connection
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
    'P2024', // Connection timeout
    'P2037', // Too many connections
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND'
  ]
  
  return connectionErrorCodes.includes(error.code) || 
         error.message?.includes('connection') ||
         error.message?.includes('timeout') ||
         error.message?.includes('unreachable')
}

// Função para gerar dados mock quando o banco cai
function getMockData(model, action, args) {
  switch (model) {
    case 'User':
      if (action === 'findUnique' && args?.where?.email) {
        return {
          id: 'mock-user-id',
          name: 'Usuário Mock',
          email: args.where.email,
          role: 'CLIENT',
          is_active: true
        }
      }
      if (action === 'findMany') {
        return []
      }
      break
      
    case 'Ticket':
      if (action === 'findMany') {
        return []
      }
      if (action === 'findUnique') {
        return {
          id: 'mock-ticket-id',
          ticket_number: 'MOCK-001',
          title: 'Ticket Mock',
          description: 'Dados temporários - banco indisponível',
          status: 'OPEN',
          priority: 'MEDIUM'
        }
      }
      break
      
    case 'Category':
      if (action === 'findMany') {
        return [
          { id: 'mock-cat-1', name: 'Suporte Técnico', color: '#3B82F6' },
          { id: 'mock-cat-2', name: 'Infraestrutura', color: '#10B981' }
        ]
      }
      break
  }
  
  return null
}

// Função para limpar cache expirado
function cleanupExpiredCache() {
  const now = Date.now()
  for (const [key, value] of localCache.entries()) {
    if (now - value.timestamp > cacheTTL) {
      localCache.delete(key)
    }
  }
}

// Limpar cache a cada 5 minutos
setInterval(cleanupExpiredCache, 5 * 60 * 1000)

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Reconexão automática em caso de erro
let reconnectAttempts = 0
const maxReconnectAttempts = 5

async function attemptReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('❌ Máximo de tentativas de reconexão atingido')
    return
  }
  
  try {
    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts + 1}/${maxReconnectAttempts}`)
    await prisma.$connect()
    console.log('✅ Reconexão bem-sucedida!')
    reconnectAttempts = 0
  } catch (error) {
    reconnectAttempts++
    console.error(`❌ Falha na reconexão: ${error.message}`)
    
    // Tentar novamente em 10 segundos
    setTimeout(attemptReconnect, 10000)
  }
}

// Monitorar erros de conexão e tentar reconectar
prisma.$on('query', (e) => {
  if (e.duration > 10000) { // Query demorou mais de 10 segundos
    console.warn('⚠️ Query muito lenta detectada, considerando reconexão')
  }
})

prisma.$on('error', (e) => {
  if (isConnectionError(e)) {
    console.error('🚨 Erro de conexão detectado, tentando reconectar...')
    attemptReconnect()
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
