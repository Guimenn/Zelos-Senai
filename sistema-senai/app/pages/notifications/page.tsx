'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import { useSidebar } from '../../../contexts/SidebarContext'
import { useI18n } from '../../../contexts/I18nContext'
import ResponsiveLayout from '../../../components/responsive-layout'
import { authCookies } from '../../../utils/cookies'
import { redirectToNotificationTarget } from '../../../utils/notificationRedirect'
import { Notification } from '../../../types'
import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaMapMarkerAlt,
  FaBuilding,
  FaTools,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar,
  FaFileAlt,
  FaLink,
  FaExternalLinkAlt,
  FaCopy,
  FaEdit,
  FaPlus,
  FaMinus,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaFilter,
  FaSort,
  FaStar,
  FaHeart,
  FaBookmark,
  FaShare,
  FaPrint,
  FaQrcode,
  FaBarcode,
  FaCreditCard,
  FaPaypal,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaRegBell,
  FaCheckDouble
} from 'react-icons/fa'

//

// Componente de botão de filtro
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  theme: string;
  icon?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, theme, icon, color, children }) => {
  const getColorClasses = () => {
    if (!active) {
      return theme === 'dark' 
        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50 border-gray-700' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200';
    }
    
    if (!color) {
      return theme === 'dark' 
        ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border-gray-600 shadow-lg' 
        : 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 border-gray-300 shadow-lg';
    }
    
    switch (color) {
      case 'blue':
        return theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 text-blue-300 border-blue-600 shadow-lg' 
          : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-lg';
      case 'green':
        return theme === 'dark' 
          ? 'bg-gradient-to-r from-green-900/40 to-green-800/40 text-green-300 border-green-600 shadow-lg' 
          : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300 shadow-lg';
      case 'yellow':
        return theme === 'dark' 
          ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 text-yellow-300 border-yellow-600 shadow-lg' 
          : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-300 shadow-lg';
      case 'red':
        return theme === 'dark' 
          ? 'bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-300 border-red-600 shadow-lg' 
          : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-300 shadow-lg';
      default:
        return theme === 'dark' 
          ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border-gray-600 shadow-lg' 
          : 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 border-gray-300 shadow-lg';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center border ${getColorClasses()}`}
    >
      {icon && <span className="mr-2 text-lg">{icon}</span>}
      {children}
    </button>
  );
};

// Tipos para filtros
type FilterType = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';

// Componente de Notificações que pode ser usado tanto como página quanto como painel
function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  const { theme } = useTheme()
  const { isMobile } = useSidebar()
  const { t, language } = useI18n()
  const [notifications, setNotifications] = useState<any[]>([]) // Changed type to any[] as Notification type is removed
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null) // Changed type to any

  // Carregar do backend
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) return
        const res = await fetch('/api/notifications/my-notifications?limit=100', { headers: { 'Authorization': `Bearer ${token}` }, signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        const items = (data.notifications ?? data ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: (n.category as string) === 'success' ? 'success' : (n.category === 'warning' ? 'warning' : (n.category === 'error' ? 'error' : 'info')),
          isRead: !!n.is_read,
          date: new Date(n.created_at),
          category: (n.type || n.event_type || n.category || 'general').toString().toUpperCase(),
          metadata: n.metadata || {}
        })) as any[] // Changed type to any[]
        setNotifications(items)
      } catch {}
    }
    load()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      load()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      controller.abort()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Calcular o número de notificações não lidas
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Funções para gerenciar notificações
  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
    } catch {}
  }

  // Função para excluir notificação
  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    if (selectedNotification?.id === id) {
      setSelectedNotification(null)
      setIsModalOpen(false)
    }
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      await fetch(`/api/notifications/${id}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
    } catch {}
  }

  // Função para marcar todas como lidas
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      await fetch('/api/notifications/mark-all-read', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
    } catch {}
  }

  // Função para excluir todas as notificações
  const deleteAllNotifications = () => {
    setNotifications([])
    setSelectedNotification(null)
    setIsModalOpen(false)
    // Arquiva todas no backend
    ;(async () => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) return
        const hardDelete = false
        if (hardDelete) {
          await fetch('/api/notifications/delete-all', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        } else {
          await fetch('/api/notifications/archive-all', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
        }
      } catch {}
    })()
  }

  // Função para abrir o modal com detalhes da notificação
  const openNotificationDetails = (notification: any) => {
    markAsRead(notification.id)
    
    // Tentar redirecionar baseado no tipo de notificação
    // Se a notificação tiver metadados específicos (ticketId, userId, etc.), 
    // será redirecionado para a página correspondente
    const wasRedirected = redirectToNotificationTarget(notification as Notification)
    
    // Se não foi redirecionado (não tem metadados específicos), mostrar modal com detalhes
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

  // Formatar data relativa
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return t('notifications.now')
    if (diffMin < 60) return `${diffMin} ${t('notifications.minutesAgoSuffix')}`
    if (diffHour < 24) return `${diffHour} ${t('notifications.hoursAgoSuffix')}`
    if (diffDay === 1) return `1 ${t('notifications.daysAgoSuffix')}`
    if (diffDay < 7) return `${diffDay} ${t('notifications.daysAgoSuffix')}`

    return date.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US')
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

  // Extrai nome e cargo de mensagens conhecidas para evitar mistura PT/EN
  const extractNameAndRole = (category: string, message: string): { name?: string; role?: string } => {
    const trimmed = (message || '').trim()
    // TEAM_MEMBER_ADDED
    if (category === 'TEAM_MEMBER_ADDED') {
      // PT: "<nome> foi adicionado à equipe como <cargo>"
      let m = trimmed.match(/^(.*?)\sfoi adicionado à equipe como\s(.*?)(?:\.|$)/i)
      if (m) {
        return { name: m[1].trim(), role: m[2].trim() }
      }
      // EN: "<name> has been added to the team as <role>"
      m = trimmed.match(/^(.*?)\shas been added to the team as\s(.*?)(?:\.|$)/i)
      if (m) {
        return { name: m[1].trim(), role: m[2].trim() }
      }
    }

    // USER_CREATED
    if (category === 'USER_CREATED') {
      // PT: "Uma nova conta foi criada para <nome> (<cargo>)."
      let m = trimmed.match(/foi criada para\s(.*?)\s*\(([^)]+)\)/i)
      if (m) {
        return { name: m[1].trim(), role: m[2].trim() }
      }
      // EN: "New account created for <name> (<role>)."
      m = trimmed.match(/created for\s(.*?)\s*\(([^)]+)\)/i)
      if (m) {
        return { name: m[1].trim(), role: m[2].trim() }
      }
      
      // Fallback: tentar extrair nome e cargo de qualquer formato com parênteses
      m = trimmed.match(/(.*?)\s*\(([^)]+)\)/)
      if (m) {
        const fullMatch = m[0]
        const namePart = m[1].trim()
        const rolePart = m[2].trim()
        
        // Se o nome contém "foi criada para", extrair apenas o nome
        if (namePart.includes('foi criada para')) {
          const nameMatch = namePart.match(/foi criada para\s+(.*)/i)
          if (nameMatch) {
            return { name: nameMatch[1].trim(), role: rolePart }
          }
        }
        
        return { name: namePart, role: rolePart }
      }
      
      // Debug: log da mensagem para ver o que está chegando
      console.log('🔍 Debug USER_CREATED:', { category, message: trimmed })
    }

    return {}
  }

  // Componente de modal para dispositivos móveis
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
                {(() => {
                  const key = `notifications.types.${selectedNotification.category}.title`
                  const translated = t(key)
                  return translated === key ? selectedNotification.title : translated
                })()}
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
            <p>{(() => {
              const key = `notifications.types.${selectedNotification.category}.message`
              const tr = t(key)
              return tr === key
                ? selectedNotification.message
                : tr.replace('{id}', selectedNotification.message.match(/#\S+/)?.[0] || '')
            })()}</p>
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
                {t('notifications.actions.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${onClose ? 'fixed inset-0 z-50 bg-black bg-opacity-50' : ''}`}
      onClick={onClose ? () => onClose() : undefined}
    >
      {/* Conteúdo principal */}
      <div 
        className={`
          ${onClose && isMobile ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh] overflow-y-auto' : ''}
          ${onClose && !isMobile ? 'fixed top-16 right-4 w-96 rounded-xl max-h-[80vh] overflow-y-auto' : ''}
          ${!onClose && isMobile ? 'mt-2 fixed inset-0 z-40 pt-16 pb-20 px-4 overflow-y-auto' : ''}
          ${!onClose && !isMobile ? 'mt-6' : ''}
          ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}
          shadow-xl
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <FaBell className={`text-2xl ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-red-400">
                  {t('client.home.quick.notifications.title')}
                </h1>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {notifications.length} {t('notifications.totalSuffix')}
                  </div>
                  {unreadCount > 0 && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white animate-pulse">
                      {unreadCount} {t('notifications.unreadSuffix')}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'}`}
                >
                  <FaCheckDouble className="text-lg" />
                  <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                  <span className="sm:hidden">{t('notifications.markAllRead')}</span>
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'}`}
                >
                  <FaTrash className="text-lg" />
                  <span className="hidden sm:inline">{t('notifications.actions.clearAll')}</span>
                  <span className="sm:hidden">{t('notifications.actions.clear')}</span>
                </button>
              )}
            </div>
          </div>
        
          {/* Filtros e Pesquisa */}
          <div className={`mb-8 flex flex-col sm:flex-row gap-6 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-50 to-gray-100'} p-6 rounded-2xl shadow-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex-1">
              <div className={`relative flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-xl px-4 py-3 shadow-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <FaSearch className={`mr-3 text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder={t('notifications.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent border-none focus:ring-0 text-lg ${theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                />
              </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                theme={theme || 'light'}

              >
                {t('notifications.filters.all')}
              </FilterButton>
              <FilterButton
                active={filter === 'unread'}
                onClick={() => setFilter('unread')}
                theme={theme || 'light'}
                icon={<FaRegBell />}
              >
                {t('notifications.filters.unread')}
              </FilterButton>
              <FilterButton
                active={filter === 'info'}
                onClick={() => setFilter('info')}
                theme={theme || 'light'}

                color="blue"
                icon={<FaInfoCircle />}
              >
                {t('notifications.filters.info')}
              </FilterButton>
              <FilterButton
                active={filter === 'success'}
                onClick={() => setFilter('success')}
                theme={theme || 'light'}

                color="green"
                icon={<FaCheckCircle />}
              >
                {t('notifications.filters.success')}
              </FilterButton>
              <FilterButton
                active={filter === 'warning'}
                onClick={() => setFilter('warning')}
                theme={theme || 'light'}

                color="yellow"
                icon={<FaExclamationTriangle />}
              >
                {t('notifications.filters.warning')}
              </FilterButton>
              <FilterButton
                active={filter === 'error'}
                onClick={() => setFilter('error')}
                theme={theme || 'light'}

                color="red"
                icon={<FaExclamationCircle />}
              >
                {t('notifications.filters.error')}
              </FilterButton>
            </div>
          </div>
        </div>
        
        {/* Lista de Notificações */}
        <div className="px-4 sm:px-6 pb-6">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => openNotificationDetails(notification)}
                  className={`
                    notification-card p-6 rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                    ${getNotificationBackground(notification.type, theme || 'light')}
                    ${!notification.isRead ? 'border-l-4' : 'border-l-4 border-transparent'}
                    ${!notification.isRead && notification.type === 'info' ? 'border-blue-500' : ''}
                    ${!notification.isRead && notification.type === 'success' ? 'border-green-500' : ''}
                    ${!notification.isRead && notification.type === 'warning' ? 'border-yellow-500' : ''}
                    ${!notification.isRead && notification.type === 'error' ? 'border-red-500' : ''}
                    ${notification.isRead ? 'opacity-80' : ''}
                    ${theme === 'dark' ? 'border border-gray-700' : 'border border-gray-200'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`mt-1 mr-4 p-2 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {(() => {
                              const key = `notifications.types.${notification.category}.title`
                              const translated = t(key)
                              return translated === key ? notification.title : translated
                            })()}
                          </h3>
                          {!notification.isRead && (
                            <div className={`w-3 h-3 rounded-full animate-pulse ${notification.type === 'info' ? 'bg-blue-500' : ''} ${notification.type === 'success' ? 'bg-green-500' : ''} ${notification.type === 'warning' ? 'bg-yellow-500' : ''} ${notification.type === 'error' ? 'bg-red-500' : ''}`}></div>
                          )}
                        </div>
                        <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {(() => {
                            const key = `notifications.types.${notification.category}.message`
                            const tr = t(key)
                            if (tr === key) return notification.message
                            const parsed = extractNameAndRole(notification.category, notification.message)
                            const name = parsed.name || ''
                            const roleRaw = (parsed.role || '').toLowerCase()
                            const roleKey = roleRaw.includes('tec') || roleRaw.includes('technician') ? 'roles.technician' : (roleRaw.includes('pro') || roleRaw.includes('professional') ? 'roles.professional' : (roleRaw.includes('adm') || roleRaw.includes('admin') ? 'roles.admin' : ''))
                            const role = roleKey ? t(roleKey) : (parsed.role || '')
                            return tr
                              .replace('{id}', notification.message.match(/#\S+/)?.[0] || '')
                              .replace('{name}', name)
                              .replace('{role}', role)
                          })()}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <FaCalendarAlt className="inline mr-2" />
                              {formatRelativeTime(notification.date)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                              {notification.category}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${theme === 'dark' ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`
              flex flex-col items-center justify-center p-12 rounded-2xl
              ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}
              border-2 border-dashed ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}
            `}>
              <div className={`p-6 rounded-full mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <FaBell className={`text-6xl ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('notifications.emptyFound')}
              </h3>
              <p className={`text-center text-lg max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filter !== 'all' 
                  ? t('notifications.empty.adjustFilters')
                  : t('notifications.empty.noPending')}
              </p>
              {(searchTerm || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilter('all')
                  }}
                  className={`mt-6 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  {t('notifications.empty.clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes da notificação */}
      <NotificationModal />

      {/* Estilos globais para esconder a barra de rolagem em alguns navegadores */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .notification-card {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .notification-card:nth-child(1) { animation-delay: 0.1s; }
        .notification-card:nth-child(2) { animation-delay: 0.2s; }
        .notification-card:nth-child(3) { animation-delay: 0.3s; }
        .notification-card:nth-child(4) { animation-delay: 0.4s; }
        .notification-card:nth-child(5) { animation-delay: 0.5s; }
        .notification-card:nth-child(6) { animation-delay: 0.6s; }
        .notification-card:nth-child(7) { animation-delay: 0.7s; }
        .notification-card:nth-child(8) { animation-delay: 0.8s; }
        .notification-card:nth-child(9) { animation-delay: 0.9s; }
        .notification-card:nth-child(10) { animation-delay: 1.0s; }
      `}</style>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ResponsiveLayout
      userType="admin"
      userName="Usuário SENAI"
      userEmail="usuario@senai.com"
      notifications={3}
      className="bg-gray-100 dark:bg-gray-900"
    >
      <NotificationsPanel />
    </ResponsiveLayout>
  )
}