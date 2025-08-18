'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireRole } from '../../../../hooks/useAuth'
import { useTheme } from '../../../../hooks/useTheme'
import { authCookies } from '../../../../utils/cookies'
import ResponsiveLayout from '../../../../components/responsive-layout'
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
  FaUserCog
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
  const { user, isLoading } = useRequireRole(['Client'], '/pages/auth/unauthorized')
  
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

  if (isLoading || isLoadingData) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Bem-vindo, {userName}
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex gap-3">
                <button
                  onClick={() => router.push('/pages/called/new')}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Novo Chamado
                </button>
                
                <button
                  onClick={() => router.push('/pages/called')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <FaClipboardList className="mr-2 h-4 w-4" />
                  Ver Todos
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaClipboardList className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <FaClock className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pendentes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FaTools className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Em Andamento
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Concluídos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaExclamationTriangle className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Cancelados
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Calls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Chamados Recentes
                  </h2>
                  <button
                    onClick={() => router.push('/pages/called')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                  >
                    Ver Todos
                    <FaArrowRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {recentCalls.length === 0 ? (
                  <div className="text-center py-8">
                    <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Nenhum chamado encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Comece criando seu primeiro chamado de manutenção
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCalls.map((call) => (
                      <div
                        key={call.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {call.title}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                                {getStatusText(call.status)}
                              </span>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(call.priority)}`}></div>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {call.description.length > 150 ? `${call.description.substring(0, 150)}...` : call.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <FaBuilding className="mr-1" />
                                {call.category.name}
                              </div>
                              <div className="flex items-center">
                                <FaCalendarAlt className="mr-1" />
                                {formatDate(call.created_at)}
                              </div>
                              {call.assigned_to && (
                                <div className="flex items-center">
                                  <FaUser className="mr-1" />
                                  {call.assigned_to.name}
                                </div>
                              )}
                              {call._count && (
                                <div className="flex items-center gap-2">
                                  <span>{call._count.comments} comentários</span>
                                  <span>{call._count.attachments} anexos</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => router.push(`/pages/called/${call.id}`)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Ver detalhes"
                            >
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/pages/called/${call.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                              title="Editar"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                onClick={() => router.push('/pages/called/new')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaPlus className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Novo Chamado
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Solicitar manutenção
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/called/history')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaHistory className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Histórico
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ver chamados anteriores
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/notifications')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <FaBell className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Notificações
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ver atualizações
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/pages/perfil')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <FaUserCog className="text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Meu Perfil
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerenciar conta
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
