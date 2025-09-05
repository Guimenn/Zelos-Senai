import { useState, useEffect, useCallback } from 'react'
import { authCookies } from '../utils/cookies'

interface TicketInfo {
  id: number
  ticket_number: string
  title: string
  status: string
  priority: string
  assigned_to?: {
    name: string
  }
}

export function useValidTicketIds() {
  const [validTickets, setValidTickets] = useState<TicketInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchValidTickets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = authCookies.getToken()
      if (!token) {
        setError('Token de autenticação não encontrado')
        return
      }

      // Tentar buscar tickets do usuário
      const endpoints = [
        '/helpdesk/tickets',
        '/helpdesk/client/my-tickets',
        '/helpdesk/agents/my-tickets'
      ]

      let tickets: TicketInfo[] = []
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Buscando tickets em: ${endpoint}`)
          
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            
            // Normalizar dados baseado na estrutura da resposta
            if (Array.isArray(data)) {
              tickets = data
            } else if (data.tickets && Array.isArray(data.tickets)) {
              tickets = data.tickets
            } else if (data.data && Array.isArray(data.data)) {
              tickets = data.data
            }
            
            console.log(`✅ Encontrados ${tickets.length} tickets em: ${endpoint}`)
            break
          } else {
            const errorText = await response.text()
            console.log(`❌ Falha em ${endpoint}: ${response.status} - ${errorText}`)
            lastError = `Status ${response.status}: ${errorText}`
          }
        } catch (error) {
          console.log(`❌ Erro de rede em ${endpoint}:`, error)
          lastError = error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }

      if (tickets.length === 0) {
        setError(`Nenhum ticket encontrado. Último erro: ${lastError}`)
      } else {
        setValidTickets(tickets)
        console.log('📋 Tickets válidos encontrados:', tickets)
      }

    } catch (error) {
      console.error('Erro ao buscar tickets válidos:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchValidTickets()
  }, [fetchValidTickets])

  const getTicketById = (id: string) => {
    return validTickets.find(ticket => ticket.id.toString() === id)
  }

  const getFirstValidTicketId = () => {
    return validTickets.length > 0 ? validTickets[0].id.toString() : '1'
  }

  const getOpenTickets = () => {
    return validTickets.filter(ticket => 
      ticket.status !== 'Closed' && 
      ticket.status !== 'Cancelled' && 
      ticket.status !== 'Resolved'
    )
  }

  const getTicketsWithAssignee = () => {
    return validTickets.filter(ticket => ticket.assigned_to)
  }

  return {
    validTickets,
    isLoading,
    error,
    refresh: fetchValidTickets,
    getTicketById,
    getFirstValidTicketId,
    getOpenTickets,
    getTicketsWithAssignee
  }
}
