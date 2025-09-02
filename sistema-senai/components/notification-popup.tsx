'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useNotification } from '../contexts/NotificationContext'
import { getValidToken } from '../utils/tokenManager'
import { Notification } from '../types'
import { redirectToNotificationTarget } from '../utils/notificationRedirect'
import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaTrash,
  FaTimes,
  FaInfoCircle,
  FaExclamationCircle,
  FaRegBell,
  FaCheckDouble,
  FaSearch
} from 'react-icons/fa'

interface NotificationPopupProps {
  isOpen: boolean
  onClose: () => void
  notificationCount?: number
}

export default function NotificationPopup({ isOpen, onClose, notificationCount = 0 }: NotificationPopupProps) {
  const { theme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)

  const { updateUnreadCount } = useNotification()
  
  // Carregar notificações reais do backend
  useEffect(() => {
    const controller = new AbortController()
    let tokenCache: string | null = null
    
    async function loadNotifications() {
      try {
        // Cache do token para evitar múltiplas chamadas
        if (!tokenCache) {
          tokenCache = typeof window !== 'undefined' ? await getValidToken() : null
        }
        if (!tokenCache) return
        
        const res = await fetch('/api/notifications/my-notifications?limit=50', {
          headers: { 'Authorization': `Bearer ${tokenCache}` },
          signal: controller.signal
        })
        if (!res.ok) return
        const data = await res.json()
        const items = (data.notifications ?? data ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: (n.category as string) === 'success' ? 'success' : (n.category === 'warning' ? 'warning' : (n.category === 'error' ? 'error' : 'info')),
          isRead: !!n.is_read,
          date: new Date(n.created_at),
          category: (n.type || 'GENERAL').toString().toUpperCase(),
          metadata: n.metadata || {}
        })) as Notification[]
        setNotifications(items)
        
        // Atualiza a contagem global de notificações não lidas
        updateUnreadCount()
        // Dispara evento personalizado para atualizar a contagem em toda a aplicação
        window.dispatchEvent(new Event('notification-update'))
      } catch (_) {}
    }
    
    if (isOpen) {
      loadNotifications()
      
      // Adicionar um evento para recarregar os dados quando a janela receber foco (menos frequente)
      const handleFocus = () => {
        // Só recarrega se passou tempo suficiente
        setTimeout(() => {
          if (isOpen) {
            loadNotifications()
          }
        }, 1000)
      }
      window.addEventListener('focus', handleFocus)
      
      return () => {
        controller.abort()
        window.removeEventListener('focus', handleFocus)
      }
    }
    
    return () => controller.abort()
  }, [isOpen])

  // Fechar o popup quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(notification => !notification.isRead).length

  // Marcar notificação como lida
  const { markAsRead: markNotificationAsRead } = useNotification()
  
  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    try {
      await markNotificationAsRead(id)
      // Dispara evento personalizado para atualizar a contagem em toda a aplicação
      window.dispatchEvent(new Event('notification-update'))
    } catch (_) {}
  }

  // Marcar todas como lidas
  const { markAllAsRead: markAllNotificationsAsRead } = useNotification()
  
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    try {
      await markAllNotificationsAsRead()
      // Dispara evento personalizado para atualizar a contagem em toda a aplicação
      window.dispatchEvent(new Event('notification-update'))
    } catch (_) {}
  }

  // Excluir notificação
  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      const token = typeof window !== 'undefined' ? await getValidToken() : null
      if (!token) return
      await fetch(`/api/notifications/${id}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
      // Atualiza a contagem global de notificações não lidas
      updateUnreadCount()
      // Dispara evento personalizado para atualizar a contagem em toda a aplicação
      window.dispatchEvent(new Event('notification-update'))
    } catch (_) {}
    if (selectedNotification?.id === id) {
      setIsModalOpen(false)
    }
  }

  // Formatar tempo relativo
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 0) {
      return `${diffDay} ${diffDay === 1 ? 'dia' : 'dias'} atrás`
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hora' : 'horas'} atrás`
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'} atrás`
    } else {
      return 'Agora mesmo'
    }
  }

  // Obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />
      case 'error':
        return <FaExclamationCircle className="text-red-500" />
      default:
        return <FaInfoCircle className="text-blue-500" />
    }
  }

  // Obter cor de fundo baseada no tipo de notificação
  const getNotificationBackground = (type: string, theme: string) => {
    switch (type) {
      case 'success':
        return theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'
      case 'warning':
        return theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'
      case 'error':
        return theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
      default:
        return theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
    }
  }

  // Função para abrir o modal com detalhes da notificação
  const openNotificationDetails = (notification: Notification) => {
    markAsRead(notification.id)
    
    // Tentar redirecionar baseado no tipo de notificação
    const wasRedirected = redirectToNotificationTarget(notification, onClose)
    
    // Se não foi redirecionado, mostrar modal com detalhes
    if (!wasRedirected) {
      setSelectedNotification(notification)
      setIsModalOpen(true)
    }
  }

  // Filtrar notificações
  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'all') return true
      if (filter === 'unread') return !notification.isRead
      return notification.type === filter
    })
    .filter(notification =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // Componente de modal para detalhes da notificação
  const NotificationModal = () => {
    if (!selectedNotification) return null

    return (
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        transition-opacity duration-300 ease-in-out
      `}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
        
        <div className={`
          relative w-full max-w-md p-6 rounded-xl shadow-xl transform transition-all duration-300
          ${isModalOpen ? 'scale-100' : 'scale-95'}
          ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getNotificationIcon(selectedNotification.type)}
              <h3 className={`ml-2 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {selectedNotification.title}
              </h3>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className={`p-3 rounded-lg mb-4 ${getNotificationBackground(selectedNotification.type, theme || 'light')}`}>
            <p>{selectedNotification.message}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <FaCalendarAlt className="inline mr-1" />
              {formatRelativeTime(selectedNotification.date)}
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => deleteNotification(selectedNotification.id)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                <FaTrash />
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        ref={popupRef}
        className={`
          fixed right-4 top-16 z-50 w-80 sm:w-96 rounded-xl shadow-xl transform transition-all duration-300
          ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
          max-h-[80vh] overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Notificações
            </h3>
            <button 
              onClick={onClose}
              className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <FaTimes />
            </button>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {unreadCount > 0 ? `Você tem ${unreadCount} notificações não lidas` : 'Todas as notificações foram lidas'}
          </p>
          
          {/* Barra de pesquisa */}
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Pesquisar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg
                ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'}
                focus:outline-none focus:ring-2 focus:ring-red-500
              `}
            />
            <FaSearch className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          {/* Filtros */}
          <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap
                ${filter === 'all'
                  ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap
                ${filter === 'unread'
                  ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              Não lidas
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center
                ${filter === 'info'
                  ? theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              <FaInfoCircle className="mr-1" /> Info
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center
                ${filter === 'success'
                  ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              <FaCheckCircle className="mr-1" /> Sucesso
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center
                ${filter === 'warning'
                  ? theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              <FaExclamationTriangle className="mr-1" /> Alerta
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center
                ${filter === 'error'
                  ? theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                  : theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}
              `}
            >
              <FaExclamationCircle className="mr-1" /> Erro
            </button>
          </div>
        </div>
        
        {/* Lista de Notificações */}
        <div className="p-2">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => openNotificationDetails(notification)}
                  className={`
                    p-3 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.01]
                    ${getNotificationBackground(notification.type, theme || 'light')}
                  `}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {getNotificationIcon(notification.type)}
                        <h4 className={`ml-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {notification.message.length > 100 
                          ? `${notification.message.substring(0, 100)}...` 
                          : notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs">
                        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <FaCalendarAlt className="inline mr-1" />
                          {formatRelativeTime(notification.date)}
                        </span>
                        <span className={`ml-4 px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                          {notification.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {!notification.isRead && (
                        <div className={`w-2 h-2 rounded-full mr-2 ${notification.type === 'info' ? 'bg-blue-500' : ''} ${notification.type === 'success' ? 'bg-green-500' : ''} ${notification.type === 'warning' ? 'bg-yellow-500' : ''} ${notification.type === 'error' ? 'bg-red-500' : ''}`}></div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        <FaTrash className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`
              flex flex-col items-center justify-center p-8 rounded-xl
              ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}
            `}>
              <FaBell className={`text-5xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Nenhuma notificação encontrada
              </h3>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar seus filtros ou termos de pesquisa.'
                  : 'Você não tem notificações no momento.'}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={markAllAsRead}
              className={`
                text-sm flex items-center
                ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              <FaCheckDouble className="mr-1" /> Marcar todas como lidas
            </button>
            <button
              onClick={async () => {
                setNotifications([])
                try {
                  const token = typeof window !== 'undefined' ? await getValidToken() : null
                  if (!token) return
                  await fetch('/api/notifications/delete-all', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
                } catch {}
              }}
              className={`
                text-sm flex items-center
                ${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}
              `}
            >
              <FaTrash className="mr-1" /> Limpar todas
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de detalhes */}
      <NotificationModal />
    </>
  )
}