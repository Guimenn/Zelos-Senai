'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import Chat from './Chat'
import ChatTest from './ChatTest'
import { 
  FaTimes, 
  FaComments, 
  FaUser, 
  FaUserTie,
  FaTicketAlt,
  FaSpinner
} from 'react-icons/fa'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketData?: {
    id: string
    title: string
    ticket_number: string
    status: string
    priority: string
    created_by?: {
      name: string
      email: string
    }
    assigned_to?: {
      name: string
      email: string
    }
  }
  useTestMode?: boolean
}

export default function ChatModal({ isOpen, onClose, ticketId, ticketData, useTestMode = false }: ChatModalProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl h-[80vh] mx-4 rounded-2xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header do Modal */}
        <div className={`flex items-center justify-between p-6 border-b rounded-t-2xl ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600">
              <FaComments className="text-white text-xl" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Chat do Chamado
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FaTicketAlt className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    #{ticketData?.ticket_number || ticketId}
                  </span>
                </div>
                {ticketData?.title && (
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {ticketData.title}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Informações dos Participantes */}
        {ticketData && (
          <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Cliente */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <FaUser className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Cliente
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {ticketData.created_by?.name || 'Usuário'}
                    </p>
                  </div>
                </div>

                {/* Técnico */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <FaUserTie className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Técnico
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {ticketData.assigned_to?.name || 'Aguardando atribuição'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status do Chamado */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ticketData.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                  ticketData.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
                  ticketData.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticketData.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ticketData.priority === 'High' ? 'bg-red-100 text-red-800' :
                  ticketData.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  ticketData.priority === 'Low' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticketData.priority}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Área do Chat */}
        <div className="flex-1 h-[calc(80vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FaSpinner className="animate-spin text-3xl text-red-500 mx-auto mb-4" />
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Carregando chat...
                </p>
              </div>
            </div>
          ) : (
            useTestMode ? (
              <ChatTest 
                ticketId={ticketId} 
                ticketData={ticketData}
              />
            ) : (
              <Chat 
                ticketId={ticketId} 
                className="h-full"
              />
            )
          )}
        </div>

        {/* Footer do Modal */}
        <div className={`p-4 border-t rounded-b-2xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Chat em Tempo Real</span> - 
              Conversa exclusiva entre cliente e técnico
            </div>
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Chamado #{ticketData?.ticket_number || ticketId}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
