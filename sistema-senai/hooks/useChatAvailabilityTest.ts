import { useState, useEffect } from 'react'

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

export function useChatAvailabilityTest(ticketId: string) {
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

    // Simular carregamento
    setTimeout(() => {
      // Dados de teste - sempre disponível
      const mockTicketData = {
        id: ticketId,
        title: `Ticket de Teste #${ticketId}`,
        ticket_number: `TKT-${ticketId.padStart(4, '0')}`,
        status: 'In Progress',
        priority: 'Medium',
        created_by: {
          name: 'Cliente Teste',
          email: 'cliente@teste.com'
        },
        assigned_to: {
          name: 'Técnico Teste',
          email: 'tecnico@teste.com'
        }
      }

      console.log('🧪 Dados de teste carregados:', mockTicketData)

      setChatAvailability({
        isAvailable: true, // Sempre disponível para teste
        isLoading: false,
        error: null,
        ticketData: mockTicketData
      })
    }, 1000)
  }, [ticketId])

  const refreshAvailability = () => {
    setChatAvailability(prev => ({ ...prev, isLoading: true }))
    // Recarregar dados de teste
    setTimeout(() => {
      const mockTicketData = {
        id: ticketId,
        title: `Ticket de Teste #${ticketId}`,
        ticket_number: `TKT-${ticketId.padStart(4, '0')}`,
        status: 'In Progress',
        priority: 'Medium',
        created_by: {
          name: 'Cliente Teste',
          email: 'cliente@teste.com'
        },
        assigned_to: {
          name: 'Técnico Teste',
          email: 'tecnico@teste.com'
        }
      }

      setChatAvailability({
        isAvailable: true,
        isLoading: false,
        error: null,
        ticketData: mockTicketData
      })
    }, 500)
  }

  return {
    ...chatAvailability,
    refreshAvailability
  }
}
