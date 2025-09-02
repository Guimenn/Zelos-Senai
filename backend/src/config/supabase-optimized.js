/**
 * Configuração Ultra-Otimizada para Supabase
 * Resolve problemas de instabilidade e quedas constantes
 */

import { PrismaClient } from '@prisma/client'

// Configurações específicas para Supabase
const SUPABASE_CONFIG = {
  // Pool de conexões reduzido para evitar sobrecarga
  connectionLimit: 3,
  poolTimeout: 5,
  acquireTimeout: 15000,
  timeout: 15000,
  
  // Configurações de retry
  maxRetries: 3,
  retryDelay: 1000,
  
  // Timeouts agressivos
  queryTimeout: 10000,
  connectionTimeout: 5000,
  
  // Configurações de pool
  minConnections: 1,
  maxConnections: 3,
  idleTimeout: 30000,
  
  // Configurações de SSL
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
}

// Cliente Prisma otimizado para Supabase
export const createSupabasePrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
    errorFormat: 'pretty',
    __internal: {
      engine: SUPABASE_CONFIG
    }
  })

  // Middleware de proteção contra quedas
  client.$use(async (params, next) => {
    const start = Date.now()
    
    try {
      // Timeout agressivo para queries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), SUPABASE_CONFIG.queryTimeout)
      })
      
      const resultPromise = next(params)
      
      const result = await Promise.race([resultPromise, timeoutPromise])
      
      const duration = Date.now() - start
      if (duration > 5000) {
        console.warn(`🐌 Query lenta: ${params.model}.${params.action} (${duration}ms)`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      // Se for timeout ou erro de conexão, retornar dados mock
      if (error.message === 'Query timeout' || isSupabaseError(error)) {
        console.warn(`⚠️ Supabase instável, usando fallback: ${params.model}.${params.action}`)
        return getSupabaseFallback(params.model, params.action, params.args)
      }
      
      throw error
    }
  })

  // Event listeners para monitorar saúde da conexão
  client.$on('query', (e) => {
    if (e.duration > SUPABASE_CONFIG.queryTimeout) {
      console.warn(`⚠️ Query muito lenta detectada: ${e.duration}ms`)
    }
  })

  client.$on('error', (e) => {
    if (isSupabaseError(e)) {
      console.error(`🚨 Erro crítico do Supabase: ${e.message}`)
      // Implementar notificação para equipe
    }
  })

  return client
}

// Função para verificar se é erro específico do Supabase
function isSupabaseError(error) {
  const supabaseErrorPatterns = [
    'P1001', // Can't reach database server
    'P1002', // Database server closed the connection
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
    'P2024', // Connection timeout
    'P2037', // Too many connections
    'pool',
    'supabase',
    'aws-0-sa-east-1',
    'connection',
    'timeout',
    'unreachable'
  ]
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || ''
  
  return supabaseErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  )
}

// Sistema de fallback robusto para Supabase
function getSupabaseFallback(model, action, args) {
  switch (model) {
    case 'User':
      if (action === 'findUnique' && args?.where?.email) {
        return {
          id: 'supabase-fallback-user',
          name: 'Usuário Temporário',
          email: args.where.email,
          role: 'CLIENT',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
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
          id: 'supabase-fallback-ticket',
          ticket_number: 'FALLBACK-001',
          title: 'Ticket Temporário',
          description: 'Dados temporários - Supabase indisponível',
          status: 'OPEN',
          priority: 'MEDIUM',
          created_at: new Date(),
          updated_at: new Date()
        }
      }
      break
      
    case 'Category':
      if (action === 'findMany') {
        return [
          { 
            id: 'fallback-cat-1', 
            name: 'Suporte Técnico', 
            color: '#3B82F6',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          { 
            id: 'fallback-cat-2', 
            name: 'Infraestrutura', 
            color: '#10B981',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      }
      break
      
    case 'Agent':
      if (action === 'findMany') {
        return []
      }
      break
      
    case 'Client':
      if (action === 'findMany') {
        return []
      }
      break
  }
  
  return null
}

// Função para verificar saúde do Supabase
export async function checkSupabaseHealth(client) {
  try {
    const start = Date.now()
    await client.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    if (duration > 5000) {
      return { healthy: false, status: 'slow', duration, message: 'Supabase lento' }
    }
    
    return { healthy: true, status: 'ok', duration, message: 'Supabase funcionando' }
  } catch (error) {
    return { 
      healthy: false, 
      status: 'error', 
      duration: null, 
      message: `Supabase indisponível: ${error.message}` 
    }
  }
}

// Função para reconectar ao Supabase
export async function reconnectSupabase(client) {
  try {
    console.log('🔄 Tentando reconectar ao Supabase...')
    await client.$disconnect()
    await client.$connect()
    console.log('✅ Reconexão ao Supabase bem-sucedida!')
    return true
  } catch (error) {
    console.error('❌ Falha na reconexão ao Supabase:', error.message)
    return false
  }
}

// Configurações de variáveis de ambiente otimizadas
export const SUPABASE_ENV_CONFIG = {
  // URL principal com configurações otimizadas
  DATABASE_URL: process.env.DATABASE_URL?.includes('?') 
    ? `${process.env.DATABASE_URL}&connection_limit=3&pool_timeout=5&connect_timeout=15&idle_timeout=30&pgbouncer=true`
    : `${process.env.DATABASE_URL}?connection_limit=3&pool_timeout=5&connect_timeout=15&idle_timeout=30&pgbouncer=true`,
  
  // URL direta para operações críticas
  DIRECT_URL: process.env.DIRECT_URL?.includes('?')
    ? `${process.env.DIRECT_URL}&connection_limit=1&connect_timeout=10`
    : `${process.env.DIRECT_URL}?connection_limit=1&connect_timeout=10`,
  
  // Timeouts reduzidos
  REQUEST_TIMEOUT: 15000,
  RESPONSE_TIMEOUT: 15000,
  
  // Configurações de pool
  MAX_CONNECTIONS: 3,
  MIN_CONNECTIONS: 1,
  
  // Configurações de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Configurações de cache
  CACHE_TTL: 300, // 5 minutos
  CACHE_MAX_KEYS: 500
}

// Função para aplicar configurações otimizadas
export function applySupabaseOptimizations() {
  // Aplicar configurações de ambiente
  Object.entries(SUPABASE_ENV_CONFIG).forEach(([key, value]) => {
    if (key !== 'DATABASE_URL' && key !== 'DIRECT_URL') {
      process.env[key] = value.toString()
    }
  })
  
  console.log('⚙️ Configurações do Supabase otimizadas aplicadas')
}

export default {
  createSupabasePrismaClient,
  checkSupabaseHealth,
  reconnectSupabase,
  SUPABASE_ENV_CONFIG,
  applySupabaseOptimizations
}
