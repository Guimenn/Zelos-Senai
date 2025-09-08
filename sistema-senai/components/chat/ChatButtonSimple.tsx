'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useChatAvailability } from '../../hooks/useChatAvailability'
import { useRequireAuth } from '../../hooks/useAuth'
import { useUnreadMessages } from '../../hooks/useUnreadMessages'
import { useI18n } from '../../contexts/I18nContext'
import ChatModal from './ChatModal'
import { 
  FaComments, 
  FaSpinner, 
  FaUserTie,
  FaUser,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa'

interface ChatButtonSimpleProps {
  ticketId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ChatButtonSimple({ 
  ticketId, 
  className = '', 
  size = 'md',
  variant = 'primary'
}: ChatButtonSimpleProps) {
  const { theme } = useTheme()
  const { user } = useRequireAuth()
  const { t } = useI18n()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isAvailable, isLoading, error, ticketData, refreshAvailability, canSend, chatAccess } = useChatAvailability(ticketId, isModalOpen)
  const { unreadCount, isLoading: isLoadingUnread, error: unreadError, markAsRead, refresh: refreshUnread } = useUnreadMessages(ticketId, isModalOpen)

  // Escutar eventos de mensagens para atualizar contador imediatamente
  useEffect(() => {
    const handleMessageEvent = (event: CustomEvent) => {
      if (event.detail?.ticketId === ticketId) {
        // Atualizar contador quando uma nova mensagem for enviada
        setTimeout(() => refreshUnread(), 500) // Pequeno delay para garantir que a mensagem foi salva
      }
    }

    // Escutar eventos customizados de mensagens
    window.addEventListener('messageSent', handleMessageEvent as EventListener)
    window.addEventListener('messageReceived', handleMessageEvent as EventListener)

    return () => {
      window.removeEventListener('messageSent', handleMessageEvent as EventListener)
      window.removeEventListener('messageReceived', handleMessageEvent as EventListener)
    }
  }, [ticketId, refreshUnread])

  // Marcar mensagens como lidas quando o modal for aberto
  useEffect(() => {
    if (isModalOpen) {
      // Pequeno delay para garantir que o modal foi aberto completamente
      const timer = setTimeout(() => {
        markAsRead()
      }, 1000) // 1 segundo após abrir o modal

      return () => clearTimeout(timer)
    }
  }, [isModalOpen, markAsRead])

  // Debug do usuário
  console.log('🔍 ChatButtonSimple - Dados do usuário:', {
    user,
    userId: user?.userId,
    userRole: user?.role,
    userUserRole: user?.userRole,
    userName: user?.name,
    userEmail: user?.email
  })

  // Sempre mostrar o botão para debug
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm'
      case 'lg':
        return 'px-6 py-4 text-lg'
      default:
        return 'px-4 py-3 text-base'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return theme === 'dark'
          ? 'bg-gray-700 text-white hover:bg-gray-600'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      case 'outline':
        return theme === 'dark'
          ? 'border border-gray-600 text-white hover:bg-gray-700'
          : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
      default:
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  // Não mostrar botão durante loading ou para chamados não aceitos
  if (isLoading || !isAvailable) {
    return null
  }

  if (error) {
    // Verificar se é erro de ticket não encontrado
    const isNotFound = error.includes('não encontrado')
    const isPermission = error.includes('permissão')
    
    return (
      <div className={`inline-flex items-center space-x-2 rounded-lg ${getSizeClasses()} ${
        theme === 'dark'
          ? 'bg-red-900/20 text-red-400'
          : 'bg-red-50 text-red-600'
      } ${className}`}>
        <FaExclamationTriangle className={getIconSize()} />
        <span>
          {isNotFound ? 'Ticket não encontrado' : 
           isPermission ? 'Sem permissão' : 'Erro'}
        </span>
        <button
          onClick={refreshAvailability}
          className={`ml-2 px-2 py-1 text-xs rounded ${
            theme === 'dark'
              ? 'bg-red-800 hover:bg-red-700'
              : 'bg-red-100 hover:bg-red-200'
          }`}
          title="Clique para tentar novamente"
        >
          Tentar
        </button>
      </div>
    )
  }

  if (!isAvailable) {
    // Não renderizar nada quando não há técnico atribuído
    return null
  }

  // Determinar o nome a ser exibido baseado no papel do usuário
  let displayName = ''
  let displayIcon = FaUserTie
  
  // Usar assigned_to (estrutura dos dados)
  const assignedTechnician = ticketData?.assigned_to
  
  if (assignedTechnician) {
    // Verificar se o usuário atual é o técnico ou o criador
    const currentUserId = user?.userId
    const currentUserRole = user?.role || user?.userRole
    
    // Converter IDs para string para comparação mais robusta
    const currentUserIdStr = String(currentUserId)
    const assignedToIdStr = String((assignedTechnician as any)?.id || '')
    const creatorIdStr = String((ticketData.created_by as any)?.id || '')
    
    // Verificar se o usuário atual é o técnico (deve ser Agent e ter o ID correto)
    const isCurrentUserTechnician = currentUserRole === 'Agent' && assignedToIdStr === currentUserIdStr
    
    // Verificar se o usuário atual é o criador (deve ser Client e ter o ID correto)
    const isCurrentUserCreator = (currentUserRole === 'Client' || currentUserRole === 'Profissional') && 
                                 (creatorIdStr === currentUserIdStr)
    
    console.log('🔍 Debug ChatButtonSimple:', {
      currentUserId,
      currentUserRole,
      currentUserIdType: typeof currentUserId,
      rawUserData: {
        userId: user?.userId,
        role: user?.role,
        userRole: user?.userRole,
        name: user?.name
      },
      ticketData: {
        id: ticketData.id,
        created_by: ticketData.created_by,
        assigned_to: ticketData.assigned_to,
        assignedTechnician: assignedTechnician
      },
      stringComparisons: {
        currentUserIdStr,
        assignedToIdStr,
        creatorIdStr,
        'assignedToIdStr === currentUserIdStr': assignedToIdStr === currentUserIdStr,
        'creatorIdStr === currentUserIdStr': creatorIdStr === currentUserIdStr
      },
      roleChecks: {
        'currentUserRole === Agent': currentUserRole === 'Agent',
        'currentUserRole === Client': currentUserRole === 'Client',
        'currentUserRole === Profissional': currentUserRole === 'Profissional'
      },
      isCurrentUserTechnician,
      isCurrentUserCreator
    })
    
    if (isCurrentUserTechnician) {
      // Se o usuário atual é o técnico, mostrar o nome do criador
      displayName = ticketData.created_by?.name || 'Cliente'
      displayIcon = FaUser
      console.log('✅ Usuário é TÉCNICO - mostrando nome do CRIADOR:', displayName)
    } else if (isCurrentUserCreator) {
      // Se o usuário atual é o criador, mostrar o nome do técnico
      displayName = assignedTechnician.name
      displayIcon = FaUserTie
      console.log('✅ Usuário é CRIADOR - mostrando nome do TÉCNICO:', displayName)
    } else {
      // Para outros casos (admin), mostrar o nome do próprio usuário (admin)
      displayName = user?.name || 'Administrador'
      displayIcon = FaUser
    }
    
    // Log adicional para debug
    console.log('🔍 Debug final:', {
      currentUserId,
      currentUserRole,
      technicianId: (assignedTechnician as any)?.id,
      creatorId: (ticketData.created_by as any)?.id,
      stringComparisons: {
        currentUserIdStr,
        assignedToIdStr,
        creatorIdStr
      },
      isCurrentUserTechnician,
      isCurrentUserCreator,
      displayName,
      displayIcon: displayIcon.name
    })
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
          title={t('chat.openWith', { name: displayName || t('chat.technician') })}
        >
          <FaComments className={getIconSize()} />
          <span>{t('chat.title')}</span>
        </button>
        
        {/* Balão de notificação */}
        {unreadCount > 0 && !unreadError && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>

      <ChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketId={ticketId}
        ticketData={ticketData}
        canSend={canSend}
      />
    </>
  )
}
