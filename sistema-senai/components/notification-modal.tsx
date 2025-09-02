'use client'

import React, { useState, useEffect } from 'react'
import { FaBell, FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaClock } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import { useNotification } from '../contexts/NotificationContext'
import { useI18n } from '../contexts/I18nContext'
import { getValidToken } from '../utils/tokenManager'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  isRead: boolean
  date: Date
  category: string
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications?: Notification[]
}

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications = [] 
}: NotificationModalProps) {
  const { theme } = useTheme()
  const { t } = useI18n()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar notificações quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Carregar notificações do backend
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const token = typeof window !== 'undefined' ? await getValidToken() : null
      if (!token) {
        console.log('Token não encontrado')
        return
      }
      
      console.log('Carregando notificações do backend...')
      const res = await fetch('/api/notifications/my-notifications?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Resposta do backend:', data)
        
        const items = (data.notifications ?? data ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: (n.category as string) === 'success' ? 'success' : (n.category === 'warning' ? 'warning' : (n.category === 'error' ? 'error' : 'info')),
          isRead: !!n.is_read,
          date: new Date(n.created_at),
          category: (n.type || 'GENERAL').toString().toUpperCase(),
        })) as Notification[]
        
        console.log('Notificações processadas:', items)
        setLocalNotifications(items)
      } else {
        console.error('Erro ao carregar notificações:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />
      case 'info':
      default:
        return <FaInfoCircle className="text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-900/30 dark:bg-green-900/40'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-900/30 dark:bg-yellow-900/40'
      case 'error':
        return 'border-l-red-500 bg-red-900/30 dark:bg-red-900/40'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-900/30 dark:bg-blue-900/40'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return t('notifications.now')
    if (diffInMinutes < 60) return `${diffInMinutes}${t('notifications.minutesAgoSuffix')}`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}${t('notifications.hoursAgoSuffix')}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}${t('notifications.daysAgoSuffix')}`
  }

  const { markAsRead: markNotificationAsRead, markAllAsRead: markAllNotificationsAsRead } = useNotification()

  const markAsRead = async (id: string) => {
    // Atualiza localmente para feedback imediato
    setLocalNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
    
    // Atualiza no servidor e no contexto global
    await markNotificationAsRead(parseInt(id))
    
    // Dispara evento personalizado para atualizar a contagem em toda a aplicação
    window.dispatchEvent(new Event('notification-update'))
  }

  const markAllAsRead = async () => {
    // Atualiza localmente para feedback imediato
    setLocalNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
    
    // Atualiza no servidor e no contexto global
    await markAllNotificationsAsRead()
    
    // Dispara evento personalizado para atualizar a contagem em toda a aplicação
    window.dispatchEvent(new Event('notification-update'))
  }

  const unreadCount = localNotifications.filter(n => !n.isRead).length

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
                   {/* Modal - Sem animação de deslizar */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col
        ${theme === 'dark' 
          ? 'bg-gray-900 border-l border-gray-700' 
          : 'bg-white border-l border-gray-200'
        }
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b
          ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center space-x-3">
            <FaBell className="text-lg" />
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('nav.notifications')}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

                 {/* Content */}
         <div className="flex-1 overflow-y-auto min-h-0">
                       {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Carregando notificações...
                </p>
              </div>
            ) : localNotifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 p-4">
               <FaBell className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
               <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                 {t('notifications.empty')}
               </p>
             </div>
           ) : (
             <div className="p-4 space-y-3 pb-20">
               {/* Botão para marcar todas como lidas */}
               {unreadCount > 0 && (
                 <button
                   onClick={markAllAsRead}
                   className={`
                     w-full py-2 px-3 text-sm rounded-lg transition-colors
                     ${theme === 'dark'
                       ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                     }
                   `}
                 >
                   {t('notifications.markAllRead')}
                 </button>
               )}

               {/* Lista de notificações */}
               {localNotifications.map((notification) => (
                 <div
                   key={notification.id}
                   onClick={() => markAsRead(notification.id)}
                   className={`
                     p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200
                     ${getNotificationColor(notification.type)}
                     ${!notification.isRead ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}
                     ${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
                   `}
                 >
                   <div className="flex items-start space-x-3">
                     <div className="flex-shrink-0 mt-1">
                       {getNotificationIcon(notification.type)}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between">
                         <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                           {notification.title}
                         </h3>
                         <div className="flex items-center space-x-2">
                           <FaClock className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                           <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                             {formatTimeAgo(notification.date)}
                           </span>
                         </div>
                       </div>
                       
                       <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                         {notification.message}
                       </p>
                       
                       {!notification.isRead && (
                         <div className="mt-2">
                           <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>

                 {/* Footer */}
         <div className={`
           p-4 border-t flex-shrink-0
           ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
         `}>
          <button
            onClick={onClose}
            className={`
              w-full py-2 px-4 rounded-lg transition-colors
              ${theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }
            `}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </>
  )
}