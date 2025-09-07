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
  canSend?: boolean
}

export default function ChatModal({ isOpen, onClose, ticketId, ticketData, useTestMode = false, canSend = true }: ChatModalProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [ticketInfo, setTicketInfo] = useState(ticketData)
  const [chatAccess, setChatAccess] = useState<any>(null)
  const [clientAvatar, setClientAvatar] = useState<string | null>(null)
  const [technicianAvatar, setTechnicianAvatar] = useState<string | null>(null)
  
  // Logs para debug dos avatars
  useEffect(() => {
    console.log('🔍 Debug - clientAvatar state changed:', clientAvatar)
  }, [clientAvatar])
  
  useEffect(() => {
    console.log('🔍 Debug - technicianAvatar state changed:', technicianAvatar)
  }, [technicianAvatar])

  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Buscar informações do ticket e chat quando o modal abrir
  useEffect(() => {
    if (isOpen && ticketId) {
      const fetchTicketInfo = async () => {
        try {
          setIsLoading(true)
          
          // Buscar informações do chat (que inclui dados do ticket)
          const response = await fetch(`/api/messages/list?ticket_id=${ticketId}`, {
            headers: {
              'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setChatAccess(data.chatAccess)
            
            // Se não temos dados do ticket, buscar via API de tickets
            if (!ticketInfo) {
              const ticketResponse = await fetch(`/helpdesk/tickets/${ticketId}`, {
                headers: {
                  'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (ticketResponse.ok) {
                const ticketData = await ticketResponse.json()
                setTicketInfo(ticketData)
              }
            }

            // Buscar dados do ticket se não temos ainda
            const currentTicketInfo = ticketInfo || (await fetch(`/helpdesk/tickets/${ticketId}?t=${Date.now()}`, {
              headers: {
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            }).then(res => {
              console.log('🔍 Debug - Resposta da API:', res.status, res.statusText)
              return res.ok ? res.json() : null
            }))

            // Buscar avatars individualmente usando as APIs de usuário
            console.log('🔍 Debug - Buscando avatars individualmente...')
            
            if (currentTicketInfo) {
              const token = document.cookie.split('auth_token=')[1]?.split(';')[0]
              
              // Buscar avatar do cliente (created_by)
              if (currentTicketInfo.created_by?.email) {
                try {
                  console.log('🔍 Buscando avatar do cliente:', currentTicketInfo.created_by.email)
                  
                  // Primeiro, obter dados do usuário atual para comparação
                  const meResponse = await fetch('/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  
                  if (meResponse.ok) {
                    const meData = await meResponse.json()
                    console.log('✅ Usuário atual:', meData.email)
                    
                    // Se o cliente for o usuário atual, usar dados já conhecidos
                    if (currentTicketInfo.created_by.email === meData.email) {
                      console.log('✅ Avatar do cliente (usuário atual):', meData.avatar)
                      setClientAvatar(meData.avatar)
                    } else {
                      // Para outros usuários, tentar buscar via API de usuários
                      console.log('🔍 Buscando avatar do cliente via API de usuários...')
                      
                      // Tentar buscar todos os usuários e encontrar o correto
                      const usersResponse = await fetch('/user', {
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                      
                      if (usersResponse.ok) {
                        const usersData = await usersResponse.json()
                        console.log('✅ Lista de usuários:', usersData)
                        
                        // Encontrar o usuário pelo email
                        const clientUser = usersData.find((user: any) => 
                          user.email === currentTicketInfo.created_by?.email
                        )
                        
                        if (clientUser) {
                          console.log('✅ Cliente encontrado:', clientUser)
                          console.log('✅ Avatar do cliente:', clientUser.avatar)
                          setClientAvatar(clientUser.avatar)
                        } else {
                          console.log('⚠️ Cliente não encontrado na lista de usuários')
                          setClientAvatar(null)
                        }
                      } else {
                        console.log('❌ Erro ao buscar lista de usuários:', usersResponse.status)
                        setClientAvatar(null)
                      }
                    }
                  }
                } catch (error) {
                  console.error('❌ Erro ao buscar avatar do cliente:', error)
                }
              }

              // Buscar avatar do técnico (assigned_to)
              if (currentTicketInfo.assigned_to?.email) {
                try {
                  console.log('🔍 Buscando avatar do técnico:', currentTicketInfo.assigned_to.email)
                  
                  // Primeiro, obter dados do usuário atual para comparação
                  const meResponse = await fetch('/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  
                  if (meResponse.ok) {
                    const meData = await meResponse.json()
                    console.log('✅ Usuário atual:', meData.email)
                    
                    // Se o técnico for o usuário atual, usar dados já conhecidos
                    if (currentTicketInfo.assigned_to.email === meData.email) {
                      console.log('✅ Avatar do técnico (usuário atual):', meData.avatar)
                      setTechnicianAvatar(meData.avatar)
                    } else {
                      // Para outros usuários, tentar buscar via API de usuários
                      console.log('🔍 Buscando avatar do técnico via API de usuários...')
                      
                      // Tentar buscar todos os usuários e encontrar o correto
                      const usersResponse = await fetch('/user', {
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                      
                      if (usersResponse.ok) {
                        const usersData = await usersResponse.json()
                        console.log('✅ Lista de usuários:', usersData)
                        
                        // Encontrar o usuário pelo email
                        const technicianUser = usersData.find((user: any) => 
                          user.email === currentTicketInfo.assigned_to?.email
                        )
                        
                        if (technicianUser) {
                          console.log('✅ Técnico encontrado:', technicianUser)
                          console.log('✅ Avatar do técnico:', technicianUser.avatar)
                          setTechnicianAvatar(technicianUser.avatar)
                        } else {
                          console.log('⚠️ Técnico não encontrado na lista de usuários')
                          setTechnicianAvatar(null)
                        }
                      } else {
                        console.log('❌ Erro ao buscar lista de usuários:', usersResponse.status)
                        setTechnicianAvatar(null)
                      }
                    }
                  }
                } catch (error) {
                  console.error('❌ Erro ao buscar avatar do técnico:', error)
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar informações do ticket:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchTicketInfo()
    }
  }, [isOpen, ticketId, ticketInfo])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl h-[80vh] mx-auto rounded-xl shadow-xl ${
        theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header do Modal */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-red-500">
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
          
          <div className="flex items-center space-x-2">
          {/* Botão de Debug */}
          <button
            onClick={() => {
              const debugInfo = {
                ticketId,
                ticketInfo,
                ticketData,
                clientAvatar,
                technicianAvatar,
                chatAccess,
                useTestMode,
                timestamp: new Date().toISOString()
              }
              console.log('🔍 DEBUG ChatModal:', debugInfo)
              alert('Debug ChatModal enviado para console!')
            }}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                : 'text-blue-500 hover:text-blue-600 hover:bg-gray-100'
            }`}
            title="Debug ChatModal"
          >
            🔍
          </button>
            
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
        </div>

        {/* Informações dos Participantes */}
        {(ticketInfo || ticketData) && (
          <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Cliente */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
                    {clientAvatar ? (
                      <img 
                        src={clientAvatar} 
                        alt="Avatar do cliente" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar avatar do cliente:', clientAvatar)
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                        onLoad={() => {
                          console.log('✅ Avatar do cliente carregado com sucesso:', clientAvatar)
                        }}
                      />
                    ) : null}
                    <div className={`${clientAvatar ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm`}>
                      {getInitials((ticketInfo || ticketData)?.created_by?.name || 'Usuário')}
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Cliente
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(ticketInfo || ticketData)?.created_by?.name || 'Usuário'}
                    </p>
                  </div>
                </div>

                {/* Técnico */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
                    {technicianAvatar ? (
                      <img 
                        src={technicianAvatar} 
                        alt="Avatar do técnico" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar avatar do técnico:', technicianAvatar)
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                        onLoad={() => {
                          console.log('✅ Avatar do técnico carregado com sucesso:', technicianAvatar)
                        }}
                      />
                    ) : null}
                    <div className={`${technicianAvatar ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm`}>
                      {getInitials((ticketInfo || ticketData)?.assigned_to?.name || 'Técnico')}
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Técnico
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(ticketInfo || ticketData)?.assigned_to?.name || 'Aguardando atribuição'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status do Chamado */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (ticketInfo || ticketData)?.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                  (ticketInfo || ticketData)?.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
                  (ticketInfo || ticketData)?.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(ticketInfo || ticketData)?.status || 'Open'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (ticketInfo || ticketData)?.priority === 'High' ? 'bg-red-100 text-red-800' :
                  (ticketInfo || ticketData)?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  (ticketInfo || ticketData)?.priority === 'Low' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(ticketInfo || ticketData)?.priority || 'Normal'}
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
                canSend={chatAccess?.canSend ?? canSend}
              />
            )
          )}
        </div>

        {/* Footer do Modal */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Chat em Tempo Real</span> - 
              {chatAccess?.canSend ? 'Conversa ativa' : 'Modo somente leitura'}
              {chatAccess?.reason && (
                <span className="ml-2 text-xs opacity-75">
                  ({chatAccess.reason})
                </span>
              )}
            </div>
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Chamado #{(ticketInfo || ticketData)?.ticket_number || ticketId}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
