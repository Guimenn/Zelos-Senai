import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variável global para armazenar a instância única do Supabase
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_API_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cnhseW1zb2lkbWp4amVuZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzQ0NzQsImV4cCI6MjA1MTI1MDQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    
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
