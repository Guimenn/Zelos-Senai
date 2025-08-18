'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireRole } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { authCookies } from '../../../utils/cookies'
import { Button } from '@heroui/button'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaTachometerAlt,
  FaClipboardList,
  FaWrench,
  FaUsers,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTools,
  FaBuilding,
  FaPlus,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBell,
  FaUserCircle,
  FaCog,
  FaSignOutAlt
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
  time: string
  category: string
  location: string
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const router = useRouter()
  // Verificar se o usuário NÃO é técnico e nem colaborador (Agent) - apenas Admin pode acessar
  const { user, isLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')
  const [userName, setUserName] = useState('Usuário')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (user) {
      setUserName(user.name || 'Usuário')
      setUserEmail(user.email || '')
    }
  }, [user])
  
  // Estados para dados reais da API
  const [dashboardStats, setDashboardStats] = useState([
    {
      title: 'Chamados Ativos',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaClipboardList className="text-blue-500" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Em Andamento',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaClock className="text-yellow-500" />,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Concluídos',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaCheckCircle className="text-green-500" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Urgentes',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: <FaExclamationTriangle className="text-red-500" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10'
    }
  ])
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const [recentChamados, setRecentChamados] = useState<Chamado[]>([])

  // Função para buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      const token = authCookies.getToken()
      if (!token) {
        router.push('/pages/auth/login')
        return
      }

      // Buscar estatísticas do admin
      const statsResponse = await fetch('http://localhost:3001/admin/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        
        // Atualizar estatísticas do dashboard
        setDashboardStats([
          {
            title: 'Chamados Ativos',
            value: statsData.tickets?.open?.toString() || '0',
            change: '+12%',
            changeType: 'positive',
            icon: <FaClipboardList className="text-blue-500" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10'
          },
          {
            title: 'Em Andamento',
            value: statsData.tickets?.in_progress?.toString() || '0',
            change: '+5%',
            changeType: 'positive',
            icon: <FaClock className="text-yellow-500" />,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-500/10'
          },
          {
            title: 'Concluídos',
            value: statsData.tickets?.resolved?.toString() || '0',
            change: '+23%',
            changeType: 'positive',
            icon: <FaCheckCircle className="text-green-500" />,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10'
          },
          {
            title: 'Urgentes',
            value: statsData.tickets?.priorities?.critical?.toString() || '0',
            change: '-2%',
            changeType: 'negative',
            icon: <FaExclamationTriangle className="text-red-500" />,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-500/10'
          }
        ])
      }

      // Buscar chamados recentes
      const ticketsResponse = await fetch('http://localhost:3001/helpdesk/tickets?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        const formattedTickets = (ticketsData.tickets || []).map((ticket: any) => ({
          id: `#${ticket.id.toString().padStart(3, '0')}`,
          title: ticket.title,
          status: ticket.status === 'Open' ? 'Pendente' : 
                  ticket.status === 'InProgress' ? 'Em Andamento' :
                  ticket.status === 'Resolved' ? 'Concluído' : ticket.status,
          priority: ticket.priority === 'Low' ? 'Baixa' :
                   ticket.priority === 'Medium' ? 'Média' :
                   ticket.priority === 'High' ? 'Alta' :
                   ticket.priority === 'Critical' ? 'Crítica' : ticket.priority,
          technician: ticket.ticket_assignments?.[0]?.agent?.user?.name || 'Não atribuído',
          time: new Date(ticket.created_at).toLocaleDateString('pt-BR'),
          category: ticket.category?.name || 'Sem categoria',
          location: ticket.location || 'Não informado'
        }))
        setRecentChamados(formattedTickets)
      }

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const quickActions = [
    {
      title: 'Novo Chamado',
      icon: <FaPlus className="text-2xl" />,
      color: 'from-red-500 to-red-600',
      href: '/pages/called/new'
    },
    {
      title: 'Manutenção',
      icon: <FaWrench className="text-2xl" />,
      color: 'from-blue-500 to-blue-600',
      href: '/pages/maintenance'
    },
    {
      title: 'Usuários',
      icon: <FaUsers className="text-2xl" />,
      color: 'from-green-500 to-green-600',
      href: '/pages/employees'
    },
    {
      title: 'Relatórios',
      icon: <FaChartBar className="text-2xl" />,
      color: 'from-purple-500 to-purple-600',
      href: '/pages/reports'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Pendente':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-500/20 text-red-400'
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'Baixa':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Dashboard
              </h1>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Bem-vindo de volta, {userName}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={dashboardLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dashboardLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {dashboardLoading ? 'Carregando...' : 'Atualizar'}
            </button>
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
                      <span className={`text-sm ml-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>vs mês anterior</span>
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
                    Chamados Recentes
                  </h2>
                  <Button 
                    onClick={() => router.push('/pages/called')}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Ver Todos
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {dashboardLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`rounded-lg p-4 border animate-pulse ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className={`h-4 rounded mb-2 ${
                              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                            }`}></div>
                            <div className={`h-3 rounded w-3/4 ${
                              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                            }`}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentChamados.length > 0 ? (
                  <div className="space-y-4">
                    {recentChamados.map((chamado, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 transition-colors border ${
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
                            {chamado.title}
                          </h3>
                          <div className={`flex items-center space-x-4 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span className="flex items-center">
                              <FaUserCircle className="mr-1" />
                              {chamado.technician}
                            </span>
                            <span className="flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              {chamado.location}
                            </span>
                            <span className="flex items-center">
                              <FaClock className="mr-1" />
                              {chamado.time}
                            </span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <FaCog className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <FaClipboardList className="mx-auto text-4xl mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
                    <p className="text-sm">Quando houver chamados, eles aparecerão aqui.</p>
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
                  Ações Rápidas
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
                  Informações do Sistema
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Status do Sistema
                    </span>
                    <span className="bg-green-500/20 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                      Online
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Última Atualização
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>2 min atrás</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Usuários Ativos
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>12</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Versão
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>v2.1.0</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Suporte Técnico</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaPhone className="text-sm" />
                    <span className="text-sm">(11) 1234-5678</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="text-sm" />
                    <span className="text-sm">suporte@senai.com</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="text-sm" />
                    <span className="text-sm">SENAI Armando de Arruda Pereira</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResponsiveLayout>
  )
}
