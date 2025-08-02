'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaPrint,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUsers,
  FaTools,
  FaBuilding,
  FaMapMarkerAlt,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFilter,
  FaSearch,
  FaCalendar,
  FaTachometerAlt,
  FaClipboardList,
  FaWrench,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaGraduationCap,
  FaShieldAlt,
  FaBriefcase,
  FaHeart,
  FaThumbsUp,
  FaComments,
  FaBell,
  FaFileAlt,
  FaFileExport,
  FaFileImport,
  FaCog,
  FaHistory,
  FaEquals
} from 'react-icons/fa'

export default function ReportsPage() {
  const { theme } = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Dados simulados para relatórios
  const reportData = {
    overview: {
      totalChamados: 1247,
      chamadosAbertos: 89,
      chamadosConcluidos: 1158,
      tempoMedioResolucao: '2.3 horas',
      satisfacaoMedia: 4.7,
      percentualResolucao: 92.8
    },
    trends: {
      chamadosPorMes: [156, 142, 178, 165, 189, 201, 234, 198, 167, 145, 178, 156],
      satisfacaoPorMes: [4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.8, 4.6, 4.5, 4.7, 4.8, 4.7],
      tempoMedioPorMes: [3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 2.0, 2.2, 2.4, 2.3, 2.2, 2.3]
    },
    departments: [
      { name: 'Equipamentos', chamados: 456, percentual: 36.6, tempoMedio: '1.8h', satisfacao: 4.8 },
      { name: 'Climatização', chamados: 234, percentual: 18.8, tempoMedio: '2.1h', satisfacao: 4.6 },
      { name: 'Iluminação', chamados: 189, percentual: 15.2, tempoMedio: '1.5h', satisfacao: 4.9 },
      { name: 'Informática', chamados: 167, percentual: 13.4, tempoMedio: '2.8h', satisfacao: 4.5 },
      { name: 'Hidráulica', chamados: 123, percentual: 9.9, tempoMedio: '2.2h', satisfacao: 4.7 },
      { name: 'Audiovisual', chamados: 78, percentual: 6.3, tempoMedio: '1.9h', satisfacao: 4.6 }
    ],
    priorities: [
      { name: 'Alta', count: 234, percentual: 18.8, color: 'red' },
      { name: 'Média', count: 567, percentual: 45.5, color: 'yellow' },
      { name: 'Baixa', count: 446, percentual: 35.7, color: 'green' }
    ],
    status: [
      { name: 'Concluído', count: 1158, percentual: 92.8, color: 'green' },
      { name: 'Em Andamento', count: 67, percentual: 5.4, color: 'yellow' },
      { name: 'Pendente', count: 22, percentual: 1.8, color: 'red' }
    ],
    topTechnicians: [
      { name: 'João Silva', chamados: 156, satisfacao: 4.9, tempoMedio: '1.8h', departamento: 'Equipamentos' },
      { name: 'Maria Santos', chamados: 134, satisfacao: 4.8, tempoMedio: '2.1h', departamento: 'Climatização' },
      { name: 'Pedro Costa', chamados: 123, satisfacao: 4.7, tempoMedio: '1.5h', departamento: 'Iluminação' },
      { name: 'Ana Oliveira', chamados: 98, satisfacao: 4.6, tempoMedio: '2.8h', departamento: 'Informática' }
    ],
    recentActivity: [
      { id: '#001', title: 'Manutenção Equipamento Lab 3', status: 'Concluído', technician: 'João Silva', time: '1h 30min', rating: 5 },
      { id: '#002', title: 'Problema Sistema de Ar', status: 'Em Andamento', technician: 'Maria Santos', time: '2h 15min', rating: null },
      { id: '#003', title: 'Troca de Lâmpadas Setor A', status: 'Concluído', technician: 'Pedro Costa', time: '45min', rating: 4 },
      { id: '#004', title: 'Manutenção Computadores', status: 'Concluído', technician: 'Ana Oliveira', time: '3h 20min', rating: 5 }
    ]
  }

  const periods = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mês' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'year', label: 'Último Ano' }
  ]

  const departments = [
    { value: 'all', label: 'Todos os Departamentos' },
    { value: 'equipamentos', label: 'Equipamentos' },
    { value: 'climatizacao', label: 'Climatização' },
    { value: 'iluminacao', label: 'Iluminação' },
    { value: 'informatica', label: 'Informática' },
    { value: 'hidraulica', label: 'Hidráulica' },
    { value: 'audiovisual', label: 'Audiovisual' }
  ]

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500'
      case 'yellow': return 'text-yellow-500'
      case 'green': return 'text-green-500'
      case 'blue': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getBgColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500/20'
      case 'yellow': return 'bg-yellow-500/20'
      case 'green': return 'bg-green-500/20'
      case 'blue': return 'bg-blue-500/20'
      default: return 'bg-gray-500/20'
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className="text-green-500" />
    if (current < previous) return <FaArrowDown className="text-red-500" />
    return <FaEquals className="text-gray-500" />
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={5}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      {/* Header */}
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios e Estatísticas</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Análise detalhada de chamados, performance e métricas do sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
            } transition-colors flex items-center space-x-2`}>
              <FaDownload />
              <span>Exportar</span>
            </button>
            <button className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
            } transition-colors flex items-center space-x-2`}>
              <FaPrint />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaFilter />
              </button>
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaCog />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Chamados</p>
              <p className="text-3xl font-bold">{reportData.overview.totalChamados}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(156, 142)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  +9.8% vs mês anterior
                </span>
              </div>
            </div>
            <FaClipboardList className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Taxa de Resolução</p>
              <p className="text-3xl font-bold text-green-500">{reportData.overview.percentualResolucao}%</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(92.8, 91.2)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  +1.6% vs mês anterior
                </span>
              </div>
            </div>
            <FaCheckCircle className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tempo Médio</p>
              <p className="text-3xl font-bold text-yellow-500">{reportData.overview.tempoMedioResolucao}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(2.3, 2.5)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  -8% vs mês anterior
                </span>
              </div>
            </div>
            <FaClock className="text-yellow-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Satisfação</p>
              <p className="text-3xl font-bold text-purple-500">{reportData.overview.satisfacaoMedia}/5</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(4.7, 4.6)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  +2.2% vs mês anterior
                </span>
              </div>
            </div>
            <FaStar className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Distribuição por Departamento
          </h3>
          <div className="space-y-4">
            {reportData.departments.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getBgColorClass(dept.name.toLowerCase().includes('equip') ? 'blue' : 'green')}`}></div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {dept.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dept.chamados} chamados
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {dept.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Distribuição por Prioridade
          </h3>
          <div className="space-y-4">
            {reportData.priorities.map((priority, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getBgColorClass(priority.color)}`}></div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {priority.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {priority.count} chamados
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {priority.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Technicians */}
      <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Melhores Técnicos
          </h3>
          <button className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            Ver Todos
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData.topTechnicians.map((technician, index) => (
            <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold`}>
                  {technician.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.name}
                  </h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {technician.departamento}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Chamados:</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.chamados}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Satisfação:</span>
                  <span className="font-medium text-green-500">{technician.satisfacao}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Tempo Médio:</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.tempoMedio}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Atividade Recente
          </h3>
          <button className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            Ver Histórico Completo
          </button>
        </div>
        
        <div className="space-y-4">
          {reportData.recentActivity.map((activity, index) => (
            <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {activity.id}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'Concluído' 
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {activity.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      <FaUser className="inline mr-1" />
                      {activity.technician}
                    </span>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      <FaClock className="inline mr-1" />
                      {activity.time}
                    </span>
                    {activity.rating && (
                      <span className="text-green-500">
                        <FaStar className="inline mr-1" />
                        {activity.rating}/5
                      </span>
                    )}
                  </div>
                </div>
                <button className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}>
                  <FaEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveLayout>
  )
}
