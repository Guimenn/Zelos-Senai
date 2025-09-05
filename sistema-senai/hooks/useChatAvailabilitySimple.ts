import { useState, useEffect, useCallback } from 'react'
import { authCookies } from '../utils/cookies'

interface ChatAvailability {
  isAvailable: boolean
  isLoading: boolean
  error: string | null
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

export function useChatAvailabilitySimple(ticketId: string) {
  const [chatAvailability, setChatAvailability] = useState<ChatAvailability>({
    isAvailable: false,
    isLoading: true,
    error: null
  })

  const checkChatAvailability = useCallback(async () => {
    try {
      setChatAvailability(prev => ({ ...prev, isLoading: true, error: null }))
      
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
      console.log('🎫 Ticket ID:', ticketId)
      
      // Tentar apenas o endpoint principal
      const endpoint = `/helpdesk/tickets/${ticketId}`
      console.log(`🔍 Tentando endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Status da resposta: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Erro: ${errorText}`)
        
        // Tratar erros específicos
        if (response.status === 404) {
          throw new Error(`Ticket ${ticketId} não encontrado ou você não tem permissão para acessá-lo`)
        } else if (response.status === 403) {
          throw new Error(`Você não tem permissão para acessar este ticket`)
        } else {
          throw new Error(`Status ${response.status}: ${errorText}`)
        }
      }

      const ticketData = await response.json()
      console.log('📋 Dados do ticket recebidos:', ticketData)

      // Verificar se o chat está disponível
      const hasAssignee = !!(ticketData.assigned_to || ticketData.assignee)
      const isNotClosed = ticketData.status !== 'Closed' && ticketData.status !== 'Cancelled'
      
      const isAvailable = hasAssignee && isNotClosed

      console.log('✅ Chat disponível?', isAvailable)
      console.log('👤 Tem técnico?', hasAssignee)
      console.log('📊 Não está fechado?', isNotClosed)

      setChatAvailability({
        isAvailable,
        isLoading: false,
        error: null,
        ticketData: {
          id: ticketData.id,
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
        }
      })

    } catch (error) {
      console.error('Erro ao verificar disponibilidade do chat:', error)
      setChatAvailability({
        isAvailable: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }, [ticketId])

  useEffect(() => {
    if (!ticketId) {
      setChatAvailability({
        isAvailable: false,
        isLoading: false,
        error: null
      })
      return
    }

    checkChatAvailability()
  }, [ticketId, checkChatAvailability])

  const refreshAvailability = () => {
    checkChatAvailability()
  }

  return {
    ...chatAvailability,
    refreshAvailability
  }
}
