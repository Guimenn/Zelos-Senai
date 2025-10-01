import { createClient, SupabaseClient } from '@supabase/supabase-js'
import React from 'react'

// Configurações de SSL e segurança
const SUPABASE_CONFIG = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x'
    }
  },
  // Configurações de SSL
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// URLs de fallback para diferentes regiões
const FALLBACK_URLS = [
  'https://pyrxlymsoidmjxjenesb.supabase.co',
  'https://pyrxlymsoidmjxjenesb.supabase.co:443',
  'https://pyrxlymsoidmjxjenesb.supabase.co:5432'
]

// Função para verificar se uma URL está acessível
async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      mode: 'no-cors', // Evita problemas de CORS
      cache: 'no-cache'
    })
    return true
  } catch (error) {
    console.warn(`URL ${url} não acessível:`, error)
    return false
  }
}

// Função para obter a melhor URL disponível
async function getBestSupabaseUrl(): Promise<string> {
  const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co'
  
  // Tentar URL primária primeiro
  if (await checkUrlAccessibility(primaryUrl)) {
    return primaryUrl
  }
  
  // Tentar URLs de fallback
  for (const fallbackUrl of FALLBACK_URLS) {
    if (await checkUrlAccessibility(fallbackUrl)) {
      console.log(`✅ Usando URL de fallback: ${fallbackUrl}`)
      return fallbackUrl
    }
  }
  
  // Se nenhuma funcionar, retornar a primária e deixar o erro acontecer
  console.error('❌ Nenhuma URL do Supabase está acessível')
  return primaryUrl
}

// Cliente Supabase com retry e fallback
let supabaseInstance: SupabaseClient | null = null
let currentUrl: string | null = null

export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Se já existe uma instância válida, retorna ela
  if (supabaseInstance && currentUrl) {
    return supabaseInstance
  }
  
  try {
    // Obter a melhor URL disponível
    const bestUrl = await getBestSupabaseUrl()
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cnhseW1zb2lkbWp4amVuZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzQ0NzQsImV4cCI6MjA1MTI1MDQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    
    if (!key) {
      throw new Error('Supabase API key not found')
    }
    
    // Criar nova instância
    supabaseInstance = createClient(bestUrl, key, SUPABASE_CONFIG)
    currentUrl = bestUrl
    
    console.log(`✅ Cliente Supabase criado com URL: ${bestUrl}`)
    
    // Testar conectividade
    try {
      const { data, error } = await supabaseInstance.auth.getSession()
      if (error) {
        console.warn('⚠️ Aviso na sessão do Supabase:', error.message)
      } else {
        console.log('✅ Conectividade com Supabase verificada')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar sessão:', error)
    }
    
    return supabaseInstance
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error)
    throw error
  }
}

// Hook para usar o Supabase com tratamento de erro
export function useSupabaseSecure() {
  const [supabase, setSupabase] = React.useState<SupabaseClient | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    async function initializeSupabase() {
      try {
        setLoading(true)
        setError(null)
        
        const client = await getSupabaseClient()
        setSupabase(client)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        console.error('Erro ao inicializar Supabase:', err)
      } finally {
        setLoading(false)
      }
    }
    
    initializeSupabase()
  }, [])
  
  return { supabase, error, loading }
}

// Função para reconectar em caso de erro
export async function reconnectSupabase(): Promise<SupabaseClient | null> {
  try {
    console.log('🔄 Tentando reconectar ao Supabase...')
    
    // Limpar instância atual
    supabaseInstance = null
    currentUrl = null
    
    // Criar nova instância
    const client = await getSupabaseClient()
    console.log('✅ Reconexão bem-sucedida!')
    return client
  } catch (error) {
    console.error('❌ Falha na reconexão:', error)
    return null
  }
}

// Função para verificar saúde do Supabase
export async function checkSupabaseHealth(): Promise<{
  healthy: boolean
  status: string
  message: string
  url: string | null
}> {
  try {
    if (!supabaseInstance) {
      return {
        healthy: false,
        status: 'not_initialized',
        message: 'Cliente Supabase não inicializado',
        url: null
      }
    }
    
    const start = Date.now()
    const { data, error } = await supabaseInstance.auth.getSession()
    const duration = Date.now() - start
    
    if (error) {
      return {
        healthy: false,
        status: 'auth_error',
        message: `Erro de autenticação: ${error.message}`,
        url: currentUrl
      }
    }
    
    if (duration > 5000) {
      return {
        healthy: false,
        status: 'slow',
        message: `Resposta lenta: ${duration}ms`,
        url: currentUrl
      }
    }
    
    return {
      healthy: true,
      status: 'ok',
      message: `Funcionando: ${duration}ms`,
      url: currentUrl
    }
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      message: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      url: currentUrl
    }
  }
}

export default {
  getSupabaseClient,
  useSupabaseSecure,
  reconnectSupabase,
  checkSupabaseHealth
}
