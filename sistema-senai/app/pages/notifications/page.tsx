'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import { useSidebar } from '../../../contexts/SidebarContext'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaInfoCircle,
  FaExclamationCircle,
  FaRegBell,
  FaCheckDouble
} from 'react-icons/fa'

// Interface para as notificações
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  date: Date
  category: string
}

// Dados simulados para demonstração
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Chamado #123 atualizado',
    message: 'O técnico João atualizou o status do seu chamado para "Em andamento".',
    type: 'info',
    isRead: false,
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    category: 'chamados'
  },
  {
    id: '2',
    title: 'Manutenção concluída',
    message: 'A manutenção preventiva do equipamento XYZ foi concluída com sucesso.',
    type: 'success',
    isRead: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    category: 'manutenção'
  },
  {
    id: '3',
    title: 'Alerta de prazo',
    message: 'O chamado #456 está próximo do prazo de vencimento. Verifique o status.',
    type: 'warning',
    isRead: false,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
    category: 'prazos'
  },
  {
    id: '4',
    title: 'Erro no sistema',
    message: 'Ocorreu um erro ao processar seu último relatório. Tente novamente.',
    type: 'error',
    isRead: false,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    category: 'sistema'
  },
  {
    id: '5',
    title: 'Novo chamado atribuído',
    message: 'Você foi designado para atender o chamado #789 no Laboratório 3.',
    type: 'info',
    isRead: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
    category: 'chamados'
  },
  {
    id: '6',
    title: 'Feedback recebido',
    message: 'Você recebeu uma avaliação positiva pelo atendimento do chamado #321.',
    type: 'success',
    isRead: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 dias atrás
    category: 'feedback'
  },
  {
    id: '7',
    title: 'Manutenção agendada',
    message: 'Uma manutenção preventiva foi agendada para o equipamento ABC amanhã às 14h.',
    type: 'info',
    isRead: false,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 dias atrás
    category: 'manutenção'
  },
  {
    id: '8',
    title: 'Atualização do sistema',
    message: 'O sistema será atualizado hoje à noite. Pode haver indisponibilidade entre 22h e 23h.',
    type: 'warning',
    isRead: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 dias atrás
    category: 'sistema'
  }
];

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
    if (!active) return theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
    
    if (!color) return theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900';
    
    switch (color) {
      case 'blue':
        return theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600';
      case 'green':
        return theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600';
      case 'yellow':
        return theme === 'dark' ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-600';
      case 'red':
        return theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600';
      default:
        return theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center ${getColorClasses()}`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </button>
  );
};

// Tipos para filtros
type FilterType = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';

// Componente de Notificações que pode ser usado tanto como página quanto como painel
export function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  const { theme } = useTheme()
  const { isMobile } = useSidebar()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Calcular o número de notificações não lidas
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Funções para gerenciar notificações
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  // Função para excluir notificação
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    if (selectedNotification?.id === id) {
      setSelectedNotification(null)
      setIsModalOpen(false)
    }
  }

  // Função para marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  // Função para excluir todas as notificações
  const deleteAllNotifications = () => {
    setNotifications([])
    setSelectedNotification(null)
    setIsModalOpen(false)
  }

  // Função para abrir o modal com detalhes da notificação
  const openNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    markAsRead(notification.id)
    setIsModalOpen(true)
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

    if (diffSec < 60) return 'Agora mesmo'
    if (diffMin < 60) return `${diffMin} min atrás`
    if (diffHour < 24) return `${diffHour} h atrás`
    if (diffDay === 1) return 'Ontem'
    if (diffDay < 7) return `${diffDay} dias atrás`

    return date.toLocaleDateString('pt-BR')
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Notificações
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {unreadCount > 0 ? `Você tem ${unreadCount} notificações não lidas` : 'Todas as notificações foram lidas'}
              </p>
            </div>
            
            <div className="flex gap-2">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <FaCheckDouble />
                  <span className="hidden sm:inline">Marcar todas como lidas</span>
                  <span className="sm:hidden">Marcar lidas</span>
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                  <FaTrash />
                  <span className="hidden sm:inline">Limpar todas</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}
            </div>
          </div>
        
          {/* Filtros e Pesquisa */}
          <div className={`mb-6 flex flex-col sm:flex-row gap-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-xl shadow-sm`}>
            <div className="flex-1">
              <div className={`relative flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg px-3 py-2`}>
                <FaSearch className={`mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Pesquisar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent border-none focus:ring-0 ${theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                theme={theme || 'light'}

              >
                Todas
              </FilterButton>
              <FilterButton
                active={filter === 'unread'}
                onClick={() => setFilter('unread')}
                theme={theme || 'light'}
                icon={<FaRegBell />}
              >
                Não lidas
              </FilterButton>
              <FilterButton
                active={filter === 'info'}
                onClick={() => setFilter('info')}
                theme={theme || 'light'}

                color="blue"
                icon={<FaInfoCircle />}
              >
                Info
              </FilterButton>
              <FilterButton
                active={filter === 'success'}
                onClick={() => setFilter('success')}
                theme={theme || 'light'}

                color="green"
                icon={<FaCheckCircle />}
              >
                Sucesso
              </FilterButton>
              <FilterButton
                active={filter === 'warning'}
                onClick={() => setFilter('warning')}
                theme={theme || 'light'}

                color="yellow"
                icon={<FaExclamationTriangle />}
              >
                Alerta
              </FilterButton>
              <FilterButton
                active={filter === 'error'}
                onClick={() => setFilter('error')}
                theme={theme || 'light'}

                color="red"
                icon={<FaExclamationCircle />}
              >
                Erro
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
                    p-4 rounded-xl shadow-sm cursor-pointer transform transition-all duration-200 hover:scale-[1.01]
                    ${getNotificationBackground(notification.type, theme || 'light')}
                    ${!notification.isRead ? 'border-l-4' : ''}
                    ${!notification.isRead && notification.type === 'info' ? 'border-blue-500' : ''}
                    ${!notification.isRead && notification.type === 'success' ? 'border-green-500' : ''}
                    ${!notification.isRead && notification.type === 'warning' ? 'border-yellow-500' : ''}
                    ${!notification.isRead && notification.type === 'error' ? 'border-red-500' : ''}
                    ${notification.isRead ? 'opacity-70' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="mt-1 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FaCalendarAlt className="inline mr-1" />
                            {formatRelativeTime(notification.date)}
                          </span>
                          <span className={`ml-4 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {notification.category}
                          </span>
                        </div>
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