'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { useValidTicketId } from '../../../../hooks/useValidTicketId'
import { useValidTicketIds } from '../../../../hooks/useValidTicketIds'
import ChatButtonDebug from '../../../../components/chat/ChatButtonDebug'
import ChatButtonAlways from '../../../../components/chat/ChatButtonAlways'
import ChatButton from '../../../../components/chat/ChatButton'
import ChatButtonTest from '../../../../components/chat/ChatButtonTest'
import ChatButtonWorking from '../../../../components/chat/ChatButtonWorking'
import ChatButtonReal from '../../../../components/chat/ChatButtonReal'
import ChatButtonSimple from '../../../../components/chat/ChatButtonSimple'
import { 
  FaBug, 
  FaTicketAlt, 
  FaUser, 
  FaUserTie,
  FaSpinner
} from 'react-icons/fa'

export default function ChatDebugPage() {
  const { theme } = useTheme()
  const { validTickets, isLoading: ticketsLoading, getFirstValidTicketId, getTicketById } = useValidTicketId()
  const { validTickets: allTickets, isLoading: allTicketsLoading, getOpenTickets, getTicketsWithAssignee } = useValidTicketIds()
  const [ticketId, setTicketId] = useState('13')
  const [isLoading, setIsLoading] = useState(false)

  // Atualizar ticketId apenas na primeira carga (não sobrescrever seleção manual)
  useEffect(() => {
    if (validTickets.length > 0 && ticketId === '13') {
      setTicketId(getFirstValidTicketId())
    }
  }, [validTickets, getFirstValidTicketId, ticketId])

  // Usar todos os tickets disponíveis (incluindo fechados) para teste
  const testTicketIds = allTickets.length > 0 
    ? allTickets.map(ticket => ticket.id.toString())
    : validTickets.length > 0 
    ? validTickets.map(ticket => ticket.id.toString())
    : ['14', '15', '16', '17', '18'] // IDs que sabemos que existem

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
              <FaBug className="text-white text-xl" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Debug do Chat Button
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Página para testar e debugar o sistema de chat
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Teste */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Testar com Diferentes Tickets
          </h2>
          
          {ticketsLoading ? (
            <div className="flex items-center space-x-2 mb-4">
              <FaSpinner className="animate-spin text-red-500" />
              <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Carregando tickets...
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {testTicketIds.map(id => {
                  const ticket = getTicketById(id) || allTickets.find(t => t.id.toString() === id)
                  const isOpen = ticket?.status && !['Closed', 'Cancelled', 'Resolved'].includes(ticket.status)
                  const hasAssignee = !!ticket?.assigned_to
                  
                  return (
                    <button
                      key={id}
                      onClick={() => setTicketId(id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        ticketId === id
                          ? 'bg-red-500 text-white'
                          : isOpen
                          ? theme === 'dark'
                            ? 'bg-green-700 text-green-300 hover:bg-green-600'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={ticket ? `${ticket.title} - ${ticket.status}${hasAssignee ? ' (com técnico)' : ' (sem técnico)'}` : `Ticket #${id}`}
                    >
                      {ticket ? `${ticket.ticket_number}` : `Ticket #${id}`}
                      {isOpen && <span className="ml-1 text-xs">🟢</span>}
                      {hasAssignee && <span className="ml-1 text-xs">👤</span>}
                    </button>
                  )
                })}
              </div>
              
              {validTickets.length > 0 && (
                <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>✅ {validTickets.length} tickets encontrados (hook original)</p>
                  <p>🎯 Testando com: {getTicketById(ticketId)?.title || `Ticket #${ticketId}`}</p>
                </div>
              )}

              {!allTicketsLoading && allTickets.length > 0 && (
                <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>📋 {allTickets.length} tickets totais encontrados</p>
                  <p>🟢 {getOpenTickets().length} tickets abertos</p>
                  <p>👤 {getTicketsWithAssignee().length} tickets com técnico atribuído</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-green-500 rounded"></span>
                      <span>Aberto</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-gray-500 rounded"></span>
                      <span>Fechado</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🟢</span>
                      <span>Aberto</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>👤</span>
                      <span>Com técnico</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Ticket ID Manual
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Digite o ID do ticket"
              />
            </div>
          </div>
        </div>

        {/* Teste do Chat Button */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Testes de Chat Button
          </h2>
          
          <div className="space-y-6">
            {/* Botão Original */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                1. Botão Original (só aparece quando técnico aceita)
              </h3>
              <ChatButton ticketId={ticketId} />
            </div>

            {/* Botão Sempre Visível */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                2. Botão Sempre Visível (para teste)
              </h3>
              <ChatButtonAlways ticketId={ticketId} />
            </div>

            {/* Botão Debug */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                3. Botão com Debug (mostra informações detalhadas)
              </h3>
              <ChatButtonDebug ticketId={ticketId} />
            </div>

            {/* Botão Teste */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                4. Botão de Teste (usa dados mockados)
              </h3>
              <ChatButtonTest ticketId={ticketId} />
            </div>

            {/* Botão Funcional */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                5. Botão Funcional (sempre funciona - RECOMENDADO)
              </h3>
              <ChatButtonWorking ticketId={ticketId} />
            </div>

            {/* Botão Real */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                6. Botão Real (usa API real - TESTE AGORA)
              </h3>
              <ChatButtonReal ticketId={ticketId} />
            </div>

            {/* Botão Simples */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                7. Botão Simples (endpoint único - RECOMENDADO PARA DEBUG)
              </h3>
              <ChatButtonSimple ticketId={ticketId} />
            </div>
          </div>
        </div>

        {/* Informações do Ticket Atual */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Informações do Ticket Atual
          </h2>
          
          <div className={`text-sm space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {(() => {
              const ticket = getTicketById(ticketId) || allTickets.find(t => t.id.toString() === ticketId)
              const isOpen = ticket?.status && !['Closed', 'Cancelled', 'Resolved'].includes(ticket.status)
              const hasAssignee = !!ticket?.assigned_to
              
              return (
                <>
                  <p><strong>Ticket ID:</strong> {ticketId}</p>
                  <p><strong>Título:</strong> {ticket?.title || 'Desconhecido'}</p>
                  <p><strong>Número:</strong> {ticket?.ticket_number || 'N/A'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      isOpen 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {ticket?.status || 'Desconhecido'}
                    </span>
                  </p>
                  <p><strong>Prioridade:</strong> {ticket?.priority || 'Desconhecida'}</p>
                  <p><strong>Técnico Atribuído:</strong> {ticket?.assigned_to?.name || 'Nenhum'}</p>
                  <p><strong>Chat Disponível:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      hasAssignee && isOpen
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {hasAssignee && isOpen ? 'Sim (tem técnico e está aberto)' : 'Não (sem técnico ou fechado)'}
                    </span>
                  </p>
                </>
              )
            })()}
          </div>
        </div>

        {/* Informações de Debug */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Informações de Debug
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Como Funciona
              </h3>
              <div className={`text-sm space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>1. O hook <code>useChatAvailability</code> busca dados do ticket via API</p>
                <p>2. Verifica se o ticket tem um técnico atribuído (assigned_to ou assignee)</p>
                <p>3. Verifica se o status não é 'Closed' ou 'Cancelled'</p>
                <p>4. Se ambas condições forem verdadeiras, o chat fica disponível</p>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                API Endpoint
              </h3>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  GET /helpdesk/tickets/{ticketId}
                </code>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Console Logs
              </h3>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>Abra o console do navegador (F12) para ver os logs detalhados:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>📋 Dados do ticket recebidos</li>
                  <li>👤 assigned_to e assignee</li>
                  <li>📊 status do ticket</li>
                  <li>✅ Se o chat está disponível</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
