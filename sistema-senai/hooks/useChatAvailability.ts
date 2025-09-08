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

export function useChatAvailability(ticketId: string, pausePolling: boolean = false) {
  const [chatAvailability, setChatAvailability] = useState<ChatAvailability>({
    isAvailable: false,
    isLoading: true,
    error: null,
    canSend: false
  })
  const [hasInitialized, setHasInitialized] = useState(false)

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
      
      if (isClosed) {
        console.log('❌ Chat não disponível: ticket fechado')
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
      
      // Verificar se há técnico atribuído
      const hasAssignee = !!(ticketData.assigned_to || ticketData.assignee)
      console.log('👤 Tem técnico atribuído?', hasAssignee)
      console.log('👤 Técnico assigned_to:', ticketData.assigned_to)
      console.log('👤 Técnico assignee:', ticketData.assignee)
      console.log('👤 Técnico (qualquer um):', ticketData.assigned_to || ticketData.assignee)

      // Se não há técnico atribuído, o chat não está disponível
      if (!hasAssignee) {
        console.log('❌ Chat não disponível: nenhum técnico atribuído')
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

      // Se há técnico atribuído, verificar acesso via API de mensagens
      console.log(`🔍 Verificando acesso ao chat via API de mensagens`)
      
      const response = await fetch(`/api/messages/list?ticket_id=${ticketId}`, {
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
      const isAvailable = chatAccess.canAccess
      const canSend = chatAccess.canSend

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

    } catch (error) {
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

    // Se o polling estiver pausado, não criar o interval
    if (pausePolling) {
      return
    }

    // Polling automático para verificar mudanças no ticket (ex: técnico aceitar)
    const interval = setInterval(() => {
      checkChatAvailabilityRef.current()
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(interval)
  }, [ticketId, pausePolling]) // Adicionar pausePolling às dependências

  const refreshAvailability = () => {
    checkChatAvailability()
  }

  return {
    ...chatAvailability,
    refreshAvailability
  }
}
