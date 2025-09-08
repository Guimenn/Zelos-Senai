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
  FaBug
} from 'react-icons/fa'

interface ChatButtonDebugProps {
  ticketId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ChatButtonDebug({ 
  ticketId, 
  className = '', 
  size = 'md',
  variant = 'primary'
}: ChatButtonDebugProps) {
  const { theme } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isAvailable, isLoading, error, ticketData, refreshAvailability } = useChatAvailability(ticketId, isModalOpen)

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

  return (
    <div className="space-y-2">
      {/* Debug Info */}
      <div className={`p-2 rounded text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        <div className="flex items-center space-x-2 mb-1">
          <FaBug className="text-orange-500" />
          <span className="font-medium">Debug Chat Button</span>
        </div>
        <div className="space-y-1">
          <div>Ticket ID: {ticketId}</div>
          <div>Loading: {isLoading ? 'Sim' : 'Não'}</div>
          <div>Available: {isAvailable ? 'Sim' : 'Não'}</div>
          <div>Error: {error || 'Nenhum'}</div>
          <div>Assignee: {ticketData?.assigned_to?.name || 'Nenhum'}</div>
          <div>Status: {ticketData?.status || 'N/A'}</div>
        </div>
      </div>

      {/* Botão de Chat */}
      {isLoading ? (
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
      ) : error ? (
        <button
          onClick={refreshAvailability}
          className={`inline-flex items-center space-x-2 rounded-lg transition-colors ${getSizeClasses()} ${
            theme === 'dark'
              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          } ${className}`}
          title="Erro ao verificar chat. Clique para tentar novamente."
        >
          <FaExclamationTriangle className={getIconSize()} />
          <span>Erro: {error}</span>
        </button>
      ) : !isAvailable ? (
        <div className={`inline-flex items-center space-x-2 rounded-lg ${getSizeClasses()} ${
          theme === 'dark'
            ? 'bg-gray-700/50 text-gray-400'
            : 'bg-gray-100 text-gray-500'
        } ${className}`}>
          <FaClock className={getIconSize()} />
          <span>Chat Indisponível</span>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
            title="Abrir chat com o técnico"
          >
            <FaComments className={getIconSize()} />
            <span>Chat Disponível</span>
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
      )}
    </div>
  )
}
