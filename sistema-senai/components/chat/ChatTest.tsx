'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaPaperPlane, FaPaperclip, FaUser, FaUserTie } from 'react-icons/fa'

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_role: string
  created_at: string
  attachment_url?: string
}

interface ChatTestProps {
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
}

export default function ChatTest({ ticketId, ticketData }: ChatTestProps) {
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Dados mockados para teste
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Olá! Como posso ajudá-lo com este ticket?',
        sender_id: 'agent-1',
        sender_name: ticketData?.assigned_to?.name || 'Técnico Teste',
        sender_role: 'Agent',
        created_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '2',
        content: 'Preciso de ajuda com o sistema de login.',
        sender_id: 'client-1',
        sender_name: ticketData?.created_by?.name || 'Cliente Teste',
        sender_role: 'Client',
        created_at: new Date(Date.now() - 30000).toISOString()
      },
      {
        id: '3',
        content: 'Entendi. Vou verificar o problema e retornar em breve.',
        sender_id: 'agent-1',
        sender_name: ticketData?.assigned_to?.name || 'Técnico Teste',
        sender_role: 'Agent',
        created_at: new Date().toISOString()
      }
    ]

    setMessages(mockMessages)
  }, [ticketData])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_id: 'current-user',
      sender_name: 'Você',
      sender_role: 'Client',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setIsLoading(true)

    // Simular resposta do técnico
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Mensagem recebida! Em breve retornarei com uma solução.',
        sender_id: 'agent-1',
        sender_name: ticketData?.assigned_to?.name || 'Técnico Teste',
        sender_role: 'Agent',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, response])
      setIsLoading(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isCurrentUser = (senderId: string) => {
    return senderId === 'current-user'
  }

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header do Chat */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-red-500 to-red-600">
            <FaUserTie className="text-white text-sm" />
          </div>
          <div>
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Chat - {ticketData?.title || 'Ticket de Teste'}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              #{ticketData?.ticket_number || 'TKT-0001'} • {ticketData?.assigned_to?.name || 'Técnico Teste'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${isCurrentUser(message.sender_id) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isCurrentUser(message.sender_id)
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {isCurrentUser(message.sender_id) ? (
                  <FaUser className="text-xs opacity-75" />
                ) : (
                  <FaUserTie className="text-xs opacity-75" />
                )}
                <span className="text-xs opacity-75">
                  {message.sender_name}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-75 mt-1">
                {formatTime(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                <span className="text-sm">Digitando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
            title="Anexar arquivo"
          >
            <FaPaperclip />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className={`w-full px-3 py-2 rounded-lg border resize-none ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className={`p-2 rounded-lg transition-colors ${
              newMessage.trim() && !isLoading
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Enviar mensagem"
          >
            <FaPaperPlane />
          </button>
        </div>
        
        <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          💡 Chat de teste - Mensagens são simuladas
        </div>
      </div>
    </div>
  )
}
