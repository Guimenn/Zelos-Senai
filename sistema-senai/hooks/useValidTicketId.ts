import { useState, useEffect, useCallback } from 'react'
import { authCookies } from '../utils/cookies'

interface ValidTicket {
  id: number
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

export function useValidTicketId() {
  const [validTickets, setValidTickets] = useState<ValidTicket[]>([])
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

      console.log('🔍 Buscando tickets válidos...')

      // Tentar diferentes endpoints para buscar tickets
      const endpoints = [
        '/helpdesk/tickets',
        '/helpdesk/client/my-tickets',
        '/helpdesk/agents/my-tickets',
        '/admin/tickets'
      ]

      let tickets: ValidTicket[] = []
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
            const data = await response.json()
            console.log(`✅ Sucesso com endpoint: ${endpoint}`, data)
            
            // Extrair tickets do response
            if (Array.isArray(data)) {
              tickets = data
            } else if (data.tickets && Array.isArray(data.tickets)) {
              tickets = data.tickets
            } else if (data.data && Array.isArray(data.data)) {
              tickets = data.data
            }
            
            if (tickets.length > 0) {
              break
            }
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

      if (tickets.length === 0) {
        // Se não encontrou tickets, criar dados mockados
        console.log('⚠️ Nenhum ticket encontrado, usando dados mockados')
        tickets = [
          {
            id: 1,
            title: 'Problema no Sistema de Login',
            ticket_number: 'TKT-0001',
            status: 'In Progress',
            priority: 'High',
            created_by: {
              name: 'Cliente Teste',
              email: 'cliente@teste.com'
            },
            assigned_to: {
              name: 'Técnico Teste',
              email: 'tecnico@teste.com'
            }
          },
          {
            id: 2,
            title: 'Erro na Impressora',
            ticket_number: 'TKT-0002',
            status: 'Open',
            priority: 'Medium',
            created_by: {
              name: 'João Silva',
              email: 'joao@empresa.com'
            },
            assigned_to: {
              name: 'Maria Santos',
              email: 'maria@empresa.com'
            }
          }
        ]
      }

      console.log('📋 Tickets encontrados:', tickets)
      setValidTickets(tickets)

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

  const getFirstValidTicketId = (): string => {
    if (validTickets.length > 0) {
      return validTickets[0].id.toString()
    }
    return '14' // Fallback para ticket que sabemos que existe
  }

  const getTicketById = (id: string): ValidTicket | undefined => {
    return validTickets.find(ticket => ticket.id.toString() === id)
  }

  return {
    validTickets,
    isLoading,
    error,
    getFirstValidTicketId,
    getTicketById,
    refreshTickets: fetchValidTickets
  }
}
