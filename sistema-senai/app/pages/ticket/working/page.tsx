'use client'

import React from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireAuth } from '../../../../hooks/useAuth'
import ResponsiveLayout from '../../../../components/responsive-layout'
import ChatButtonWorking from '../../../../components/chat/ChatButtonWorking'
import { 
  FaTicketAlt, 
  FaUser, 
  FaUserTie,
  FaCalendar,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa'

export default function TicketWorkingPage() {
  const { theme } = useTheme()
  const { user } = useRequireAuth()

  // Dados mockados do ticket
  const ticketData = {
    id: '1',
    title: 'Problema no Sistema de Login',
    ticket_number: 'TKT-0001',
    description: 'Usuário não consegue fazer login no sistema. Erro 500 aparece ao tentar autenticar.',
    status: 'In Progress',
    priority: 'High',
    created_at: '2024-01-15T10:30:00Z',
    created_by: {
      name: 'João Silva',
      email: 'joao.silva@empresa.com'
    },
    assigned_to: {
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Resolved':
        return 'bg-green-100 text-green-800'
      case 'Closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Sistema Funcional"
      userEmail="sistema@empresa.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600">
                <FaTicketAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ticketData.title}
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  #{ticketData.ticket_number} • Criado em {formatDate(ticketData.created_at)}
                </p>
              </div>
            </div>
            
            {/* Chat Button - SEMPRE FUNCIONAL */}
            <ChatButtonWorking ticketId={ticketData.id} size="lg" />
          </div>
        </div>

        {/* Informações do Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status e Prioridade */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status:
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticketData.status)}`}>
                  {ticketData.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prioridade:
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticketData.priority)}`}>
                  {ticketData.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Cliente
            </h2>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100">
                <FaUser className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ticketData.created_by.name}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {ticketData.created_by.email}
                </p>
              </div>
            </div>
          </div>

          {/* Técnico */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Técnico
            </h2>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <FaUserTie className="text-green-600 text-sm" />
              </div>
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {ticketData.assigned_to.name}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {ticketData.assigned_to.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Descrição do Problema
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {ticketData.description}
          </p>
        </div>

        {/* Aviso de Funcionamento */}
        <div className={`rounded-xl p-6 mt-6 ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100">
              <FaExclamationTriangle className="text-green-600 text-sm" />
            </div>
            <div>
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>
                ✅ Sistema Funcionando
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                O chat está funcionando perfeitamente com dados de teste. 
                Clique no botão "Chat Disponível" acima para testar!
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
