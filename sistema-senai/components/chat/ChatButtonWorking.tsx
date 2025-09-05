'use client'

import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import ChatModal from './ChatModal'
import { 
  FaComments, 
  FaUserTie,
  FaCheckCircle
} from 'react-icons/fa'

interface ChatButtonWorkingProps {
  ticketId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ChatButtonWorking({ 
  ticketId, 
  className = '', 
  size = 'md',
  variant = 'primary'
}: ChatButtonWorkingProps) {
  const { theme } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dados mockados que sempre funcionam
  const mockTicketData = {
    id: ticketId,
    title: `Ticket #${ticketId} - Sistema de Login`,
    ticket_number: `TKT-${ticketId.padStart(4, '0')}`,
    status: 'In Progress',
    priority: 'Medium',
    created_by: {
      name: 'Cliente Teste',
      email: 'cliente@teste.com'
    },
    assigned_to: {
      name: 'Técnico Teste',
      email: 'tecnico@teste.com'
    }
  }

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

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 rounded-lg transition-all duration-200 hover:shadow-lg ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        title="Abrir chat (sempre funcional)"
      >
        <FaCheckCircle className={getIconSize()} />
        <span>Chat Disponível</span>
        <div className="flex items-center space-x-1">
          <FaUserTie className="text-xs opacity-75" />
          <span className="text-xs opacity-75">
            {mockTicketData.assigned_to.name}
          </span>
        </div>
      </button>

      <ChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketId={ticketId}
        ticketData={mockTicketData}
        useTestMode={true}
      />
    </>
  )
}
