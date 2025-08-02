'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaMapMarkerAlt,
  FaTools,
  FaBuilding,
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
  FaClipboardList,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar
} from 'react-icons/fa'

export default function ChamadosPage() {
  const { theme } = useTheme()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Dados simulados para demonstração
  const chamados = [
    {
      id: '#001',
      title: 'Manutenção Equipamento Lab 3',
      description: 'Equipamento de solda apresentando falhas intermitentes durante as aulas práticas.',
      status: 'Em Andamento',
      priority: 'Alta',
      category: 'Equipamentos',
      location: 'Laboratório 3',
      technician: 'João Silva',
      requester: 'Prof. Maria Santos',
      createdAt: '2024-01-15 08:30',
      updatedAt: '2024-01-15 14:20',
      estimatedTime: '4h',
      actualTime: '2h 30min',
      tags: ['Urgente', 'Equipamento', 'Aula Prática']
    },
    {
      id: '#002',
      title: 'Problema Sistema de Ar Condicionado',
      description: 'Ar condicionado do setor A não está resfriando adequadamente.',
      status: 'Pendente',
      priority: 'Média',
      category: 'Climatização',
      location: 'Setor A',
      technician: 'Maria Santos',
      requester: 'Coord. Pedro Costa',
      createdAt: '2024-01-15 10:15',
      updatedAt: '2024-01-15 10:15',
      estimatedTime: '2h',
      actualTime: null,
      tags: ['Climatização', 'Conforto']
    },
    {
      id: '#003',
      title: 'Troca de Lâmpadas Setor A',
      description: 'Lâmpadas queimadas no corredor principal do setor A.',
      status: 'Concluído',
      priority: 'Baixa',
      category: 'Iluminação',
      location: 'Setor A',
      technician: 'Pedro Costa',
      requester: 'Seg. Ana Oliveira',
      createdAt: '2024-01-14 16:45',
      updatedAt: '2024-01-15 09:30',
      estimatedTime: '1h',
      actualTime: '45min',
      tags: ['Iluminação', 'Manutenção Preventiva']
    },
    {
      id: '#004',
      title: 'Manutenção Computadores Sala 2',
      description: 'Computadores da sala de aula 2 com problemas de performance.',
      status: 'Em Andamento',
      priority: 'Alta',
      category: 'Informática',
      location: 'Sala de Aula 2',
      technician: 'Ana Oliveira',
      requester: 'Prof. Carlos Lima',
      createdAt: '2024-01-15 07:00',
      updatedAt: '2024-01-15 13:45',
      estimatedTime: '3h',
      actualTime: '2h 15min',
      tags: ['Informática', 'Urgente', 'Aula']
    },
    {
      id: '#005',
      title: 'Vazamento no Banheiro Masculino',
      description: 'Vazamento na pia do banheiro masculino do setor B.',
      status: 'Pendente',
      priority: 'Média',
      category: 'Hidráulica',
      location: 'Setor B',
      technician: 'João Silva',
      requester: 'Limpeza',
      createdAt: '2024-01-15 11:30',
      updatedAt: '2024-01-15 11:30',
      estimatedTime: '1h 30min',
      actualTime: null,
      tags: ['Hidráulica', 'Urgente']
    },
    {
      id: '#006',
      title: 'Manutenção Projetor Auditório',
      description: 'Projetor do auditório principal com problemas de foco.',
      status: 'Concluído',
      priority: 'Média',
      category: 'Audiovisual',
      location: 'Auditório Principal',
      technician: 'Maria Santos',
      requester: 'Coord. Eventos',
      createdAt: '2024-01-13 14:20',
      updatedAt: '2024-01-14 10:15',
      estimatedTime: '2h',
      actualTime: '1h 45min',
      tags: ['Audiovisual', 'Eventos']
    }
  ]

  const statusOptions = [
    { value: 'all', label: 'Todos', color: 'gray' },
    { value: 'pendente', label: 'Pendente', color: 'red' },
    { value: 'em-andamento', label: 'Em Andamento', color: 'yellow' },
    { value: 'concluido', label: 'Concluído', color: 'green' }
  ]

  const priorityOptions = [
    { value: 'all', label: 'Todas', color: 'gray' },
    { value: 'alta', label: 'Alta', color: 'red' },
    { value: 'media', label: 'Média', color: 'yellow' },
    { value: 'baixa', label: 'Baixa', color: 'green' }
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

  const filteredChamados = chamados.filter(chamado => {
    const matchesStatus = selectedStatus === 'all' || 
      chamado.status.toLowerCase().includes(selectedStatus.replace('-', ' '))
    const matchesPriority = selectedPriority === 'all' || 
      chamado.priority.toLowerCase() === selectedPriority
    const matchesSearch = chamado.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chamado.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chamado.id.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  const stats = {
    total: chamados.length,
    pendentes: chamados.filter(c => c.status === 'Pendente').length,
    emAndamento: chamados.filter(c => c.status === 'Em Andamento').length,
    concluidos: chamados.filter(c => c.status === 'Concluído').length
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
            <h1 className="text-3xl font-bold mb-2">Chamados de Manutenção</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie e acompanhe todos os chamados de manutenção
            </p>
          </div>
          <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
            <FaPlus />
            <span>Novo Chamado</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaClipboardList className="text-blue-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pendentes</p>
                <p className="text-2xl font-bold text-red-500">{stats.pendentes}</p>
              </div>
              <FaExclamationTriangle className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.emAndamento}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Concluídos</p>
                <p className="text-2xl font-bold text-green-500">{stats.concluidos}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
            } transition-colors`}>
              <FaFilter />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-red-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
            >
              <FaClipboardList />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-red-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
            >
              <FaChartBar />
            </button>
          </div>
        </div>
      </div>

      {/* Chamados List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Chamados ({filteredChamados.length})
            </h2>
            <div className="flex gap-2">
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaDownload />
              </button>
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaPrint />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {chamado.id}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(chamado.status)}`}>
                          {chamado.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(chamado.priority)}`}>
                          {chamado.priority}
                        </span>
                        {chamado.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {chamado.title}
                      </h3>
                      
                      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chamado.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <FaUser className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            <strong>Solicitante:</strong> {chamado.requester}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaTools className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            <strong>Técnico:</strong> {chamado.technician}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            <strong>Local:</strong> {chamado.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaClock className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            <strong>Tempo Estimado:</strong> {chamado.estimatedTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-4 text-xs">
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                            Criado: {chamado.createdAt}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                            Atualizado: {chamado.updatedAt}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className={`p-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } transition-colors`}>
                            <FaEye />
                          </button>
                          <button className={`p-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } transition-colors`}>
                            <FaEdit />
                          </button>
                          <button className={`p-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-red-600 text-white hover:bg-red-500' 
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          } transition-colors`}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {chamado.id}
                    </span>
                    <button className={`p-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}>
                      <FaEllipsisV />
                    </button>
                  </div>

                  <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {chamado.title}
                  </h3>

                  <p className={`text-sm mb-4 line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {chamado.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(chamado.status)}`}>
                      {chamado.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(chamado.priority)}`}>
                      {chamado.priority}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <FaUser className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {chamado.technician}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {chamado.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaClock className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {chamado.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  )
}
