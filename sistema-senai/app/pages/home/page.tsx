'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { useI18n } from '../../../contexts/I18nContext'
import { authCookies } from '../../../utils/cookies'
import { Button } from '@heroui/button'
import ResponsiveLayout from '../../../components/responsive-layout'
import { toast } from 'react-toastify'
import {
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaTools,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaDownload,
  FaPrint,
  FaBell,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaEllipsisV,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar,
  FaTimes,
  FaSync,
  FaPlus,
  FaMinus,
  FaSearch,
  FaFilter,
  FaHeart,
  FaBookmark,
  FaShare,
  FaLink,
  FaExternalLinkAlt,
  FaCopy,
  FaQrcode,
  FaBarcode,
  FaCreditCard,
  FaPaypal,
  FaBitcoin,
  FaEthereum,
  FaDollarSign
} from 'react-icons/fa'

interface DecodedToken {
  userId: number
  userRole: string
  name: string
  email: string
  iat: number
  exp: number
}

interface Chamado {
  id: string
  title: string
  status: string
  priority: string
  technician: string
  requester: string
  time: string
  category: string
  location: string
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { user, isLoading } = useRequireAuth()
  const [userName, setUserName] = useState(t('common.loading'))
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (user) {
      setUserName(user.name || t('common.loading'))
      setUserEmail(user.email || '')
    }
  }, [user, t])
  
  // Estados para dados reais da API
  const [dashboardStats, setDashboardStats] = useState([
    {
      title: t('home.stats.active'),
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaClipboardList className="text-blue-500" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: t('home.stats.inProgress'),
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaClock className="text-yellow-500" />,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: t('home.stats.completed'),
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaCheckCircle className="text-green-500" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: t('home.stats.urgent'),
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaExclamationTriangle className="text-red-500" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10'
    }
  ])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)

  const [recentChamados, setRecentChamados] = useState<Chamado[]>([])

  // System Info (dinâmico)
  const [systemInfo, setSystemInfo] = useState<{ online: boolean; lastUpdated: string | null; activeUsers: number; version: string }>(
    { online: false, lastUpdated: null, activeUsers: 0, version: (process.env.NEXT_PUBLIC_APP_VERSION as string) || 'v2.1.0' }
  )
  const [systemInfoRelative, setSystemInfoRelative] = useState<string>('')

  // Mapeamento de status/priority do backend -> PT (igual à página de chamados)
  const mapStatusToPt = (status?: string) => {
    switch (status) {
      case 'Open':
      case 'WaitingForClient':
      case 'WaitingForThirdParty':
        return 'Pendente'
      case 'InProgress':
        return 'Em Andamento'
      case 'Resolved':
      case 'Closed':
        return 'Concluído'
      case 'Cancelled':
        return 'Cancelado'
      default:
        return 'Pendente'
    }
  }

  const mapPriorityToPt = (priority?: string) => {
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
        return 'Média'
    }
  }

  // Função para buscar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 Iniciando fetchDashboardData...')
    setDashboardLoading(true)
    try {
      const token = authCookies.getToken()
      if (!token) {
        console.log('❌ Token não encontrado, redirecionando para login')
        router.push('/pages/auth/login')
        setDashboardLoading(false)
        return
      }

      // Buscar estatísticas do admin
      console.log('📊 Fazendo requisição para /admin/status...')
      const statsResponse = await fetch('/admin/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('✅ Dados de estatísticas recebidos:', statsData)
        
        // Calcular estatísticas corretas baseadas nos dados reais
        const totalTickets = statsData.tickets?.total || 0;
        const openTickets = statsData.tickets?.open || 0;
        const inProgressTickets = statsData.tickets?.in_progress || 0;
        const resolvedTickets = statsData.tickets?.resolved || 0;
        const closedTickets = statsData.tickets?.closed || 0;
        const criticalTickets = statsData.tickets?.priorities?.critical || 0;
        const highTickets = statsData.tickets?.priorities?.high || 0;
        
        // Calcular porcentagens baseadas no total de tickets
        const calculatePercentage = (value: number) => {
          if (totalTickets === 0) return '0%';
          const percentage = Math.round((value / totalTickets) * 100);
          return `${percentage}%`;
        };
        
        // Calcular porcentagem de mudança (simulado - baseado em dados históricos)
        const calculateChangePercentage = (currentValue: number, previousValue: number = 0) => {
          if (previousValue === 0) {
            return currentValue > 0 ? '+100%' : '0%';
          }
          const change = ((currentValue - previousValue) / previousValue) * 100;
          const sign = change >= 0 ? '+' : '';
          return `${sign}${Math.round(change)}%`;
        };
        
        // Atualizar estatísticas do dashboard
        setDashboardStats([
          {
            title: t('home.stats.active'),
            value: openTickets.toString(),
            change: `${calculatePercentage(openTickets)} do total`,
            changeType: openTickets > 0 ? 'positive' : 'neutral',
            icon: <FaClipboardList className="text-blue-500" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10'
          },
          {
            title: t('home.stats.inProgress'),
            value: inProgressTickets.toString(),
            change: `${calculatePercentage(inProgressTickets)} do total`,
            changeType: inProgressTickets > 0 ? 'positive' : 'neutral',
            icon: <FaClock className="text-yellow-500" />,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-500/10'
          },
          {
            title: t('home.stats.completed'),
            value: (resolvedTickets + closedTickets).toString(),
            change: `${calculatePercentage(resolvedTickets + closedTickets)} do total`,
            changeType: (resolvedTickets + closedTickets) > 0 ? 'positive' : 'neutral',
            icon: <FaCheckCircle className="text-green-500" />,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10'
          },
          {
            title: t('home.stats.urgent'),
            value: (criticalTickets + highTickets).toString(),
            change: `${calculatePercentage(criticalTickets + highTickets)} do total`,
            changeType: (criticalTickets + highTickets) > 0 ? 'positive' : 'neutral',
            icon: <FaExclamationTriangle className="text-red-500" />,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-500/10'
          }
        ])

        // Atualizar System Info
        const lastUpdated = statsData?.system?.last_updated || new Date().toISOString()
        const activeUsers = (statsData?.users?.active_agents || 0) + (statsData?.users?.active_clients || 0)
        setSystemInfo(prev => ({ ...prev, online: true, lastUpdated, activeUsers }))
      } else {
        console.error('Erro na resposta da API de estatísticas:', statsResponse.status)
        setSystemInfo(prev => ({ ...prev, online: false }))
        setDashboardLoading(false)
        setDataLoaded(true)
        return
      }

             // Buscar chamados recentes (aumentar limite para garantir tickets ativos suficientes)
       console.log('🎫 Fazendo requisição para /helpdesk/tickets...')
       const ticketsResponse = await fetch('/helpdesk/tickets?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      })

             if (ticketsResponse.ok) {
         const ticketsData = await ticketsResponse.json()
         console.log('🎫 Dados de tickets recebidos:', ticketsData)
         
                   // Filtrar apenas tickets ativos (não concluídos) para a home
          // Mostrar apenas tickets que ainda precisam de atenção
          const activeTickets = (ticketsData.tickets || []).filter((ticket: any) => {
            const status = ticket.status?.toLowerCase()
            // Excluir tickets concluídos, fechados ou cancelados
            // Manter apenas: Open, InProgress, WaitingForClient, WaitingForThirdParty
            return !['resolved', 'closed', 'cancelled'].includes(status)
          })
          
          console.log('🎯 Tickets ativos filtrados:', activeTickets.length, 'de', (ticketsData.tickets || []).length)
          
          const formattedTickets = activeTickets.map((ticket: any) => {
            try {
              console.log('🔍 Processando ticket ativo:', ticket)
              
              const formattedTicket = {
                id: ticket.ticket_number ?? `#${ticket.id}`,
                title: ticket.title || 'Sem título',
                status: mapStatusToPt(ticket.status),
                priority: mapPriorityToPt(ticket.priority),
                technician: ticket.assigned_agent?.name ?? ticket.assignee?.name ?? 'Não atribuído',
                requester: ticket.client?.user?.name ?? ticket.creator?.name ?? ticket.requester?.name ?? 'Não informado',
                time: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : 'Data não disponível',
                category: ticket.category?.name ?? 'Categoria não definida',
                location: ticket.client?.user?.department ?? ticket.location ?? 'Local não informado'
              }
              
              console.log('✅ Ticket ativo formatado:', formattedTicket)
              return formattedTicket
            } catch (error) {
              console.error('❌ Erro ao processar ticket ativo:', error)
              return {
                id: `#${ticket.id?.toString().padStart(3, '0') || '000'}`,
                title: 'Erro ao carregar',
                status: 'Erro',
                priority: 'Erro',
                technician: 'Erro',
                requester: 'Erro',
                time: 'Erro',
                category: 'Erro',
                location: 'Erro'
              }
            }
          })
         
                   // Limitar a 5 tickets mais recentes para a home
          const recentActiveTickets = formattedTickets.slice(0, 5)
          
          console.log('📋 Lista final de tickets ativos:', recentActiveTickets.length, 'de', formattedTickets.length)
          setRecentChamados(recentActiveTickets)
         setDataLoaded(true)
      } else {
        console.error('Erro na resposta da API de tickets:', ticketsResponse.status)
        setRecentChamados([])
        setDataLoaded(true)
      }

    } catch (error: any) {
      console.error('Erro ao buscar dados do dashboard:', error)
      
      if (error?.name === 'AbortError') {
        toast.error('Timeout ao carregar dados do dashboard')
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        toast.error('Erro de conexão com o servidor')
      } else {
        toast.error('Erro ao carregar dados do dashboard')
      }
      
      setSystemInfo(prev => ({ ...prev, online: false }))
      setDashboardLoading(false)
      setDataLoaded(true)
    } finally {
      console.log('✅ fetchDashboardData finalizado')
      setDashboardLoading(false)
    }
  }, [router, t])

 

  const fetchAgentData = async (token: string) => {
    try {
      console.log('Iniciando fetchAgentData...')
      setDashboardLoading(true)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do agente')
      setSystemInfo(prev => ({ ...prev, online: false }))
    } finally {
      setDashboardLoading(false)
    }
  }

  // Buscar dados ao carregar o componente
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { isLoading, userId: user?.userId, dataLoaded })
    if (!isLoading && user && !dataLoaded) {
      fetchDashboardData()
    }
  }, [isLoading, user?.userId, fetchDashboardData, dataLoaded]) // Incluir fetchDashboardData nas dependências

  // Atualiza o tempo relativo do "last update"
  useEffect(() => {
    const calcRelative = () => {
      if (!systemInfo.lastUpdated) {
        setSystemInfoRelative('—')
        return
      }
      const date = new Date(systemInfo.lastUpdated)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      const diffHr = Math.floor(diffMin / 60)
      if (diffMin < 1) setSystemInfoRelative('Agora')
      else if (diffMin < 60) setSystemInfoRelative(`${diffMin} m atrás`)
      else if (diffHr < 24) setSystemInfoRelative(`${diffHr} h atrás`)
      else setSystemInfoRelative(date.toLocaleString('pt-BR'))
    }
    calcRelative()
    const id = setInterval(calcRelative, 60000)
    return () => clearInterval(id)
  }, [systemInfo.lastUpdated])

  const quickActions = [
    {
      title: t('called.newTicket'),
      icon: <FaPlus className="text-2xl" />,
      color: 'from-red-500 to-red-600',
      href: '/pages/called/new'
    },
    {
      title: t('maintenance.title'),
      icon: <FaWrench className="text-2xl" />,
      color: 'from-blue-500 to-blue-600',
      href: '/pages/maintenance'
    },
    {
      title: t('employees.title'),
      icon: <FaUser className="text-2xl" />,
      color: 'from-green-500 to-green-600',
      href: '/pages/employees'
    },
    {
      title: t('reports.title.admin'),
      icon: <FaChartBar className="text-2xl" />,
      color: 'from-purple-500 to-purple-600',
      href: '/pages/reports'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'Pendente':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica':
        return 'bg-red-600/20 text-red-700'
      case 'Alta':
        return 'bg-red-500/20 text-red-600'
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-600'
      case 'Baixa':
        return 'bg-green-500/20 text-green-600'
      default:
        return 'bg-gray-500/20 text-gray-600'
    }
  }

  return (
    <ResponsiveLayout
      userName={userName}
      userEmail={userEmail}
      userType="admin"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
          {/* Header com botão de atualizar */}
          <div className="flex justify-between items-center mb-8 py-16 lg:py-4">
            <div>
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('home.title')}
              </h1>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('home.welcome')} {userName}
              </p>
            </div>
          
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } ${dashboardLoading ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stat.title}
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`
                    w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center
                  `}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Chamados */}
            <div className={`lg:col-span-2 rounded-xl shadow-sm border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`p-6 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {t('home.recent.title')}
                  </h2>
                  <div className="flex items-center space-x-2">
                                         <Button 
                       onClick={() => {
                         setDataLoaded(false)
                         setProcessingError(null)
                         setRecentChamados([])
                         fetchDashboardData()
                       }}
                       disabled={dashboardLoading}
                       className={`text-sm font-medium ${
                         dashboardLoading 
                           ? 'text-gray-400 cursor-not-allowed' 
                           : 'text-blue-600 hover:text-blue-700'
                       }`}
                     >
                       <FaSync className={`mr-1 ${dashboardLoading ? 'animate-spin' : ''}`} />
                       {dashboardLoading ? 'Carregando...' : 'Atualizar'}
                     </Button>
                    
                     <Button 
                       onClick={() => router.push('/pages/called')}
                       className="text-red-600 hover:text-red-700 text-sm font-medium"
                     >
                       {t('home.recent.viewAll')}
                     </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {dashboardLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`rounded-lg p-4 border animate-pulse ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`h-4 w-16 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                              <div className={`h-6 w-20 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                              <div className={`h-6 w-16 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                            </div>
                            <div className={`h-4 rounded mb-2 ${
                              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                            }`}></div>
                            <div className="flex items-center space-x-4">
                              <div className={`h-3 w-24 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                              <div className={`h-3 w-20 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                              <div className={`h-3 w-16 rounded ${
                                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dataLoaded && recentChamados.length > 0 ? (
                  <div className="space-y-4">
                    {recentChamados.map((chamado, index) => (
                      <div
                        key={index}
                        onClick={() => router.push('/pages/called')}
                        className={`rounded-lg p-4 transition-colors border cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {chamado.id}
                            </span>
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium border
                              ${getStatusColor(chamado.status)}
                            `}>
                              {chamado.status}
                            </span>
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${getPriorityColor(chamado.priority)}
                            `}>
                              {chamado.priority}
                            </span>
                          </div>
                                                     <h3 className={`font-medium mb-2 ${
                             theme === 'dark' ? 'text-white' : 'text-gray-900'
                           }`}>
                             {(chamado.title || '').length > 50 ? `${(chamado.title || '').substring(0, 50)}...` : chamado.title || t('common.loading')}
                           </h3>
                                                     <div className={`flex items-center space-x-4 text-sm ${
                             theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                           }`}>
                             <span className="flex items-center">
                               <FaUser className="mr-1" />
                               {chamado.requester && chamado.requester !== 'Não informado' 
                                 ? (chamado.requester.length > 15 ? `${chamado.requester.substring(0, 15)}...` : chamado.requester)
                                 : 'Não informado'
                               }
                             </span>
                             <span className="flex items-center">
                               <FaTools className="mr-1" />
                               {chamado.technician && chamado.technician !== 'Não atribuído'
                                 ? (chamado.technician.length > 15 ? `${chamado.technician.substring(0, 15)}...` : chamado.technician)
                                 : 'Não atribuído'
                               }
                             </span>
                             <span className="flex items-center">
                               <FaMapMarkerAlt className="mr-1" />
                               {chamado.location && chamado.location !== 'Local não informado'
                                 ? (chamado.location.length > 15 ? `${chamado.location.substring(0, 15)}...` : chamado.location)
                                 : 'Local não informado'
                               }
                             </span>
                           </div>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
                                 ) : dataLoaded ? (
                   <div className={`text-center py-8 ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                   }`}>
                     <FaClipboardList className="mx-auto text-4xl mb-4 opacity-50" />
                     <p className="text-lg font-medium mb-2">{t('home.recent.emptyTitle')}</p>
                     <p className="text-sm">{t('home.recent.emptySubtitle')}</p>
                   </div>
                 ) : processingError ? (
                   <div className={`text-center py-8 ${
                     theme === 'dark' ? 'text-red-400' : 'text-red-600'
                   }`}>
                     <FaExclamationTriangle className="mx-auto text-4xl mb-4" />
                     <p className="text-lg font-medium mb-2">Erro ao carregar dados</p>
                     <p className="text-sm">{processingError}</p>
                     <Button 
                       onClick={() => {
                         setProcessingError(null)
                         setDataLoaded(false)
                         fetchDashboardData()
                       }}
                       className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                     >
                       Tentar Novamente
                     </Button>
                   </div>
                 ) : (
                   <div className={`text-center py-8 ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                   }`}>
                     <FaClipboardList className="mx-auto text-4xl mb-4 opacity-50" />
                     <p className="text-lg font-medium mb-2">Carregando dados...</p>
                     <p className="text-sm">Aguarde enquanto buscamos as informações</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Quick Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className={`rounded-xl shadow-sm border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('home.quickActions')}
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    // Se action.href existir, renderiza como <Link>, senão como <button>
                    if (action.href) {
                      // Se você estiver usando Next.js, importe Link de 'next/link'
                      // e use <Link legacyBehavior passHref> se necessário
                      // Aqui, usamos Link normalmente
                      return (
                        <a
                          key={index}
                          href={action.href}
                          className={`
                            bg-gradient-to-r ${action.color} text-white p-4 rounded-xl 
                            transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                            flex flex-col items-center justify-center space-y-2 pointer
                          `}
                          style={{ textDecoration: 'none' }}
                        >
                          {action.icon}
                          <span className="font-semibold text-sm">{action.title}</span>
                        </a>
                      );
                    } else {
                      return (
                        <button
                          key={index}
                          className={`
                            bg-gradient-to-r ${action.color} text-white p-4 rounded-xl 
                            transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                            flex flex-col items-center justify-center space-y-2 pointer
                          `}
                        >
                          {action.icon}
                          <span className="font-semibold text-sm">{action.title}</span>
                        </button>
                      );
                    }
                  })}
                </div>
              </div>

              {/* System Info */}
              <div className={`rounded-xl shadow-sm border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('home.systemInfo')}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('home.systemInfo.status')}
                    </span>
                    {systemInfo.online ? (
                      <span className="bg-green-500/20 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                        {t('home.systemInfo.online')}
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                        {t('home.systemInfo.offline')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('home.systemInfo.lastUpdate')}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{systemInfoRelative || '—'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('home.systemInfo.activeUsers')}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{systemInfo.activeUsers}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('home.systemInfo.version')}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{systemInfo.version}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">{t('home.technicalSupport')}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaPhone className="text-sm" />
                      <a href="tel:+551112345678" className="text-sm underline decoration-white/30 hover:decoration-white">
                        (11) 1234-5678
                      </a>
                    </div>
                    <button
                      onClick={() => navigator.clipboard?.writeText('+55 11 1234-5678')}
                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                    >
                      {t('home.contact.copy')}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaEnvelope className="text-sm" />
                      <a href="mailto:suporte@senai.com" className="text-sm underline decoration-white/30 hover:decoration-white">
                        suporte@senai.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="mailto:suporte@senai.com"
                        className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                      >
                        {t('home.contact.send')}
                      </a>
                      <button
                        onClick={() => navigator.clipboard?.writeText('suporte@senai.com')}
                        className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                      >
                        {t('home.contact.copy')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaMapMarkerAlt className="text-sm" />
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=SENAI%20Armando%20de%20Arruda%20Pereira"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline decoration-white/30 hover:decoration-white"
                      >
                        SENAI Armando de Arruda Pereira
                      </a>
                    </div>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=SENAI%20Armando%20de%20Arruda%20Pereira"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                    >
                      {t('home.contact.viewMap')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResponsiveLayout>
  )
}
