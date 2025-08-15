'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import Link from 'next/link'
import EmployeeRegisterModal from '../../../components/employees/EmployeeRegisterModal'
import ConfirmDeleteModal from '../../../components/modals/ConfirmDeleteModal'
import { authCookies } from '../../../utils/cookies'
import {
  FaUser,
  FaUsers,
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
  FaBell,
  FaUserTie,
  FaBriefcase,
  FaUniversity,
  FaHeart,
  FaUserGraduate,
  FaUserCog,
  FaUserCheck,
  FaUserClock,
  FaUserTimes
} from 'react-icons/fa'

export default function UsersPage() {
  const { theme } = useTheme()
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedClientType, setSelectedClientType] = useState<'all' | 'Individual' | 'Business' | 'Enterprise'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const token = authCookies.getToken()
        if (!token) throw new Error('Não autenticado')
        const params = new URLSearchParams({ limit: '200' })
        if (selectedClientType !== 'all') params.set('client_type', selectedClientType)
        if (selectedStatus === 'ativo') params.set('is_active', 'true')
        if (selectedStatus === 'inativo') params.set('is_active', 'false')
        if (searchTerm.trim()) params.set('search', searchTerm.trim())

        const resp = await fetch(`/admin/client?${params.toString()}` , {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!resp.ok) {
          const t = await resp.text()
          throw new Error(t || 'Falha ao carregar colaboradores')
        }
        const json = await resp.json()
        const items = (json.clients || []).map((c: any) => ({
          id: String(c.matricu_id || c.user?.id || c.id),
          clientId: c.id,
          name: c.user?.name || '—',
          email: c.user?.email || '—',
          phone: c.user?.phone || '—',
          department: c.department || '—',
          role: 'Profissional',
          status: c.user?.is_active ? 'Ativo' : 'Inativo',
          position: c.position || '—',
          client_type: c.client_type,
          matricu_id: c.matricu_id || '',
          cpf: c.cpf || '',
          rating: Math.min(5, Math.max(0, (c._count?.tickets || 0) / 10 + 4)),
          projectsCompleted: c._count?.tickets || 0,
          activeProjects: 0,
          location: c.address || '—',
          avatar: c.user?.avatar || null,
          performance: { leadership: 0, communication: 0, problemSolving: 0, teamwork: 0 },
          skills: [],
          education: [],
          recentActivities: [],
        }))
        setEmployees(items)
      } catch (e: any) {
        setLoadError(e.message || 'Erro ao carregar colaboradores')
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      fetchClients()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [selectedClientType, selectedStatus, searchTerm])

  // Dados simulados dos usuários/colaboradores
  const users: any[] = []

  const departments: { value: string; label: string }[] = [
  ]

  const roleOptions = [
    { value: 'all', label: 'Todos os Papéis' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'profissional', label: 'Profissional' },
    { value: 'técnico', label: 'Técnico' },
  ]

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
  ]

  const clientTypeOptions = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'Individual', label: 'Individual' },
    { value: 'Business', label: 'Business' },
    { value: 'Enterprise', label: 'Enterprise' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'Inativo':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'Férias':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case 'Licença':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-500/20 text-red-600'
      case 'Profissional':
        return 'bg-blue-500/20 text-blue-600'
      case 'Técnico':
        return 'bg-green-500/20 text-green-600'
      default:
        return 'bg-gray-500/20 text-gray-600'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 4.0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const filteredUsers = employees.filter(user => {
    const matchesDepartment = selectedDepartment === 'all' || 
      (user.department || '').toLowerCase() === selectedDepartment
    const matchesRole = selectedRole === 'all' || 
      (user.role || '').toLowerCase() === selectedRole
    const matchesStatus = selectedStatus === 'all' || 
      (user.status || '').toLowerCase() === selectedStatus
    const matchesClientType = selectedClientType === 'all' || true // já filtrado no servidor
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.id || '').toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDepartment && matchesRole && matchesStatus && matchesClientType && matchesSearch
  })

  const stats = {
    total: employees.length,
    ativos: employees.filter(u => u.status === 'Ativo').length,
    administradores: employees.filter(u => u.role === 'Administrador').length,
    totalProjects: employees.reduce((sum, u) => sum + (u.projectsCompleted || 0), 0)
  }

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Nome', 'Email', 'Telefone', 'Departamento', 'Cargo', 'Status', 'Projetos Concluídos', 'Local', 'Rating'
    ]
    const escape = (val: any) => {
      const s = String(val ?? '').replace(/\r|\n/g, ' ')
      if (s.includes('"') || s.includes(',') || s.includes(';')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = filteredUsers.map(u => [
      u.id, u.name, u.email, u.phone, u.department, u.position, u.status, u.projectsCompleted, u.location, u.rating
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.href = url
    a.download = `colaboradores-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const htmlRows = filteredUsers.map(u => `
      <tr>
        <td>${u.id ?? ''}</td>
        <td>${u.name ?? ''}</td>
        <td>${u.email ?? ''}</td>
        <td>${u.phone ?? ''}</td>
        <td>${u.department ?? ''}</td>
        <td>${u.position ?? ''}</td>
        <td>${u.status ?? ''}</td>
        <td>${u.projectsCompleted ?? 0}</td>
        <td>${u.location ?? ''}</td>
        <td>${u.rating ?? ''}</td>
      </tr>
    `).join('')
    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 16px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f2f2f2; }
      </style>
    `
    const content = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${style}
          <title>Colaboradores</title>
        </head>
        <body>
          <h1>Colaboradores</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Departamento</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Projetos</th>
                <th>Local</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `
    const w = window.open('', '_blank')
    if (!w) return
    w.document.open()
    w.document.write(content)
    w.document.close()
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      {/* Header */}
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Colaboradores</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie a equipe de colaboradores e acompanhe o desempenho dos profissionais
            </p>
          </div>
          <button
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <FaPlus />
            <span>Novo Colaborador</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Colaboradores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUsers className="text-blue-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ativos</p>
                <p className="text-2xl font-bold text-green-500">{stats.ativos}</p>
              </div>
              <FaUserCheck className="text-green-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Administradores</p>
                <p className="text-2xl font-bold text-red-500">{stats.administradores}</p>
              </div>
              <FaShieldAlt className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Projetos</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalProjects}</p>
              </div>
              <FaBriefcase className="text-purple-500 text-xl" />
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
              placeholder="Buscar colaboradores..."
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
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {roleOptions.map(option => (
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

            <select
              value={selectedClientType}
              onChange={(e) => setSelectedClientType(e.target.value as any)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {clientTypeOptions.map(option => (
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

      {/* Users List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Colaboradores ({filteredUsers.length})
            </h2>
            <div className="flex gap-2">
              <button onClick={handleExportCSV} className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaDownload />
              </button>
              <button onClick={handleExportPDF} className={`p-2 rounded-lg ${
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
              {filteredUsers.map((user, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.split(' ').map((n: string) => n[0]).join('')
                        )}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.id} • {user.position}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          <div className="flex items-center space-x-1">
                            <FaStar className={`text-sm ${getRatingColor(user.rating)}`} />
                            <span className={`text-sm font-medium ${getRatingColor(user.rating)}`}>
                              {user.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        <FaEye />
                      </button>
                      <button className={`p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`} onClick={() => {
                        // navegar para edição do colaborador
                        window.location.href = `/pages/employees/${encodeURIComponent(user.clientId)}`
                      }}>
                        <FaEdit />
                      </button>
                      <button
                        className={`p-2 rounded-lg ${
                          theme === 'dark'
                            ? 'bg-red-600 text-white hover:bg-red-500'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        } transition-colors`}
                        onClick={() => setDeleteTarget(user)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaPhone className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {user.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {user.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {user.location}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Experiência:</strong> {user.experience}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Projetos Concluídos:</strong> {user.projectsCompleted}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Projetos Ativos:</strong> {user.activeProjects}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  } flex flex-col min-h-[240px]`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.split(' ').map((n: string) => n[0]).join('')
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </h3>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.position} • {user.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <FaStar className={`text-sm ${getRatingColor(user.rating)}`} />
                    <span className={`text-sm font-medium ${getRatingColor(user.rating)}`}>
                      {user.rating}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-1 gap-2 text-xs flex-1">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{user.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBriefcase className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{user.projectsCompleted} projetos</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <FaEye />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                      onClick={() => {
                        window.location.href = `/pages/employees/${encodeURIComponent(user.clientId)}`
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      } transition-colors`}
                      onClick={() => setDeleteTarget(user)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Perfil do Colaborador
                </h2>
                <button 
                  onClick={() => setSelectedUser(null)}
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
                        {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedUser.id}
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <FaStar className={`text-sm ${getRatingColor(selectedUser.rating)}`} />
                        <span className={`text-sm font-medium ${getRatingColor(selectedUser.rating)}`}>
                          {selectedUser.rating}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FaEnvelope className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedUser.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaPhone className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedUser.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedUser.department}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedUser.location}
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
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Liderança</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: `${selectedUser.performance.leadership}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUser.performance.leadership}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Comunicação</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: `${selectedUser.performance.communication}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUser.performance.communication}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Resolução de Problemas</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${selectedUser.performance.problemSolving}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUser.performance.problemSolving}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Trabalho em Equipe</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{width: `${selectedUser.performance.teamwork}%`}}></div>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUser.performance.teamwork}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Education */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Habilidades e Formação
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Habilidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.skills.map((skill: string, index: number) => (
                            <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Formação Acadêmica</h4>
                        <div className="space-y-2">
                          {selectedUser.education.map((edu: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <FaGraduationCap className="text-blue-500 text-sm" />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {edu}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Atividades Recentes
                    </h3>
                    <div className="space-y-3">
                      {selectedUser.recentActivities.map((activity: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {activity.title}
                              </p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {activity.id} • {activity.date}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                              {activity.status}
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

      {/* Create Employee Modal */}
      <EmployeeRegisterModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(item) => {
          setEmployees(prev => [item, ...prev])
          setIsCreateOpen(false)
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Excluir colaborador"
        description={`Tem certeza que deseja excluir ${deleteTarget?.name ?? 'este colaborador'}? Esta ação não pode ser desfeita.`}
        confirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          setIsDeleting(true)
          try {
            const token = authCookies.getToken()
            const resp = await fetch(`http://localhost:3001/admin/client/${encodeURIComponent(deleteTarget.clientId)}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!resp.ok) {
              const t = await resp.text()
              throw new Error(t || 'Falha ao excluir colaborador')
            }
            setEmployees(prev => prev.filter(u => u.id !== deleteTarget.id))
            setDeleteTarget(null)
          } catch (e) {
            alert((e as any).message || 'Erro ao excluir colaborador')
          } finally {
            setIsDeleting(false)
          }
        }}
      />
    </ResponsiveLayout>
  )
}
