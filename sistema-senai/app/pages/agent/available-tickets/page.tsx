'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useTheme } from '../../../../hooks/useTheme'
import { authCookies } from '../../../../utils/cookies'

interface TicketItem {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  category?: { name: string }
  subcategory?: { name: string }
  client?: { user?: { name?: string } }
}

export default function AvailableTicketsPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = authCookies.getToken()
        if (!token) {
          router.push('/pages/auth/login')
          return
        }
        const res = await fetch('http://localhost:3001/helpdesk/agents/available-tickets', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Falha ao carregar tickets disponíveis')
        }
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.tickets ?? [])
        setTickets(items)
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const accept = async (ticketId: number) => {
    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Sessão expirada')
      const res = await fetch(`http://localhost:3001/helpdesk/agents/ticket/${ticketId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Falha ao aceitar ticket')
      }
      setTickets(prev => prev.filter(t => t.id !== ticketId))
      router.push('/pages/called')
    } catch (e: any) {
      alert(e?.message || 'Erro ao aceitar ticket')
    }
  }

  return (
    <ResponsiveLayout
      userType="tecnico"
      userName="Técnico"
      userEmail=""
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Tickets Disponíveis
        </h1>

        {loading ? (
          <div className="text-center py-10">Carregando...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <div className="space-y-3">
            {tickets.length === 0 && (
              <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Nenhum ticket disponível
              </div>
            )}
            {tickets.map((t) => (
              <div key={t.id} className={`rounded-xl p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>#{t.ticket_number || t.id} — {t.title}</div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>{t.description}</div>
                    <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs mt-2`}>
                      {t.category?.name} {t.subcategory?.name ? `· ${t.subcategory?.name}` : ''}
                    </div>
                  </div>
                  <button onClick={() => accept(t.id)} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Aceitar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}


