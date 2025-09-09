import { useState, useEffect, useCallback, useRef } from 'react'
import { authCookies } from '../utils/cookies'

interface ChatAvailability {
  isAvailable: boolean
  isLoading: boolean
  error: string | null
  canSend: boolean
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
  chatAccess?: {
    canAccess: boolean
    canSend: boolean
    reason: string
    ticketStatus: string
  }
}

export function useChatAvailability(ticketId: string, pausePolling: boolean = false, isHistoryMode: boolean = false) {
  const [chatAvailability, setChatAvailability] = useState<ChatAvailability>({
    isAvailable: false,
    isLoading: true,
    error: null,
    canSend: false
  })
  const [hasInitialized, setHasInitialized] = useState(false)
  const [shouldPoll, setShouldPoll] = useState(true)
  const [isWaitingForTechnician, setIsWaitingForTechnician] = useState(false)

  const checkChatAvailability = useCallback(async () => {
    try {
      // Só mostrar loading na primeira verificação
      if (!hasInitialized) {
        setChatAvailability(prev => ({ ...prev, isLoading: true, error: null }))
      }
      
      const token = authCookies.getToken()
      if (!token) {
        setChatAvailability({
          isAvailable: false,
          isLoading: false,
          error: 'Token de autenticação não encontrado'
        })
        return
      }

      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não')
      console.log('🔑 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A')
      console.log('🎫 Ticket ID:', ticketId)
      console.log('🎫 Ticket ID type:', typeof ticketId)
      
      // Verificar se o token é válido e obter role
      let userRole = null
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]))
          userRole = decoded.role || decoded.userRole
          console.log('👤 Usuário do token:', decoded.userId, 'Role:', userRole)
        } catch (e) {
          console.log('❌ Token inválido ou corrompido')
        }
      }

      // Primeiro, buscar informações do ticket para verificar se há técnico atribuído
      console.log(`🔍 Verificando informações do ticket`)
      
      const ticketResponse = await fetch(`/helpdesk/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Status da resposta do ticket: ${ticketResponse.status}`)

      if (!ticketResponse.ok) {
        const errorText = await ticketResponse.text()
        console.log(`❌ Erro ao buscar ticket: ${ticketResponse.status} - ${errorText}`)
        throw new Error(`Status ${ticketResponse.status}: ${errorText}`)
      }

      const ticketData = await ticketResponse.json()
      console.log(`✅ Dados do ticket:`, ticketData)
      
      // Verificar se o ticket está fechado primeiro
      const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticketData.status)
      console.log('🔒 Ticket fechado?', isClosed)
      console.log('📊 Status do ticket:', ticketData.status)
      console.log('📚 Modo histórico?', isHistoryMode)
      
      if (isClosed && !isHistoryMode) {
        console.log('❌ Chat não disponível: ticket fechado (modo ativo)')
        setChatAvailability({
          isAvailable: false,
          isLoading: false,
          error: null,
          canSend: false,
          ticketData: {
            id: ticketData.id.toString(),
            title: ticketData.title,
            ticket_number: ticketData.ticket_number,
            status: ticketData.status,
            priority: ticketData.priority,
            created_by: ticketData.creator ? {
              name: ticketData.creator.name,
              email: ticketData.creator.email
            } : undefined,
            assigned_to: (ticketData.assignee || ticketData.assigned_to) ? {
              name: (ticketData.assignee || ticketData.assigned_to).name,
              email: (ticketData.assignee || ticketData.assigned_to).email
            } : undefined
          },
          chatAccess: {
            canAccess: false,
            canSend: false,
            reason: 'Ticket fechado - chat não disponível',
            ticketStatus: ticketData.status
          }
        })
        return
      }
      
      if (isClosed && isHistoryMode) {
        console.log('📚 Modo histórico: permitindo chat em modo leitura para ticket fechado')
        // No modo histórico, permitir chat em modo leitura mesmo para tickets fechados
        // Mas só se houver mensagens ou se o usuário tem permissão
      }
      
      // Verificar se há técnico atribuído
      const hasAssignee = !!(ticketData.assigned_to || ticketData.assignee)
      console.log('👤 Tem técnico atribuído?', hasAssignee)
      console.log('👤 Técnico assigned_to:', ticketData.assigned_to)
      console.log('👤 Técnico assignee:', ticketData.assignee)
      console.log('👤 Técnico (qualquer um):', ticketData.assigned_to || ticketData.assignee)

      // Se não há técnico atribuído, o chat não está disponível (exceto no modo histórico)
      if (!hasAssignee && !isHistoryMode) {
        console.log('❌ Chat não disponível: nenhum técnico atribuído (modo ativo)')
        setIsWaitingForTechnician(true)
        setChatAvailability({
          isAvailable: false,
          isLoading: false,
          error: null,
          canSend: false,
          ticketData: {
            id: ticketData.id.toString(),
            title: ticketData.title,
            ticket_number: ticketData.ticket_number,
            status: ticketData.status,
            priority: ticketData.priority,
            created_by: ticketData.creator ? {
              name: ticketData.creator.name,
              email: ticketData.creator.email
            } : undefined,
            assigned_to: (ticketData.assignee || ticketData.assigned_to) ? {
              name: (ticketData.assignee || ticketData.assigned_to).name,
              email: (ticketData.assignee || ticketData.assigned_to).email
            } : undefined
          },
          chatAccess: {
            canAccess: false,
            canSend: false,
            reason: 'Aguardando técnico aceitar o chamado',
            ticketStatus: ticketData.status
          }
        })
        return
      }
      
      if (!hasAssignee && isHistoryMode) {
        console.log('📚 Modo histórico: verificando se há mensagens existentes')
        // No modo histórico, só permitir se houver mensagens existentes
        // Verificar se existem mensagens para este ticket
        try {
          const messagesResponse = await fetch(`/api/messages/list?ticket_id=${ticketId}&is_history_mode=true`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            const hasMessages = messagesData.messages && messagesData.messages.length > 0
            
            if (!hasMessages) {
              console.log('❌ Modo histórico: sem mensagens existentes')
              setChatAvailability({
                isAvailable: false,
                isLoading: false,
                error: null,
                canSend: false,
                ticketData: {
                  id: ticketData.id.toString(),
                  title: ticketData.title,
                  ticket_number: ticketData.ticket_number,
                  status: ticketData.status,
                  priority: ticketData.priority,
                  created_by: ticketData.creator ? {
                    name: ticketData.creator.name,
                    email: ticketData.creator.email
                  } : undefined,
                  assigned_to: (ticketData.assignee || ticketData.assigned_to) ? {
                    name: (ticketData.assignee || ticketData.assigned_to).name,
                    email: (ticketData.assignee || ticketData.assigned_to).email
                  } : undefined
                },
                chatAccess: {
                  canAccess: false,
                  canSend: false,
                  reason: 'Nenhuma mensagem encontrada',
                  ticketStatus: ticketData.status
                }
              })
              return
            } else {
              console.log('✅ Modo histórico: mensagens encontradas, permitindo acesso')
            }
          }
        } catch (error) {
          console.log('❌ Erro ao verificar mensagens:', error)
          // Em caso de erro, não permitir acesso
          setChatAvailability({
            isAvailable: false,
            isLoading: false,
            error: null,
            canSend: false,
            ticketData: {
              id: ticketData.id.toString(),
              title: ticketData.title,
              ticket_number: ticketData.ticket_number,
              status: ticketData.status,
              priority: ticketData.priority,
              created_by: ticketData.creator ? {
                name: ticketData.creator.name,
                email: ticketData.creator.email
              } : undefined,
              assigned_to: (ticketData.assignee || ticketData.assigned_to) ? {
                name: (ticketData.assignee || ticketData.assigned_to).name,
                email: (ticketData.assignee || ticketData.assigned_to).email
              } : undefined
            },
            chatAccess: {
              canAccess: false,
              canSend: false,
              reason: 'Erro ao verificar mensagens',
              ticketStatus: ticketData.status
            }
          })
          return
        }
      }

      // Se há técnico atribuído, verificar acesso via API de mensagens
      console.log(`🔍 Verificando acesso ao chat via API de mensagens`)
      
      const response = await fetch(`/api/messages/list?ticket_id=${ticketId}&is_history_mode=${isHistoryMode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Status da resposta: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Erro na API de mensagens: ${response.status} - ${errorText}`)
        throw new Error(`Status ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const { messages, chatAccess } = data
      
      console.log(`✅ Acesso verificado via API de mensagens`)
      console.log(`📋 Chat access:`, chatAccess)
      console.log(`📋 Mensagens encontradas:`, messages?.length || 0)

      // Usar as informações de acesso retornadas pela API
      let isAvailable = chatAccess.canAccess
      let canSend = chatAccess.canSend

      // No modo histórico, permitir acesso mesmo se a API retornar canAccess: false
      if (isHistoryMode && !isAvailable) {
        console.log('📚 Modo histórico: forçando acesso ao chat para leitura')
        isAvailable = true
        canSend = false // No modo histórico, sempre apenas leitura
      }

      console.log('✅ Chat disponível?', isAvailable)
      console.log('✅ Pode enviar mensagens?', canSend)
      console.log('📋 Motivo:', chatAccess.reason)
      console.log('📊 Status do ticket:', chatAccess.ticketStatus)

      setChatAvailability({
        isAvailable,
        isLoading: false,
        error: null,
        canSend,
        ticketData: {
          id: ticketData.id.toString(),
          title: ticketData.title,
          ticket_number: ticketData.ticket_number,
          status: ticketData.status,
          priority: ticketData.priority,
          created_by: ticketData.creator ? {
            name: ticketData.creator.name,
            email: ticketData.creator.email
          } : undefined,
          assigned_to: (ticketData.assignee || ticketData.assigned_to) ? {
            name: (ticketData.assignee || ticketData.assigned_to).name,
            email: (ticketData.assignee || ticketData.assigned_to).email
          } : undefined
        },
        chatAccess
      })
      
      // Marcar como inicializado após primeira verificação bem-sucedida
      if (!hasInitialized) {
        setHasInitialized(true)
      }

      // Se o chat está disponível e não é modo histórico, parar o polling
      if (isAvailable && !isHistoryMode) {
        console.log('✅ Chat disponível - parando polling para economizar recursos')
        setShouldPoll(false)
        setIsWaitingForTechnician(false)
      }

    } catch (error) {
      // Se for erro de "no messages", não mostrar como erro
      if (error.message && error.message.includes('chat.noMessages')) {
        console.log('📚 Modo histórico: sem mensagens existentes - ocultando erro')
        setChatAvailability({
          isAvailable: false,
          isLoading: false,
          error: null,
          canSend: false,
          ticketData: null,
          chatAccess: null
        })
        return
      }
      
      console.error('Erro ao verificar disponibilidade do chat:', error)
      setChatAvailability({
        isAvailable: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }, [ticketId, hasInitialized])

  // Usar ref para evitar loop infinito
  const checkChatAvailabilityRef = useRef(checkChatAvailability)
  checkChatAvailabilityRef.current = checkChatAvailability

  useEffect(() => {
    if (!ticketId) {
      setChatAvailability({
        isAvailable: false,
        isLoading: false,
        error: null
      })
      return
    }

    // Verificação inicial
    checkChatAvailabilityRef.current()

    // Listener para eventos de mudança de ticket
    const handleTicketUpdate = (event: CustomEvent) => {
      if (event.detail?.ticketId === ticketId) {
        console.log('🔄 Evento de atualização de ticket detectado - verificando chat imediatamente')
        checkChatAvailabilityRef.current()
      }
    }

    // Escutar eventos de atualização de ticket
    window.addEventListener('ticketUpdated', handleTicketUpdate as EventListener)
    window.addEventListener('ticketAssigned', handleTicketUpdate as EventListener)
    window.addEventListener('ticketAccepted', handleTicketUpdate as EventListener)

    // Se o polling estiver pausado ou não deve mais fazer polling, não criar o interval
    if (pausePolling || !shouldPoll) {
      return () => {
        window.removeEventListener('ticketUpdated', handleTicketUpdate as EventListener)
        window.removeEventListener('ticketAssigned', handleTicketUpdate as EventListener)
        window.removeEventListener('ticketAccepted', handleTicketUpdate as EventListener)
      }
    }

    // Polling automático para verificar mudanças no ticket (ex: técnico aceitar)
    // Se está esperando técnico, verificar mais frequentemente
    const pollingInterval = isWaitingForTechnician ? 500 : 1000 // 500ms se esperando técnico, 1s caso contrário
    const interval = setInterval(() => {
      checkChatAvailabilityRef.current()
    }, pollingInterval)

    return () => {
      clearInterval(interval)
      window.removeEventListener('ticketUpdated', handleTicketUpdate as EventListener)
      window.removeEventListener('ticketAssigned', handleTicketUpdate as EventListener)
      window.removeEventListener('ticketAccepted', handleTicketUpdate as EventListener)
    }
  }, [ticketId, pausePolling, shouldPoll, isWaitingForTechnician]) // Adicionar todas as dependências

  const refreshAvailability = () => {
    checkChatAvailability()
  }

  const restartPolling = () => {
    setShouldPoll(true)
    setIsWaitingForTechnician(true)
    checkChatAvailability()
  }

  const forceCheck = () => {
    console.log('🔄 Forçando verificação imediata do chat')
    checkChatAvailability()
  }

  return {
    ...chatAvailability,
    refreshAvailability,
    restartPolling,
    forceCheck
  }
}
