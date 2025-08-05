'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { useTheme } from '../../../hooks/useTheme'
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

export default function DashboardPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [userName, setUserName] = useState('Usuário')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token)
        setUserName(decodedToken.name)
        setUserEmail(decodedToken.email)
      } catch (error) {
        console.error('Failed to decode token:', error)
        router.push('/pages/auth/login')
      }
    } else {
      router.push('/pages/auth/login')
    }
  }, [router])
  
  // Dados simulados para demonstração
  const dashboardStats = [
    {
      title: 'Chamados Ativos',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: <FaClipboardList className="text-blue-500" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Em Andamento',
      value: '8',
      change: '+5%',
      changeType: 'positive',
      icon: <FaClock className="text-yellow-500" />,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Concluídos',
      value: '156',
      change: '+23%',
      changeType: 'positive',
      icon: <FaCheckCircle className="text-green-500" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Urgentes',
      value: '3',
      change: '-2%',
      changeType: 'negative',
      icon: <FaExclamationTriangle className="text-red-500" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10'
    }
  ]

  const recentChamados = [
    {
      id: '#001',
      title: 'Manutenção Equipamento Lab 3',
      status: 'Em Andamento',
      priority: 'Alta',
      technician: 'João Silva',
      time: '2h atrás',
      category: 'Equipamentos',
      location: 'Laboratório 3'
    },
    {
      id: '#002',
      title: 'Problema Sistema de Ar',
      status: 'Pendente',
      priority: 'Média',
      technician: 'Maria Santos',
      time: '4h atrás',
      category: 'Climatização',
      location: 'Setor A'
    },
    {
      id: '#003',
      title: 'Troca de Lâmpadas Setor A',
      status: 'Concluído',
      priority: 'Baixa',
      technician: 'Pedro Costa',
      time: '1 dia atrás',
      category: 'Iluminação',
      location: 'Setor A'
    },
    {
      id: '#004',
      title: 'Manutenção Computadores',
      status: 'Em Andamento',
      priority: 'Alta',
      technician: 'Ana Oliveira',
      time: '6h atrás',
      category: 'Informática',
      location: 'Sala de Aula 2'
    }
  ]

  const quickActions = [
    {
      title: 'Novo Chamado',
      icon: <FaPlus className="text-2xl" />,
      color: 'from-red-500 to-red-600',
      href: '/pages/chamados/new'
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
      notifications={5}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}
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
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Ver Todos
                  </button>
                </div>
              </div>
              
              <div className="p-6">
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
