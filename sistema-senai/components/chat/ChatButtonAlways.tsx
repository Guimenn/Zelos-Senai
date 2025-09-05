'use client'

import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useChatAvailability } from '../../hooks/useChatAvailability'
import ChatModal from './ChatModal'
import { 
  FaComments, 
  FaSpinner, 
  FaUserTie,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa'

interface ChatButtonAlwaysProps {
  ticketId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ChatButtonAlways({ 
  ticketId, 
  className = '', 
  size = 'md',
  variant = 'primary'
}: ChatButtonAlwaysProps) {
  const { theme } = useTheme()
  const { isAvailable, isLoading, error, ticketData, refreshAvailability } = useChatAvailability(ticketId)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // SEMPRE renderizar o botão, independente das condições
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        title="Abrir chat (sempre disponível para teste)"
      >
        {isLoading ? (
          <FaSpinner className={`animate-spin ${getIconSize()}`} />
        ) : error ? (
          <FaExclamationTriangle className={getIconSize()} />
        ) : isAvailable ? (
          <FaCheckCircle className={getIconSize()} />
        ) : (
          <FaComments className={getIconSize()} />
        )}
        
        <span>
          {isLoading ? 'Verificando...' : 
           error ? 'Chat (Erro)' : 
           isAvailable ? 'Chat Disponível' : 
           'Chat (Teste)'}
        </span>
        
        {ticketData?.assigned_to && (
          <div className="flex items-center space-x-1">
            <FaUserTie className="text-xs opacity-75" />
            <span className="text-xs opacity-75">
              {ticketData.assigned_to.name}
            </span>
          </div>
        )}
      </button>

      <ChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketId={ticketId}
        ticketData={ticketData}
      />
    </>
  )
}
