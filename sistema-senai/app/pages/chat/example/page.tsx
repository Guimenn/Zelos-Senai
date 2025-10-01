'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireAuth } from '../../../../hooks/useAuth'
import ResponsiveLayout from '../../../../components/responsive-layout'
import Chat from '../../../../components/chat/Chat'
import { FaComments, FaTicketAlt } from 'react-icons/fa'

export default function ChatExamplePage() {
  const { theme } = useTheme()
  const { user } = useRequireAuth()
  const [selectedTicketId, setSelectedTicketId] = useState<string>('1')

  // Simulação de tickets disponíveis
  const mockTickets = [
    { id: '1', title: 'Problema com impressora', status: 'Open' },
    { id: '2', title: 'Erro no sistema', status: 'InProgress' },
    { id: '3', title: 'Solicitação de acesso', status: 'Resolved' },
  ]

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Usuário Teste"
      userEmail="teste@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <FaComments className="text-2xl text-red-500" />
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sistema de Chat - Exemplo
            </h1>
          </div>
          
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Demonstração do sistema de chat em tempo real para helpdesk
          </p>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar com lista de tickets */}
          <div className={`w-80 border-r ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-4">
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Tickets Disponíveis
              </h2>
              
              <div className="space-y-2">
                {mockTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTicketId === ticket.id
                        ? 'bg-red-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FaTicketAlt className="text-sm" />
                      <div>
                        <p className="font-medium">#{ticket.id}</p>
                        <p className="text-sm opacity-75">{ticket.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Área do Chat */}
          <div className="flex-1 flex flex-col">
            {selectedTicketId ? (
              <Chat 
                ticketId={selectedTicketId} 
                className="flex-1"
              />
            ) : (
              <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <FaComments className="text-6xl text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Selecione um Ticket
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Escolha um ticket na barra lateral para iniciar o chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer com informações */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Chat em Tempo Real</span> - 
              Sistema integrado com Supabase
            </div>
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Ticket selecionado: #{selectedTicketId || 'Nenhum'}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
