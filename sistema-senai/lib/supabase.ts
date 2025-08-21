import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variável global para armazenar a instância única do Supabase
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_API_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.warn('Supabase environment variables not found')
      throw new Error('Supabase environment variables not found')
    }
    
    supabaseInstance = createClient(url, key)
  }
  
  return supabaseInstance
}

// Hook para usar o Supabase em componentes React
export function useSupabase() {
  return getSupabaseClient()
}
