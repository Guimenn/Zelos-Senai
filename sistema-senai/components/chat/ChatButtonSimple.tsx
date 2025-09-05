'use client'

import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useChatAvailability } from '../../hooks/useChatAvailability'
import { useRequireAuth } from '../../hooks/useAuth'
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
  const { isAvailable, isLoading, error, ticketData, refreshAvailability, canSend, chatAccess } = useChatAvailability(ticketId)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Debug do usuário
  console.log('🔍 ChatButtonSimple - Dados do usuário:', {
    user,
    userId: user?.id,
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

  if (isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center space-x-2 rounded-lg transition-colors ${getSizeClasses()} ${
          theme === 'dark'
            ? 'bg-gray-700 text-gray-400'
            : 'bg-gray-100 text-gray-500'
        } ${className}`}
      >
        <FaSpinner className={`animate-spin ${getIconSize()}`} />
        <span>Verificando...</span>
      </button>
    )
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
  
  // Usar assignee ou assigned_to (dependendo da estrutura dos dados)
  const assignedTechnician = ticketData?.assignee || ticketData?.assigned_to
  
  if (assignedTechnician) {
    // Verificar se o usuário atual é o técnico ou o criador
    const currentUserId = user?.userId
    const currentUserRole = user?.role || user?.userRole
    
    // Converter IDs para string para comparação mais robusta
    const currentUserIdStr = String(currentUserId)
    const assignedToIdStr = String(assignedTechnician.id)
    const creatorIdStr = String(ticketData.creator?.id || ticketData.created_by?.id || '')
    
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
        id: user?.id,
        userId: user?.userId,
        role: user?.role,
        userRole: user?.userRole,
        name: user?.name
      },
      ticketData: {
        id: ticketData.id,
        creator: ticketData.creator,
        created_by: ticketData.created_by,
        assigned_to: ticketData.assigned_to,
        assignee: ticketData.assignee,
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
      displayName = ticketData.creator?.name || ticketData.created_by?.name || 'Cliente'
      displayIcon = FaUser
      console.log('✅ Usuário é TÉCNICO - mostrando nome do CRIADOR:', displayName)
    } else if (isCurrentUserCreator) {
      // Se o usuário atual é o criador, mostrar o nome do técnico
      displayName = assignedTechnician.name
      displayIcon = FaUserTie
      console.log('✅ Usuário é CRIADOR - mostrando nome do TÉCNICO:', displayName)
    } else {
      // Para outros casos (admin), mostrar o nome do próprio usuário (admin)
      displayName = user?.name || user?.userName || 'Administrador'
      displayIcon = FaUser
    }
    
    // Log adicional para debug
    console.log('🔍 Debug final:', {
      currentUserId,
      currentUserRole,
      technicianId: assignedTechnician.id,
      creatorId: ticketData.creator?.id,
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
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        title={`Abrir chat com ${displayName || 'o técnico'}`}
      >
        <FaComments className={getIconSize()} />
        <span>Chat</span>
      </button>

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
