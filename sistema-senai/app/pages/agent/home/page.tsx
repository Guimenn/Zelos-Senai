'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { useTheme } from '../../../../hooks/useTheme'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { authCookies } from '../../../../utils/cookies'
import {
  FaTools,
  FaTicketAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaWrench,
  FaPlay,
  FaPause,
  FaStop,
  FaComments,
  FaPlus,
  FaEye,
  FaBell,
  FaChartLine,
  FaStar,
  FaClipboardCheck,
  FaHeadset,
  FaArrowRight,
  FaFilter,
  FaSearch,
  FaCog,
  FaSync
} from 'react-icons/fa'
import { useI18n } from '../../../../contexts/I18nContext'

interface DecodedToken {
  userId: number
  userRole: string
  name: string
  email: string
}

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  category: {
    name: string
  }
  subcategory?: {
    name: string
  }
  client: {
    user: {
      name: string
      email: string
      phone?: string
    }
  }
  location?: string
}

interface AgentStats {
  assigned_tickets: number
  completed_today: number
  in_progress: number
  pending_review: number
  avg_resolution_time: string
  satisfaction_rating: number
  // Campos adicionais que podem vir do backend
  totalAssignedTickets?: number
  activeTickets?: number
  resolvedTickets?: number
  avgResolutionTime?: number
  avgSatisfaction?: number
  ticketsByStatus?: Record<string, number>
}

export default function AgentHomePage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t, setLanguage } = useI18n()
  const [userName, setUserName] = useState('Técnico')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // Função para normalizar dados de estatísticas
  const normalizeStats = (data: any): AgentStats => {
    return {
      assigned_tickets: data.assigned_tickets || data.totalAssignedTickets || 0,
      completed_today: data.completed_today || 0,
      in_progress: data.in_progress || data.activeTickets || 0,
      pending_review: data.pending_review || 0,
      avg_resolution_time: data.avg_resolution_time || '0h',
      satisfaction_rating: data.satisfaction_rating || data.avgSatisfaction || 0
    }
  }

  useEffect(() => {
    const token = authCookies.getToken()
    if (!token) {
      router.push('/pages/auth/login')
      return
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token)
      const role = (decodedToken as any).role || decodedToken.userRole
      
      if (role !== 'Agent' && role !== 'tecnico') {
        // Redirecionar para a home apropriada baseada no role
        router.push('/pages/home')
        return
      }

      setUserName(decodedToken.name || 'Técnico')
      setUserEmail(decodedToken.email || '')

      // Buscar tickets atribuídos ao agente
      fetchAgentData(token)
    } catch (error) {
      console.error('Failed to decode token:', error)
      router.push('/pages/auth/login')
    }
  }, [router])

  // Garante que o idioma respeite a preferência salva (corrige casos em que a página do técnico ficava em EN)
  useEffect(() => {
    try {
      const cfgRaw = localStorage.getItem('appConfig')
      if (cfgRaw) {
        const { idioma } = JSON.parse(cfgRaw)
        if (idioma === 'pt-BR' || idioma === 'en-US') {
          setLanguage(idioma)
        }
      }
    } catch {}
  }, [setLanguage])

  // Monitorar mudanças no estado stats
  useEffect(() => {
    console.log('Estado stats mudou:', stats)
    if (stats) {
      console.log('Detalhes do estado stats:', {
        assigned_tickets: stats.assigned_tickets,
        in_progress: stats.in_progress,
        completed_today: stats.completed_today,
        pending_review: stats.pending_review
      })
    }
  }, [stats])

  // Recalcular estatísticas quando tickets mudarem
  useEffect(() => {
    if (tickets.length > 0) {
      console.log('Recalculando estatísticas baseadas em tickets:', tickets.length)
      const inProgressTickets = tickets.filter(t => t.status === 'InProgress')
      const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
      const waitingTickets = tickets.filter(t => t.status === 'WaitingForClient')
      
      const recalculatedStats = normalizeStats({
        assigned_tickets: tickets.length,
        completed_today: resolvedTickets.length,
        in_progress: inProgressTickets.length,
        pending_review: waitingTickets.length,
        avg_resolution_time: '2.5h',
        satisfaction_rating: 4.8
      })
      
      console.log('Estatísticas recalculadas:', recalculatedStats)
      setStats(recalculatedStats)
    }
  }, [tickets])

  const fetchAgentData = async (token: string) => {
    try {
      console.log('Iniciando fetchAgentData...')
      setIsLoading(true)
      
      // Buscar tickets já atribuídos ao agente (apenas os aceitos/ativos serão exibidos)
      const assignedResponse = await fetch('/helpdesk/agents/my-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Respostas das APIs:', { assignedOk: assignedResponse.ok, assignedStatus: assignedResponse.status })

      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json()
        const assignedTickets = Array.isArray(assignedData) ? assignedData : (assignedData.tickets ?? [])
        // Apenas tickets atualmente aceitos/ativos pelo técnico
        const activeStatuses = ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
        const activeAssigned = assignedTickets.filter((t: any) => activeStatuses.includes(t.status))
        setTickets(activeAssigned)
        console.log('Tickets carregados (apenas aceitos/ativos):', {
          assigned: assignedTickets.length,
          activeAssigned: activeAssigned.length,
          tickets: activeAssigned
        })

        // Buscar estatísticas do agente
        const statsResponse = await fetch('/helpdesk/agents/my-statistics', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('Status da API de estatísticas:', statsResponse.status)
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log('Estatísticas da API recebidas:', statsData)
          const normalizedStats = normalizeStats(statsData)
          console.log('Estatísticas normalizadas:', normalizedStats)
          setStats(normalizedStats)
        } else {
          // Fallback com dados calculados dos tickets carregados (apenas aceitos/ativos)
          console.log('Usando fallback - calculando estatísticas dos tickets ativos atribuídos:', tickets)
          tickets.forEach((ticket, index) => {
            console.log(`Ticket ${index + 1}:`, {
              id: ticket.id,
              status: ticket.status,
              title: ticket.title
            })
          })
          
          const inProgressTickets = tickets.filter(t => t.status === 'InProgress')
          const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
          const waitingTickets = tickets.filter(t => t.status === 'WaitingForClient')
          
          console.log('Tickets por status:', {
            inProgress: inProgressTickets.length,
            resolved: resolvedTickets.length,
            waiting: waitingTickets.length,
            total: tickets.length
          })
          
          const calculatedStats = normalizeStats({
            assigned_tickets: tickets.length,
            completed_today: resolvedTickets.length,
            in_progress: inProgressTickets.length,
            pending_review: waitingTickets.length,
            avg_resolution_time: '2.5h',
            satisfaction_rating: 4.8
          })
          setStats(calculatedStats)
          console.log('Estatísticas calculadas:', calculatedStats)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do agente:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'InProgress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'WaitingForClient':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400'
      case 'High':
        return 'bg-orange-500/20 text-orange-400'
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'Low':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <FaTicketAlt className="w-4 h-4" />
      case 'InProgress':
        return <FaPlay className="w-4 h-4" />
      case 'WaitingForClient':
        return <FaPause className="w-4 h-4" />
      case 'Resolved':
        return <FaCheckCircle className="w-4 h-4" />
      case 'Closed':
        return <FaStop className="w-4 h-4" />
      default:
        return <FaClock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Open':
        return 'Aberto'
      case 'InProgress':
        return 'Em Andamento'
      case 'WaitingForClient':
        return 'Aguardando Cliente'
      case 'Resolved':
        return 'Resolvido'
      case 'Closed':
        return 'Fechado'
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'Crítica'
      case 'High':
        return 'Alta'
      case 'Medium':
        return 'Média'
      case 'Low':
        return 'Baixa'
      default:
        return priority
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'open') return ticket.status === 'Open'
    if (activeFilter === 'in-progress') return ticket.status === 'InProgress'
    if (activeFilter === 'waiting') return ticket.status === 'WaitingForClient'
    return true
  })

  const quickActions = [
    {
      title: 'Aceitar Ticket',
      icon: <FaPlus className="text-2xl" />,
      color: 'from-blue-500 to-blue-600',
      action: () => router.push('/pages/called'),
      description: 'Aceitar novos tickets disponíveis'
    },
    {
      title: 'Meus Tickets',
      icon: <FaTicketAlt className="text-2xl" />,
      color: 'from-green-500 to-green-600',
      action: () => router.push('/pages/called/history'),
      description: 'Ver todos os meus tickets'
    },
    {
      title: 'Relatórios',
      icon: <FaChartLine className="text-2xl" />,
      color: 'from-orange-500 to-orange-600',
      action: () => router.push('/pages/reports'),
      description: 'Ver relatórios de performance'
    }
  ]

  if (isLoading) {
    return (
      <ResponsiveLayout
        userName={userName}
        userEmail={userEmail}
        userType="tecnico"
        notifications={0}
        className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  // Debug log para verificar o estado atual
  console.log('Renderizando página com stats:', stats)

  return (
    <ResponsiveLayout
      userName={userName}
      userEmail={userEmail}
      userType="tecnico"
      notifications={tickets.filter(t => t.status === 'Open').length}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('agent.home.title')}
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('agent.home.welcome')} {userName}! {t('agent.home.myActiveTickets')}
            </p>
          </div>

          <button
            onClick={() => fetchAgentData(authCookies.getToken() || '')}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } shadow-lg`}
          >
            <FaSync className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.assigned')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.assigned_tickets ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaTicketAlt className="text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.completedToday')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.completed_today ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.inProgress')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.in_progress ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <FaClock className="text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.waiting')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.pending_review ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <FaPause className="text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.avgTime')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.avg_resolution_time ?? '0h'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('agent.home.stats.rating')}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.satisfaction_rating ?? 0}★
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FaStar className="text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('agent.home.quickActions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`
                  bg-gradient-to-r ${action.color} text-white p-6 rounded-xl 
                  transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                  flex flex-col items-center justify-center space-y-3 text-center
                `}
              >
                {action.icon}
                <div>
                  <span className="font-semibold text-lg block">{action.title}</span>
                  <span className="text-sm opacity-90">{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Section */}
        <div className={`rounded-xl shadow-sm border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-4 sm:p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('agent.home.myActiveTickets')}
              </h2>
              <div className="flex items-center flex-wrap gap-3">
                {/* Filter buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'all', label: t('agent.home.filters.all') },
                    { key: 'open', label: t('agent.home.filters.open') },
                    { key: 'in-progress', label: t('agent.home.filters.inProgress') },
                    { key: 'waiting', label: t('agent.home.filters.waiting') }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activeFilter === filter.key
                          ? 'bg-blue-500 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/pages/called/history')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 md:self-auto self-start"
                >
                  <span>{t('agent.home.viewAll')}</span>
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {filteredTickets.length > 0 ? (
              <div className="space-y-4">
                {filteredTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`rounded-lg p-4 transition-all duration-300 border cursor-pointer hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => router.push('/pages/called')}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`font-bold text-lg ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            #{ticket.ticket_number || ticket.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center space-x-1 ${
                            getStatusColor(ticket.status)
                          }`}>
                            {getStatusIcon(ticket.status)}
                            <span>{getStatusText(ticket.status)}</span>
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            getPriorityColor(ticket.priority)
                          }`}>
                            {getPriorityText(ticket.priority)}
                          </span>
                        </div>
                        <h3 className={`font-semibold text-lg mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {ticket.title}
                        </h3>
                        <p className={`text-sm mb-3 truncate ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {ticket.description}
                        </p>
                        <div className={`flex items-center space-x-4 text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span className="flex items-center space-x-1">
                            <FaUser className="w-3 h-3" />
                            <span>{ticket.client.user.name}</span>
                          </span>
                          {ticket.location && (
                            <span className="flex items-center space-x-1">
                              <FaMapMarkerAlt className="w-3 h-3" />
                              <span>{ticket.location}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <FaCalendarAlt className="w-3 h-3" />
                            <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FaWrench className="w-3 h-3" />
                            <span>{ticket.category.name}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 md:self-auto self-end">
                       
                       
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push('/pages/called')
                          }}
                          className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaTicketAlt className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Nenhum ticket encontrado
                </p>
                <p className={`text-sm mt-2 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Quando novos tickets forem atribuídos a você, eles aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}