'use client'

import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useChatAvailabilityTest } from '../../hooks/useChatAvailabilityTest'
import ChatModal from './ChatModal'
import { 
  FaComments, 
  FaSpinner, 
  FaUserTie,
  FaCheckCircle,
  FaFlask
} from 'react-icons/fa'

interface ChatButtonTestProps {
  ticketId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ChatButtonTest({ 
  ticketId, 
  className = '', 
  size = 'md',
  variant = 'primary'
}: ChatButtonTestProps) {
  const { theme } = useTheme()
  const { isAvailable, isLoading, error, ticketData, refreshAvailability } = useChatAvailabilityTest(ticketId)
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
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
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
        <span>Carregando teste...</span>
      </button>
    )
  }

  if (error) {
    return (
      <button
        onClick={refreshAvailability}
        className={`inline-flex items-center space-x-2 rounded-lg transition-colors ${getSizeClasses()} ${
          theme === 'dark'
            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        } ${className}`}
        title="Erro no teste. Clique para tentar novamente."
      >
        <FaFlask className={getIconSize()} />
        <span>Erro no Teste</span>
      </button>
    )
  }

  if (!isAvailable) {
    return (
      <div className={`inline-flex items-center space-x-2 rounded-lg ${getSizeClasses()} ${
        theme === 'dark'
          ? 'bg-gray-700/50 text-gray-400'
          : 'bg-gray-100 text-gray-500'
      } ${className}`}>
        <FaFlask className={getIconSize()} />
        <span>Teste Indisponível</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        title="Abrir chat de teste"
      >
        <FaCheckCircle className={getIconSize()} />
        <span>Chat Teste</span>
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
        useTestMode={true}
      />
    </>
  )
}
