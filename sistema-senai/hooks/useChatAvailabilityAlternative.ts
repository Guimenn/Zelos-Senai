import { useState, useEffect } from 'react'
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

export function useChatAvailabilityAlternative(ticketId: string) {
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
  }, [ticketId])

  const checkChatAvailability = async () => {
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

      // Tentar diferentes endpoints
      const endpoints = [
        `/helpdesk/tickets/${ticketId}`,
        `/helpdesk/tickets/${ticketId}/`,
        `/tickets/${ticketId}`,
        `/api/tickets/${ticketId}`
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

          if (response.ok) {
            ticketData = await response.json()
            console.log(`✅ Sucesso com endpoint: ${endpoint}`)
            break
          } else {
            console.log(`❌ Falha com endpoint: ${endpoint} - Status: ${response.status}`)
            lastError = `Status ${response.status}`
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
      const hasAssignee = !!(
        ticketData.assigned_to || 
        ticketData.assignee ||
        ticketData.assigned_to_id ||
        ticketData.assignee_id
      )
      const isNotClosed = ticketData.status !== 'Closed' && ticketData.status !== 'Cancelled'
      
      const isAvailable = hasAssignee && isNotClosed

      console.log('✅ Chat disponível?', isAvailable)
      console.log('👤 Tem técnico?', hasAssignee)
      console.log('📊 Não está fechado?', isNotClosed)

      // Mapear dados do técnico
      let assignedToData: { name: string; email: string } | undefined = undefined
      if (ticketData.assignee) {
        assignedToData = {
          name: ticketData.assignee.name || ticketData.assignee.full_name,
          email: ticketData.assignee.email
        }
      } else if (ticketData.assigned_to) {
        assignedToData = {
          name: ticketData.assigned_to.name || ticketData.assigned_to.full_name,
          email: ticketData.assigned_to.email
        }
      }

      setChatAvailability({
        isAvailable,
        isLoading: false,
        error: null,
        ticketData: {
          id: ticketData.id,
          title: ticketData.title,
          ticket_number: ticketData.ticket_number || ticketData.ticketNumber,
          status: ticketData.status,
          priority: ticketData.priority,
          created_by: ticketData.creator ? {
            name: ticketData.creator.name || ticketData.creator.full_name,
            email: ticketData.creator.email
          } : undefined,
          assigned_to: assignedToData || undefined
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
  }

  const refreshAvailability = () => {
    checkChatAvailability()
  }

  return {
    ...chatAvailability,
    refreshAvailability
  }
}
