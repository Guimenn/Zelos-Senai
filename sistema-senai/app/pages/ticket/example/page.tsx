'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireAuth } from '../../../../hooks/useAuth'
import ResponsiveLayout from '../../../../components/responsive-layout'
import ChatButton from '../../../../components/chat/ChatButton'
import { 
  FaTicketAlt, 
  FaUser, 
  FaUserTie, 
  FaCalendar, 
  FaTag,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa'

// Mock de dados do ticket
const mockTicket = {
  id: '1',
  ticket_number: 'TK-2024-001',
  title: 'Problema com impressora no laboratório',
  description: 'A impressora do laboratório de informática não está funcionando corretamente. Quando tentamos imprimir, o documento sai com linhas duplicadas e com qualidade ruim.',
  status: 'InProgress',
  priority: 'High',
  category: 'Equipamentos',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:45:00Z',
  creator: {
    name: 'João Silva',
    email: 'joao.silva@senai.com'
  },
  assignee: {
    name: 'Maria Santos',
    email: 'maria.santos@senai.com'
  }
}

export default function TicketExamplePage() {
  const { theme } = useTheme()
  const { user } = useRequireAuth()
  const [ticket, setTicket] = useState(mockTicket)
  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <FaExclamationCircle className="text-blue-600" />
      case 'InProgress':
        return <FaClock className="text-yellow-600" />
      case 'Resolved':
        return <FaCheckCircle className="text-green-600" />
      default:
        return <FaTicketAlt className="text-gray-600" />
    }
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Usuário Teste"
      userEmail="teste@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header do Ticket */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600">
                <FaTicketAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ticket.title}
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  #{ticket.ticket_number}
                </p>
              </div>
            </div>

            {/* Botão do Chat */}
            <div className="flex items-center space-x-3">
              <ChatButton 
                ticketId={ticket.id}
                size="md"
                variant="primary"
              />
            </div>
          </div>

          {/* Status e Prioridade */}
          <div className="flex items-center space-x-4 mb-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              <span className="font-medium">{ticket.status}</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
              <FaTag className="text-sm" />
              <span className="font-medium">{ticket.priority}</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <FaTag className="text-sm" />
              <span className="font-medium">{ticket.category}</span>
            </div>
          </div>
        </div>

        {/* Informações do Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalhes Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Descrição
              </h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {ticket.description}
              </p>
            </div>

            {/* Histórico (simulado) */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Histórico
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Chamado criado
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(ticket.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Técnico atribuído
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(ticket.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Cliente
              </h3>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <FaUser className="text-blue-600 text-sm" />
                </div>
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {ticket.creator.name}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {ticket.creator.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Informações do Técnico */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Técnico Atribuído
              </h3>
              {ticket.assignee ? (
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <FaUserTie className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {ticket.assignee.name}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {ticket.assignee.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaClock className="text-2xl mx-auto mb-2" />
                  <p className="text-sm">Aguardando atribuição</p>
                </div>
              )}
            </div>

            {/* Datas */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Datas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FaCalendar className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Criado em
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(ticket.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCalendar className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Atualizado em
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(ticket.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
