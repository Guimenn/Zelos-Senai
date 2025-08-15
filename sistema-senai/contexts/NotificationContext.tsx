'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { authCookies } from '../utils/cookies'

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

  // Função para atualizar a contagem de notificações não lidas
  const updateUnreadCount = async () => {
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      
      const res = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) return
      
      const data = await res.json()
      if (typeof data?.unread_count === 'number') {
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error)
    }
  }

  // Função para marcar uma notificação como lida
  const markAsRead = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      
      const res = await fetch(`http://localhost:3001/api/notifications/${id}/mark-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.ok) {
        // Atualiza a contagem imediatamente após marcar como lida
        updateUnreadCount()
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      
      const res = await fetch('http://localhost:3001/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.ok) {
        // Define a contagem como zero imediatamente
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error)
    }
  }

  // Carrega a contagem inicial e configura um intervalo para atualizações
  useEffect(() => {
    updateUnreadCount()
    
    // Atualiza a cada 5 segundos (mais frequente para melhor experiência do usuário)
    const interval = setInterval(() => {
      updateUnreadCount()
    }, 5000)
    
    // Configura um evento para atualizar quando a página receber foco
    const handleFocus = () => {
      updateUnreadCount()
    }
    
    // Configura um evento para atualizar quando o usuário voltar para a página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUnreadCount()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Configura um evento personalizado para atualizar a contagem
    const handleNotificationUpdate = () => {
      updateUnreadCount()
    }
    
    window.addEventListener('notification-update', handleNotificationUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('notification-update', handleNotificationUpdate)
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