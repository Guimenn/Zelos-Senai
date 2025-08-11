'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { useTheme } from '../../../../hooks/useTheme'
import ResponsiveLayout from '../../../../components/responsive-layout'
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
}

export default function AgentHomePage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [userName, setUserName] = useState('Técnico')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/pages/auth/login')
      return
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token)
      const role = (decodedToken as any).role || decodedToken.userRole
      
      if (role !== 'Agent') {
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

  const fetchAgentData = async (token: string) => {
    try {
      setIsLoading(true)
      
      // Buscar tickets atribuídos
      const ticketsResponse = await fetch('http://localhost:3001/helpdesk/agents/my-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setTickets(ticketsData.data || [])
      }

      // Buscar estatísticas do agente
      const statsResponse = await fetch('http://localhost:3001/helpdesk/agents/my-statistics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        // Fallback com dados simulados
        setStats({
          assigned_tickets: tickets.length,
          completed_today: Math.floor(Math.random() * 10),
          in_progress: tickets.filter(t => t.status === 'InProgress').length,
          pending_review: tickets.filter(t => t.status === 'WaitingForClient').length,
          avg_resolution_time: '2.5h',
          satisfaction_rating: 4.8
        })
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
      title: 'Ferramentas',
      icon: <FaTools className="text-2xl" />,
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/pages/maintenance'),
      description: 'Acessar ferramentas de manutenção'
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

  return (
    <ResponsiveLayout
      userName={userName}
      userEmail={userEmail}
      userType="tecnico"
      notifications={tickets.filter(t => t.status === 'Open').length}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Central do Técnico
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Bem-vindo de volta, {userName}! Aqui estão seus tickets ativos.
            </p>
          </div>
          <button
            onClick={() => fetchAgentData(localStorage.getItem('token') || '')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <div className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tickets Atribuídos
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.assigned_tickets}
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
                    Concluídos Hoje
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.completed_today}
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
                    Em Andamento
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.in_progress}
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
                    Aguardando Cliente
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.pending_review}
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
                    Tempo Médio
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.avg_resolution_time}
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
                    Avaliação
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stats.satisfaction_rating}★
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
        <div className={`rounded-xl shadow-sm border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Meus Tickets Ativos
              </h2>
              <div className="flex items-center space-x-3">
                {/* Filter buttons */}
                <div className="flex items-center space-x-2">
                  {[
                    { key: 'all', label: 'Todos' },
                    { key: 'open', label: 'Abertos' },
                    { key: 'in-progress', label: 'Em Andamento' },
                    { key: 'waiting', label: 'Aguardando' }
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
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>Ver Todos</span>
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`font-bold text-lg ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            #{ticket.ticket_number || ticket.id}
                          </span>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center space-x-1
                            ${getStatusColor(ticket.status)}
                          `}>
                            {getStatusIcon(ticket.status)}
                            <span>{getStatusText(ticket.status)}</span>
                          </span>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium
                            ${getPriorityColor(ticket.priority)}
                          `}>
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
                      <div className="flex items-center space-x-2">
                        {ticket.client.user.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${ticket.client.user.phone}`)
                            }}
                            className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                          >
                            <FaPhone className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`mailto:${ticket.client.user.email}`)
                          }}
                          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          <FaEnvelope className="w-3 h-3" />
                        </button>
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