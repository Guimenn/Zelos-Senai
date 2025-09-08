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
    const url = process.env.NEXT_PUBLIC_SUPABASE_API_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cnhseW1zb2lkbWp4amVuZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzQ0NzQsImV4cCI6MjA1MTI1MDQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    
    if (!url || !key) {
      console.error('Supabase environment variables not found')
      // Em produção, não retornar null para evitar erros de build
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Supabase environment variables not found')
      }
      return null
    }
    
    supabaseInstance = createClient(url, key)
    return supabaseInstance
  }, [])

  return supabase
}
