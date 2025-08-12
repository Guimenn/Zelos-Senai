'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaUser,
  FaTools,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaPrint,
  FaEllipsisV,
  FaClipboardList,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar,
  FaGraduationCap,
  FaShieldAlt,
  FaBuilding,
  FaIdCard,
  FaCertificate,
  FaAward,
  FaCalendar,
  FaTachometerAlt,
  FaThumbsUp,
  FaComments,
  FaBell
} from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import TechnicianRegisterModal from '../../../components/maintenance/TechnicianRegisterModal'

export default function MaintenancePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [currentTechnician, setCurrentTechnician] = useState<any>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [editForm, setEditForm] = useState({
    department: '',
    skills: '' as string,
    max_tickets: 10 as number,
    is_active: true as boolean,
  })

  // Técnicos carregados da API
  const [technicians, setTechnicians] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const res = await fetch('/admin/agent?page=1&limit=100', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Erro ao carregar técnicos')
        const mapped = (data?.agents || []).map((a: any) => {
          const skills: string[] = a.skills || []
          // Extrair extras serializados
          const certifications = skills.filter((s) => s.startsWith('CERT:')).map((s) => s.replace('CERT:', ''))
          const experience = skills.find((s) => s.startsWith('EXP:'))?.replace('EXP:', '') || '-'
          const availability = skills.find((s) => s.startsWith('AVAIL:'))?.replace('AVAIL:', '') || '-'
          const urgency = skills.find((s) => s.startsWith('URGENCY:'))?.replace('URGENCY:', '') || '-'
          // Habilidade principal como especialidade
          const specialty = skills.find((s) => !s.startsWith('CERT:') && !s.startsWith('EXP:') && !s.startsWith('AVAIL:') && !s.startsWith('URGENCY:')) || 'Técnico'

          return {
            agentId: a.id,
            displayId: a.employee_id ?? `AG-${a.id}`,
            name: a.user?.name ?? 'Sem nome',
            email: a.user?.email ?? '-',
            phone: a.user?.phone ?? '-',
            department: a.department ?? 'Geral',
            specialty,
      status: 'Disponível',
            experience: experience === '-' ? '-' : `${experience} anos`,
            rating: 4.5,
            completedJobs: a._count?.ticket_assignments ?? 0,
            activeJobs: 0,
            location: '-',
            avatar: a.user?.avatar ?? null,
            certifications,
            skills: skills.filter((s) => !s.startsWith('CERT:') && !s.startsWith('EXP:') && !s.startsWith('AVAIL:') && !s.startsWith('URGENCY:')),
            availability,
            urgency,
            emergencyContact: '-',
            supervisor: '-',
            hireDate: '-',
            lastTraining: '-',
            performance: { efficiency: 0, quality: 0, punctuality: 0, teamwork: 0 },
            recentWork: [],
          }
        })
        setTechnicians(mapped)
      } catch (e: any) {
        setLoadError(e?.message || 'Falha ao carregar técnicos')
      } finally {
        setIsLoading(false)
      }
    }
    load()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      load()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const departments = [
    { value: 'all', label: 'Todos os Departamentos' },
    { value: 'equipamentos', label: 'Equipamentos' },
    { value: 'climatizacao', label: 'Climatização' },
    { value: 'iluminacao', label: 'Iluminação' },
    { value: 'informatica', label: 'Informática' }
  ]

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'disponivel', label: 'Disponível' },
    { value: 'em-trabalho', label: 'Em Trabalho' },
    { value: 'ausente', label: 'Ausente' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'Em Trabalho':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'Ausente':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 4.0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const filteredTechnicians = technicians.filter(technician => {
    const matchesDepartment = selectedDepartment === 'all' || 
      technician.department.toLowerCase() === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || 
      technician.status.toLowerCase().includes(selectedStatus.replace('-', ' '))
    const matchesSearch = technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      technician.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(technician.displayId).toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDepartment && matchesStatus && matchesSearch
  })

  const stats = {
    total: technicians.length,
    disponiveis: technicians.filter(t => t.status === 'Disponível').length,
    emTrabalho: technicians.filter(t => t.status === 'Em Trabalho').length,
    totalJobs: technicians.reduce((sum, t) => sum + t.completedJobs, 0)
  }

  const handleDelete = async (agentId: number) => {
    // Garantir autenticação
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setActionError('Você precisa estar autenticado como Admin para excluir um técnico.')
      return
    }
    setActionError(null)
    setActionLoadingId(agentId)
    try {
      const res = await fetch(`/admin/agent/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token ?? ''}`,
        },
      })
      if (!res.ok) {
        if (res.status === 401) {
          setActionError('Sessão expirada ou inválida. Faça login novamente como Admin.')
          return
        }
        if (res.status === 403) {
          setActionError('Sem permissão. A conta atual não é Admin.')
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Erro ao excluir técnico')
      }
      // Remover da lista
      setTechnicians(prev => prev.filter((t: any) => t.agentId !== agentId))
    } catch (e: any) {
      setActionError(e?.message || 'Erro ao excluir técnico')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleEdit = async (agentId: number, updates: Partial<any>) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setActionError('Você precisa estar autenticado como Admin para editar um técnico.')
      return
    }
    setActionError(null)
    setActionLoadingId(agentId)
    try {
      const res = await fetch(`/admin/agent/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          setActionError('Sessão expirada ou inválida. Faça login novamente como Admin.')
          return
        }
        if (res.status === 403) {
          setActionError('Sem permissão. A conta atual não é Admin.')
          return
        }
        throw new Error(data?.message || 'Erro ao atualizar técnico')
      }
      // Recarregar lista rapidamente
      setTechnicians(prev => prev.map((t: any) => (t.agentId === agentId) ? { ...t, ...updates } : t))
    } catch (e: any) {
      setActionError(e?.message || 'Erro ao atualizar técnico')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      {/* Header */}
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Equipe de Manutenção</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie a equipe técnica e acompanhe o desempenho dos profissionais
            </p>
          </div>
          <button
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            onClick={() => setRegisterModalOpen(true)}
          >
            <FaPlus />
            <span>Novo Técnico</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Técnicos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUser className="text-blue-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Disponíveis</p>
                <p className="text-2xl font-bold text-green-500">{stats.disponiveis}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Em Trabalho</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.emTrabalho}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Serviços</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalJobs}</p>
              </div>
              <FaTools className="text-purple-500 text-xl" />
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
              placeholder="Buscar técnicos..."
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
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {departments.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

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

            <button
              onClick={() => {
                setSelectedDepartment('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
              } transition-colors`}
            >
              Limpar filtros
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

      {/* Technicians List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Técnicos ({filteredTechnicians.length}{isLoading ? '...' : ''})
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
          {loadError && (
            <div className="mb-4 text-sm text-red-500">{loadError}</div>
          )}
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredTechnicians.map((technician, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center space-x-4 cursor-pointer"
                    onClick={() => setSelectedTechnician(technician)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedTechnician(technician)
                    }}
                  >
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl`}>
                        {technician.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {technician.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {technician.displayId} • {technician.specialty}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(technician.status)}`}>
                            {technician.status}
                          </span>
                          {technician.availability && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                              Disponibilidade: {technician.availability}
                            </span>
                          )}
                          {technician.urgency && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                              Urgência: {technician.urgency}
                            </span>
                          )}
                          <div className="flex items-center space-x-1">
                            <FaStar className={`text-sm ${getRatingColor(technician.rating)}`} />
                            <span className={`text-sm font-medium ${getRatingColor(technician.rating)}`}>
                              {technician.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
            {actionError && (
              <div className="mb-2 text-sm text-red-500">{actionError}</div>
            )}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedTechnician(technician)}
                        aria-label={`Visualizar técnico ${technician.name}`}
                        title="Visualizar"
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTechnician(technician)
                          setEditForm({
                            department: technician.department || '',
                            skills: (technician.skills || []).join(', '),
                            max_tickets: 10,
                            is_active: true,
                          })
                          setEditModalOpen(true)
                        }}
                        aria-label={`Editar técnico ${technician.name}`}
                        title="Editar"
                        className={`p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`}>
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTechnician(technician)
                          setDeleteConfirmText('')
                          setDeleteModalOpen(true)
                        }}
                        aria-label={`Excluir técnico ${technician.name}`}
                        title="Excluir"
                        className={`p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-red-600 text-white hover:bg-red-500' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      } transition-colors`}>
                        {actionLoadingId === (typeof technician.id === 'string' && technician.id.startsWith('AG-') ? parseInt(technician.id.replace('AG-', '')) : technician.id) ? '...' : <FaTrash />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {technician.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaPhone className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {technician.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {technician.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {technician.location}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Experiência:</strong> {technician.experience}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Serviços Concluídos:</strong> {technician.completedJobs}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Serviços Ativos:</strong> {technician.activeJobs}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTechnicians.map((technician, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {technician.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {technician.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {technician.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setSelectedTechnician(technician)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Visualizar"
                      >
                        <FaEye className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Status e Avaliação */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(technician.status)}`}>
                      {technician.status}
                    </span>
                    <div className="flex items-center space-x-1">
                      <FaStar className={`text-sm ${getRatingColor(technician.rating)}`} />
                      <span className={`text-sm font-bold ${getRatingColor(technician.rating)}`}>
                        {technician.rating}
                      </span>
                    </div>
                  </div>

                  {/* Informações Principais */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {technician.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaTools className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {technician.completedJobs} serviços concluídos
                      </span>
                    </div>
                    {technician.experience && technician.experience !== '-' && (
                      <div className="flex items-center space-x-2">
                        <FaGraduationCap className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {technician.experience} de experiência
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags de Disponibilidade e Urgência */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {technician.availability && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {technician.availability}
                      </span>
                    )}
                    {technician.urgency && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-orange-900/30 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        Urgência: {technician.urgency}
                      </span>
                    )}
                  </div>

                  {/* Certificações (se houver) */}
                  {technician.certifications && technician.certifications.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaCertificate className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Certificações:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {technician.certifications.slice(0, 2).map((cert: string, certIndex: number) => (
                          <span key={certIndex} className={`px-2 py-1 rounded text-xs ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cert}
                          </span>
                        ))}
                        {technician.certifications.length > 2 && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            +{technician.certifications.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Technician Profile Modal */}
      {selectedTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Perfil do Técnico
                </h2>
                <button 
                  onClick={() => setSelectedTechnician(null)}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } transition-colors`}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="lg:col-span-1">
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-3xl mb-4`}>
                        {selectedTechnician.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTechnician.name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedTechnician.displayId}
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <FaStar className={`text-sm ${getRatingColor(selectedTechnician.rating)}`} />
                        <span className={`text-sm font-medium ${getRatingColor(selectedTechnician.rating)}`}>
                          {selectedTechnician.rating}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FaEnvelope className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedTechnician.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaPhone className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedTechnician.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedTechnician.department}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedTechnician.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Skills */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Performance Metrics */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Métricas de Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Eficiência</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: `${selectedTechnician.performance.efficiency}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedTechnician.performance.efficiency}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Qualidade</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: `${selectedTechnician.performance.quality}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedTechnician.performance.quality}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pontualidade</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${selectedTechnician.performance.punctuality}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedTechnician.performance.punctuality}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Trabalho em Equipe</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{width: `${selectedTechnician.performance.teamwork}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedTechnician.performance.teamwork}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Habilidades e Certificações
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Habilidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTechnician.skills.map((skill: string, index: number) => (
                            <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Certificações</h4>
                        <div className="space-y-2">
                          {selectedTechnician.certifications.map((cert: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <FaCertificate className="text-green-500 text-sm" />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {cert}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Work */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Trabalhos Recentes
                    </h3>
                    <div className="space-y-3">
                      {selectedTechnician.recentWork.map((work: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {work.title}
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {work.id} • {work.date}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(work.status)}`}>
                              {work.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Technician Modal */}
      {editModalOpen && currentTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-lg w-full ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Editar Técnico</h3>
                <button onClick={() => setEditModalOpen(false)} className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Departamento</label>
                <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Skills (separe por vírgula)</label>
                <input value={editForm.skills} onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Máx. Tickets</label>
                  <input type="number" min={1} value={editForm.max_tickets} onChange={e => setEditForm(f => ({ ...f, max_tickets: parseInt(e.target.value || '1') }))} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Ativo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setEditModalOpen(false)} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>Cancelar</button>
              <button onClick={() => {
                const updates: any = {
                  department: editForm.department,
                  skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
                  max_tickets: editForm.max_tickets,
                  is_active: editForm.is_active,
                }
                handleEdit(currentTechnician.agentId, updates)
                setEditModalOpen(false)
              }} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && currentTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Excluir Técnico</h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>Esta ação é irreversível. Digite <strong>EXCLUIR</strong> para confirmar.</p>
            </div>
            <div className="p-4 space-y-3">
              <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                Técnico: <strong>{currentTechnician.name}</strong>
              </div>
              <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="EXCLUIR" className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setDeleteModalOpen(false)} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>Cancelar</button>
              <button disabled={deleteConfirmText.toUpperCase() !== 'EXCLUIR'} onClick={() => { handleDelete(currentTechnician.agentId); setDeleteModalOpen(false) }} className={`px-4 py-2 rounded-lg ${deleteConfirmText.toUpperCase() !== 'EXCLUIR' ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Register Modal */}
      <TechnicianRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(newTechnician) => {
          setTechnicians(prev => [...prev, newTechnician])
          setRegisterModalOpen(false)
        }}
      />
    </ResponsiveLayout>
  )
}
