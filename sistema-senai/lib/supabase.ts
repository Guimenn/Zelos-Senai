import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configurações específicas para o chat
const SUPABASE_CONFIG = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

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
    
    supabaseInstance = createClient(url, key, SUPABASE_CONFIG)
  }
  
  return supabaseInstance
}

// Hook para usar o Supabase em componentes React
export function useSupabase() {
  return getSupabaseClient()
}

// Funções específicas para o chat
export const chatService = {
  // Criar canal de chat para um ticket específico
  createChatChannel: (ticketId: string, onMessage: (message: any) => void) => {
    const supabase = getSupabaseClient()
    
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        onMessage
      )
      .subscribe()

    return channel
  },

  // Remover canal de chat
  removeChatChannel: (channel: any) => {
    const supabase = getSupabaseClient()
    supabase.removeChannel(channel)
  },

  // Verificar se o Realtime está funcionando
  checkRealtimeStatus: async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('messages')
        .select('count')
        .limit(1)
      
      return !error
    } catch (error) {
      console.error('Erro ao verificar status do Realtime:', error)
      return false
    }
  }
}
