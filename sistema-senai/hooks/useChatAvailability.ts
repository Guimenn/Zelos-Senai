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

export function useChatAvailability(ticketId: string) {
  const [chatAvailability, setChatAvailability] = useState<ChatAvailability>({
    isAvailable: false,
    isLoading: true,
    error: null
  })

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
      console.log('🔑 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A')
      console.log('🎫 Ticket ID:', ticketId)
      
      // Verificar se o token é válido
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]))
          console.log('👤 Usuário do token:', decoded.userId, 'Role:', decoded.role)
        } catch (e) {
          console.log('❌ Token inválido ou corrompido')
        }
      }

      // Tentar diferentes endpoints
      const endpoints = [
        `/helpdesk/tickets/${ticketId}`,
        `/helpdesk/tickets/${ticketId}/`,
        `/helpdesk/client/ticket/${ticketId}`,
        `/helpdesk/agents/ticket/${ticketId}`
      ]

      let ticketData = null
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Tentando endpoint: ${endpoint}`)
          
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          console.log(`📊 Status da resposta: ${response.status}`)

          if (response.ok) {
            ticketData = await response.json()
            console.log(`✅ Sucesso com endpoint: ${endpoint}`)
            break
          } else {
            const errorText = await response.text()
            console.log(`❌ Falha com endpoint: ${endpoint} - Status: ${response.status}`)
            console.log(`❌ Erro: ${errorText}`)
            lastError = `Status ${response.status}: ${errorText}`
          }
        } catch (error) {
          console.log(`❌ Erro com endpoint: ${endpoint}`, error)
          lastError = error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }

      if (!ticketData) {
        throw new Error(`Nenhum endpoint funcionou. Último erro: ${lastError}`)
      }

      // Debug: Log dos dados recebidos
      console.log('📋 Dados do ticket recebidos:', ticketData)
      console.log('👤 assigned_to:', ticketData.assigned_to)
      console.log('📊 status:', ticketData.status)
      console.log('👨‍💼 assignee:', ticketData.assignee)
      console.log('👤 creator:', ticketData.creator)

      // Verificar se o chat está disponível
      // O chat só está disponível quando:
      // 1. O ticket tem um técnico atribuído (assigned_to ou assignee)
      // 2. O status não é 'Closed' ou 'Cancelled'
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

  const refreshAvailability = () => {
    checkChatAvailability()
  }

  return {
    ...chatAvailability,
    refreshAvailability
  }
}
