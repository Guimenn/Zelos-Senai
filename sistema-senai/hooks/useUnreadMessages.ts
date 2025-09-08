'use client'

import { useState, useEffect, useCallback } from 'react'
import { authCookies } from '../utils/cookies'

interface UnreadMessagesData {
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => void
  markAsRead: () => void
}

export function useUnreadMessages(ticketId: string): UnreadMessagesData {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false) // Mudado para false inicial
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const fetchUnreadCount = useCallback(async (force = false) => {
    try {
      // Evitar requisições muito frequentes (cache de 5 segundos)
      const now = Date.now()
      if (!force && (now - lastFetch) < 5000) {
        return
      }

      setIsLoading(true)
      setError(null)

      const token = authCookies.getToken()
      
      if (!token) {
        setUnreadCount(0)
        setIsLoading(false)
        return
      }

      // Obter última visualização do localStorage
      const lastViewedKey = `chat_last_viewed_${ticketId}`
      const lastViewed = localStorage.getItem(lastViewedKey)
      const lastViewedTime = lastViewed ? new Date(lastViewed) : new Date(0) // Se não há registro, usar data muito antiga

      const response = await fetch(`/api/messages/unread-count?ticket_id=${ticketId}&since=${lastViewedTime.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Se for erro 403, pode ser problema de permissão - não mostrar erro
        if (response.status === 403) {
          setUnreadCount(0)
          setIsLoading(false)
          return
        }
        
        const errorText = await response.text()
        throw new Error(`Erro ao buscar mensagens não lidas: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const count = data.unread_count || 0
      console.log('🔍 useUnreadMessages - Contador atualizado:', count, 'para ticket:', ticketId)
      setUnreadCount(count)
      setLastFetch(now)
      setIsInitialized(true)
      
      // Salvar no cache
      const cacheKey = `unread_count_cache_${ticketId}`
      localStorage.setItem(cacheKey, JSON.stringify({
        count,
        timestamp: now
      }))
    } catch (err) {
      console.error('❌ useUnreadMessages - Erro ao buscar mensagens não lidas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [ticketId, lastFetch])

  const refresh = useCallback(() => {
    fetchUnreadCount(true) // Forçar atualização
  }, [fetchUnreadCount])

  const markAsRead = useCallback(() => {
    console.log('🔍 useUnreadMessages - Marcando mensagens como lidas para ticket:', ticketId)
    
    // Salvar timestamp da última visualização no localStorage
    const lastViewedKey = `chat_last_viewed_${ticketId}`
    const now = new Date().toISOString()
    localStorage.setItem(lastViewedKey, now)
    
    // Limpar o contador local imediatamente
    setUnreadCount(0)
    
    // Limpar o cache também
    const cacheKey = `unread_count_cache_${ticketId}`
    localStorage.setItem(cacheKey, JSON.stringify({
      count: 0,
      timestamp: Date.now()
    }))
  }, [ticketId])

  useEffect(() => {
    // Tentar carregar do cache primeiro
    const cacheKey = `unread_count_cache_${ticketId}`
    const cachedData = localStorage.getItem(cacheKey)
    
    if (cachedData) {
      try {
        const { count, timestamp } = JSON.parse(cachedData)
        const cacheAge = Date.now() - timestamp
        
        // Se o cache tem menos de 30 segundos, usar ele
        if (cacheAge < 30000) {
          setUnreadCount(count)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Erro ao ler cache:', error)
      }
    }

    // Carregar dados atualizados
    fetchUnreadCount(true)

    // Atualizar a cada 10 segundos (mais frequente)
    const interval = setInterval(() => fetchUnreadCount(false), 10000)

    return () => clearInterval(interval)
  }, [fetchUnreadCount, ticketId])

  return {
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead
  }
}
