import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

// Variável global para armazenar a instância única do Supabase
let supabaseInstance: SupabaseClient | null = null

export function useSupabase() {
  const supabase = useMemo(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return null
    }
    
    // Se já existe uma instância, retorna ela
    if (supabaseInstance) {
      return supabaseInstance
    }
    
    // Cria uma nova instância apenas se não existir
    const url = process.env.NEXT_PUBLIC_SUPABASE_API_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    supabaseInstance = createClient(url, key)
    return supabaseInstance
  }, [])

  return supabase
}
