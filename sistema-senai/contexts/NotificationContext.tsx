'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { getToken } from '../utils/tokenManager'

interface NotificationContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  updateUnreadCount: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const lastUpdateRef = useRef<number>(0)
  const isUpdatingRef = useRef<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPageVisibleRef = useRef<boolean>(true)
  const hasInitializedRef = useRef<boolean>(false)

  // Função para atualizar a contagem de notificações não lidas com cache mais agressivo
  const updateUnreadCount = async (force: boolean = false) => {
    try {
      // Evitar múltiplas requisições simultâneas
      if (isUpdatingRef.current && !force) return
      
      // Cache mais longo: 5 minutos para evitar requisições desnecessárias
      const now = Date.now()
      if (!force && now - lastUpdateRef.current < 300000) return // 5 minutos
      
      // Não fazer requisições se a página não estiver visível
      if (!isPageVisibleRef.current && !force) return

      // Verificar token apenas uma vez e armazenar em cache
      const token = typeof window !== 'undefined' ? getToken() : null
      if (!token) {
        // Se não há token, define contagem como 0 e para as atualizações
        setUnreadCount(0)
        return
      }
      
      isUpdatingRef.current = true
      
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        // Se a resposta não for ok (401, 403, etc.), para as atualizações
        if (res.status === 401 || res.status === 403) {
          setUnreadCount(0)
          return
        }
        return
      }
      
      const data = await res.json()
      if (typeof data?.unread_count === 'number') {
        setUnreadCount(data.unread_count)
        lastUpdateRef.current = now
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error)
      // Em caso de erro, para as atualizações
      setUnreadCount(0)
    } finally {
      isUpdatingRef.current = false
    }
  }

  // Função para marcar uma notificação como lida
  const markAsRead = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? getToken() : null
      if (!token) return
      
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.ok) {
        // Atualiza a contagem imediatamente após marcar como lida
        updateUnreadCount(true)
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    try {
      const token = typeof window !== 'undefined' ? getToken() : null
      if (!token) return
      
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.ok) {
        // Define a contagem como zero imediatamente
        setUnreadCount(0)
        lastUpdateRef.current = Date.now()
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error)
    }
  }

  // Função para iniciar o intervalo de atualização
  const startUpdateInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Verificar se há token antes de iniciar o intervalo
    const token = typeof window !== 'undefined' ? getToken() : null
    if (!token) return
    
    // Intervalo muito mais longo: 5 minutos em vez de 2 minutos
    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        updateUnreadCount()
      }
    }, 300000) // 5 minutos
  }

  // Função para parar o intervalo de atualização
  const stopUpdateInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Carrega a contagem inicial e configura eventos para otimizar as atualizações
  useEffect(() => {
    // Evitar inicialização múltipla
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    // Verificar se há token antes de fazer carregamento inicial
    const token = typeof window !== 'undefined' ? getToken() : null
    if (token) {
      // Carregamento inicial apenas uma vez
      updateUnreadCount(true)
      
      // Inicia o intervalo de atualização
      startUpdateInterval()
    }
    
    // Configura um evento para atualizar quando a página receber foco
    const handleFocus = () => {
      isPageVisibleRef.current = true
      const token = typeof window !== 'undefined' ? getToken() : null
      if (token) {
        updateUnreadCount(true) // Força atualização quando volta ao foco
        startUpdateInterval()
      }
    }
    
    // Configura um evento para atualizar quando o usuário voltar para a página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isPageVisibleRef.current = true
        const token = typeof window !== 'undefined' ? getToken() : null
        if (token) {
          updateUnreadCount(true) // Força atualização quando volta a ficar visível
          startUpdateInterval()
        }
      } else {
        isPageVisibleRef.current = false
        stopUpdateInterval() // Para o intervalo quando a página não está visível
      }
    }
    
    // Configura um evento personalizado para atualizar a contagem
    const handleNotificationUpdate = () => {
      const token = typeof window !== 'undefined' ? getToken() : null
      if (token) {
        updateUnreadCount(true)
      }
    }
    
    // Evento para quando o usuário interage com a página (menos frequente)
    const handleUserInteraction = () => {
      // Atualiza após interação do usuário apenas se passou tempo suficiente
      if (isPageVisibleRef.current && Date.now() - lastUpdateRef.current > 60000) {
        const token = typeof window !== 'undefined' ? getToken() : null
        if (token) {
          updateUnreadCount()
        }
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('notification-update', handleNotificationUpdate)
    
    // Adiciona listeners para interação do usuário (menos frequente)
    document.addEventListener('click', handleUserInteraction, { passive: true })
    document.addEventListener('keydown', handleUserInteraction, { passive: true })
    
    return () => {
      stopUpdateInterval()
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('notification-update', handleNotificationUpdate)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount, 
        setUnreadCount, 
        updateUnreadCount,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}