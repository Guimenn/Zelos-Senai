'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireRole } from '../../../../hooks/useAuth'
import { useTheme } from '../../../../hooks/useTheme'
import { authCookies } from '../../../../utils/cookies'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useI18n } from '../../../../contexts/I18nContext'
import {
  FaClipboardList,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaBuilding,
  FaPlus,
  FaEye,
  FaEdit,
  FaBell,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTools,
  FaHistory,
  FaArrowRight,
  FaUserCog,
  FaTicketAlt,
  FaComments,
  FaPaperclip,
  FaLightbulb,
  FaHeadset,
  FaShieldAlt,
  FaRocket
} from 'react-icons/fa'

interface Call {
  id: number
  ticket_number: string
  title: string
  description: string
  status: 'Open' | 'InProgress' | 'WaitingForClient' | 'WaitingForThirdParty' | 'Resolved' | 'Closed' | 'Cancelled'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  created_at: string
  modified_at: string
  due_date?: string
  resolution_time?: number
  location?: string
  assigned_to?: {
    id: number
    name: string
    email: string
  }
  category: {
    id: number
    name: string
    color: string
  }
  subcategory?: {
    id: number
    name: string
  }
  client?: {
    id: number
    department?: string
    address?: string
    company?: string
    user?: {
      id: number
      name: string
      email: string
      phone?: string
      address?: string
    }
  }
  _count?: {
    comments: number
    attachments: number
  }
}

interface Stats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
}

export default function ClientHomePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { t } = useI18n()
  const { user, isLoading } = useRequireRole(['Client'], '/pages/auth/unauthorized')
  
  // Debug logging
  console.log('🔍 DEBUG - ClientHomePage:', {
    user,
    isLoading,
    userRole: user?.role || user?.userRole,
    hasUser: !!user
  })
  
  const [userName, setUserName] = useState('Colaborador')
  const [userEmail, setUserEmail] = useState('')
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  })
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    if (user) {
      setUserName(user.name || 'Colaborador')
      setUserEmail(user.email || '')
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const token = authCookies.getToken()
      if (!token) return

      // Buscar tickets do cliente usando a rota do Next.js rewrite
      const ticketsResponse = await fetch('/helpdesk/client/my-tickets?limit=50', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!ticketsResponse.ok) {
        throw new Error('Falha ao carregar tickets')
      }

      const ticketsData = await ticketsResponse.json()
      const tickets = ticketsData.tickets || []

      // Calcular estatísticas
      const statsData: Stats = {
        total: tickets.length,
        pending: tickets.filter((t: Call) => t.status === 'Open').length,
        inProgress: tickets.filter((t: Call) => t.status === 'InProgress').length,
        completed: tickets.filter((t: Call) => ['Resolved', 'Closed'].includes(t.status)).length,
        cancelled: tickets.filter((t: Call) => t.status === 'Cancelled').length
      }

      // Pegar os 3 tickets mais recentes
      const recentTickets = tickets
        .sort((a: Call, b: Call) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

      setStats(statsData)
      setRecentCalls(recentTickets)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-800'
      case 'InProgress':
        return 'bg-red-100 text-red-800'
      case 'WaitingForClient':
        return 'bg-orange-100 text-orange-800'
      case 'WaitingForThirdParty':
        return 'bg-purple-100 text-purple-800'
      case 'Resolved':
      case 'Closed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500'
      case 'High':
        return 'bg-orange-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
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
      case 'WaitingForThirdParty':
        return 'Aguardando Terceiros'
      case 'Resolved':
        return 'Resolvido'
      case 'Closed':
        return 'Fechado'
      case 'Cancelled':
        return 'Cancelado'
      default:
        return 'Desconhecido'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInHours < 48) return 'Ontem'
    return formatDate(dateString)
  }

  const getSLAStatus = (createdAt: string, dueDate?: string) => {
    if (!dueDate) return { status: 'Sem prazo', color: 'text-gray-400' }
    
    const now = new Date()
    const due = new Date(dueDate)
    const created = new Date(createdAt)
    
    if (now > due) {
      return { status: 'Atrasado', color: 'text-red-400' }
    }
    
    const diffHours = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (diffHours < 24) {
      return { status: `Vence em ${diffHours}h`, color: 'text-orange-400' }
    }
    
    const diffDays = Math.floor(diffHours / 24)
    return { status: `Vence em ${diffDays}d`, color: 'text-green-400' }
  }

  const getLocation = (call: Call) => {
    // Prioridade: location do ticket > department do client > address do client > address do user
    if (call.location) {
      return call.location
    }
    if (call.client?.department) {
      return call.client.department
    }
    if (call.client?.address) {
      return call.client.address
    }
    if (call.client?.user?.address) {
      return call.client.user.address
    }
    return '-'
  }

  const getResolutionTime = (call: Call) => {
    if (call.resolution_time) {
      const hours = Math.floor(call.resolution_time / 60)
      const minutes = call.resolution_time % 60
      if (hours > 0) {
        return `${hours}h ${minutes}min`
      }
      return `${minutes}min`
    }
    return '-'
  }

  if (isLoading || isLoadingData) {
    return (
      <ResponsiveLayout className="bg-gray-900 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ResponsiveLayout className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="min-h-screen">
          <div className="py-8 px-4 pt-16 ps-10 lg:pt-12">
            <h1 className="text-5xl font-bold text-white">Dashboard</h1>
          </div>

        <div className="max-w-10xl  px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaClipboardList className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-300">
                      Total
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaClock className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-300">
                      Pendentes
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaTools className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-300">
                      Em Andamento
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.inProgress}</p>
                  </div>
                </div>
              </div>
              
              <div className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaCheckCircle className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-300">
                      Concluídos
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaExclamationTriangle className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-300">
                      Cancelados
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.cancelled}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Calls */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-xl border border-gray-600">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <FaClipboardList className="text-white text-sm" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Chamados Recentes
                    </h2>
                  </div>
                  <button
                    onClick={() => router.push('/pages/called')}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Ver Todos
                    <FaArrowRight className="ml-2 h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {recentCalls.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaClipboardList className="text-gray-400 text-xl sm:text-2xl" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">
                      Nenhum chamado encontrado
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm sm:text-base">
                      Você ainda não possui chamados. Crie seu primeiro chamado para começar.
                    </p>
                    <button
                      onClick={() => router.push('/pages/called/new')}
                      className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <FaPlus className="mr-2 h-4 w-4" />
                      Criar Primeiro Chamado
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCalls.map((call) => (
                      <div
                        key={call.id}
                        className="group bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 sm:p-6 border border-gray-500 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                                             <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                                 {call.title.length > 60 ? `${call.title.substring(0, 60)}...` : call.title}
                               </h3>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(call.status)}`}>
                                  {getStatusText(call.status)}
                                </span>
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getPriorityColor(call.priority)}`} title={`Prioridade: ${call.priority}`}></div>
                              </div>
                            </div>
                            
                                                         <p className="text-gray-300 mb-4 leading-relaxed text-sm sm:text-base">
                               {call.description.length > 120 ? `${call.description.substring(0, 120)}...` : call.description}
                             </p>
                            
                            <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <FaBuilding className="text-red-400" />
                                <span>{call.category.name}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <FaCalendarAlt className="text-red-400" />
                                <span>{getTimeAgo(call.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <FaMapMarkerAlt className="text-red-400" />
                                <span>{getLocation(call)}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <FaClock className="text-red-400" />
                                <span className={getSLAStatus(call.created_at, call.due_date).color}>
                                  {getSLAStatus(call.created_at, call.due_date).status}
                                </span>
                              </div>
                              {call.assigned_to && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FaUser className="text-red-400" />
                                  <span>{call.assigned_to.name}</span>
                                </div>
                              )}
                              {call.resolution_time && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FaTools className="text-red-400" />
                                  <span>Tempo: {getResolutionTime(call)}</span>
                                </div>
                              )}
                              {call._count && (
                                <div className="flex items-center gap-2 sm:gap-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <FaComments className="text-red-400" />
                                    <span>{call._count.comments}</span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <FaPaperclip className="text-red-400" />
                                    <span>{call._count.attachments}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div
                onClick={() => router.push('/pages/called/new')}
                className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 cursor-pointer hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaPlus className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                      Novo Chamado
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Abrir nova solicitação de suporte
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/called/history')}
                className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaHistory className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Histórico
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Visualizar histórico completo
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/called/new')}
                className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 cursor-pointer hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaPlus className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                      Novo Chamado
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Abrir uma nova solicitação de suporte
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/perfil')}
                className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 cursor-pointer hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaUserCog className="text-white text-base sm:text-lg" />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Perfil
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Gerenciar suas informações
                    </p>
                  </div>
                </div>
              </div>
            </div>

        
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
