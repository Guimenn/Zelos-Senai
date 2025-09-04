'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import EmployeeRegisterModal from '../../../components/employees/EmployeeRegisterModal'
import ConfirmDeleteModal from '../../../components/modals/ConfirmDeleteModal'
import { authCookies } from '../../../utils/cookies'
import { useRequireAuth } from '../../../hooks/useAuth'
import { jwtDecode } from 'jwt-decode'
import { useI18n } from '../../../contexts/I18nContext'
import { API_BASE } from '../../../lib/config'
import Link from 'next/link'
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
  FaUserTimes,
  FaTimes,
  FaCheck
} from 'react-icons/fa'
import { toast } from 'react-toastify'

export default function UsersPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireAuth()
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedPosition, setSelectedPosition] = useState('all')
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
  const [isAgent, setIsAgent] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [userName, setUserName] = useState('')
  // Estados para modal de edição (estrutura igual ao técnico)
  const [catOptions, setCatOptions] = useState<any[]>([])
  const [selectedCatId, setSelectedCatId] = useState<number | ''>('')
  const [subcatOptions, setSubcatOptions] = useState<{ id: number, name: string }[]>([])
  const [selectedSubcatId, setSelectedSubcatId] = useState<number | ''>('')
  const [editIsActive, setEditIsActive] = useState<boolean>(true)
  const [editUser, setEditUser] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  // Opções estáticas de cargos e departamentos para o editor
  const cargosOptions = [
    { key: 'analyst', label: t('employees.positions.analyst') },
    { key: 'assistant', label: t('employees.positions.assistant') },
    { key: 'auxiliary', label: t('employees.positions.auxiliary') },
    { key: 'coordinator', label: t('employees.positions.coordinator') },
    { key: 'director', label: t('employees.positions.director') },
    { key: 'intern', label: t('employees.positions.intern') },
    { key: 'manager', label: t('employees.positions.manager') },
    { key: 'operator', label: t('employees.positions.operator') },
    { key: 'supervisor', label: t('employees.positions.supervisor') },
    { key: 'technician', label: t('employees.positions.technician') },
    { key: 'others', label: t('employees.positions.others') }
  ]
  const departamentosOptions = [
    { key: 'administrative', label: t('employees.departments.administrative') },
    { key: 'commercial', label: t('employees.departments.commercial') },
    { key: 'financial', label: t('employees.departments.financial') },
    { key: 'hr', label: t('employees.departments.hr') },
    { key: 'it', label: t('employees.departments.it') },
    { key: 'maintenance', label: t('employees.departments.maintenance') },
    { key: 'marketing', label: t('employees.departments.marketing') },
    { key: 'operational', label: t('employees.departments.operational') },
    { key: 'production', label: t('employees.departments.production') },
    { key: 'quality', label: t('employees.departments.quality') },
    { key: 'humanResources', label: t('employees.departments.humanResources') },
    { key: 'workplaceSafety', label: t('employees.departments.workplaceSafety') },
    { key: 'supplies', label: t('employees.departments.supplies') },
    { key: 'sales', label: t('employees.departments.sales') },
    { key: 'others', label: t('employees.departments.others') }
  ]
  const [editPosition, setEditPosition] = useState<string>('')
  const [editDepartment, setEditDepartment] = useState<string>('')
  const [editPassword, setEditPassword] = useState<string>('')
  const [editName, setEditName] = useState<string>('')
  const [editEmail, setEditEmail] = useState<string>('')
  const [editAvatar, setEditAvatar] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('')
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false)

  // Função para alternar status do colaborador (ativar/desativar)
  const handleToggleStatus = async (employee: any) => {
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
    if (!token) {
      toast.error('Token de autenticação não encontrado')
      return
    }
    
    try {
      const res = await fetch(`/admin/user/${employee.userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.')
          return
        }
        if (res.status === 403) {
          toast.error('Sem permissão para realizar esta ação.')
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Erro ao alternar status do colaborador')
      }
      
      const data = await res.json()
      
      // Atualizar o status na lista local
      setEmployees(prev => prev.map((emp: any) => 
        emp.userId === employee.userId 
          ? { 
              ...emp, 
              status: data.user.is_active ? 'Ativo' : 'Inativo',
              is_active: data.user.is_active
            } 
          : emp
      ))
      
      // Mostrar mensagem de sucesso com toast
      toast.success(data.user.is_active ? t('employees.toggleStatus.activated') : t('employees.toggleStatus.deactivated'))
      
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao alternar status do colaborador')
    }
  }

  // Função para lidar com upload de avatar
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }
      
      setEditAvatar(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  const [recentTickets, setRecentTickets] = useState<any[]>([])

  // Função para tratar URLs de avatar
  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null
    
    // Se já é uma URL completa, retorna como está
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl
    }
    
    // Se é uma URL relativa, adiciona o domínio base
    if (avatarUrl.startsWith('/')) {
      return `${window.location.origin}${avatarUrl}`
    }
    
    // Se não tem barra no início, adiciona
    return `${window.location.origin}/${avatarUrl}`
  }

  // Carregar as duas últimas atividades (tickets) do colaborador ao abrir o modal de visualização
  useEffect(() => {
    const loadRecent = async () => {
      if (!selectedUser?.clientId) { 
       
        setRecentTickets([]); 
        return 
      }
      try {
        const token = authCookies.getToken()
       
        
        // Buscar tickets específicos do cliente
        const resp = await fetch(`/helpdesk/tickets?page=1&limit=50`, { 
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } 
        })
        const data = await resp.json()
        const list = Array.isArray(data?.tickets) ? data.tickets : []
    
        
        // Filtrar tickets do cliente específico
        const mine = list.filter((t: any) => {
          const isClientTicket = t.client?.id === selectedUser.clientId
        
          return isClientTicket
        }).slice(0, 2)
     
        setRecentTickets(mine)
      } catch (error) { 
        console.error('Erro ao carregar tickets recentes:', error)
        setRecentTickets([]) 
      }
    }
    if (selectedUser) loadRecent()
  }, [selectedUser])

  // Verificar permissões do usuário
  useEffect(() => {
    if (authLoading || !user) return
    
    const role = (user?.role ?? user?.userRole ?? '').toString().toLowerCase()
    const isAgentUser = role === 'agent' || role === 'tecnico'
    const isClientUser = role === 'client' || role === 'profissional'
    
    setIsAgent(isAgentUser)
    setIsClient(isClientUser)
    setUserName(user?.name || '')
    
   
  }, [authLoading, user?.role, user?.userRole, user?.name]) // Dependências específicas

  useEffect(() => {
    // Só carregar dados se não estiver carregando autenticação e tiver usuário
    if (authLoading || !user) {
      return
    }
    
    const fetchClients = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const token = authCookies.getToken()
        if (!token) throw new Error('Não autenticado')
        // Para clientes, usar rota específica; para admins e agentes, usar rota admin
        const endpoint = isClient ? '/helpdesk/client/colaboradores' : '/admin/client'
        const params = new URLSearchParams({ limit: '200' })
        if (selectedClientType !== 'all') params.set('client_type', selectedClientType)
        if (selectedStatus === 'ativo') params.set('is_active', 'true')
        if (selectedStatus === 'inativo') params.set('is_active', 'false')
        if (searchTerm.trim()) params.set('search', searchTerm.trim())

        const resp = await fetch(`${endpoint}?${params.toString()}` , {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!resp.ok) {
          const t = await resp.text()
          throw new Error(t || t('employees.errors.loadFailed'))
        }
        const json = await resp.json()
        const items = (json.clients || []).map((c: any) => {
          // Log para debug do avatar
      
          
          return {
            id: String(c.matricu_id || c.user?.id || c.id),
            clientId: c.id,
            userId: c.user?.id,
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
            avatar: getAvatarUrl(c.user?.avatar),
            performance: { leadership: 0, communication: 0, problemSolving: 0, teamwork: 0 },
            skills: [],
            education: [],
            recentActivities: [],
            is_active: c.user?.is_active ?? true,
          }
        })
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
  }, [authLoading, user, selectedClientType, selectedStatus, searchTerm, isClient]) // Adicionar dependências de autenticação

  // Dados simulados dos usuários/colaboradores
  const users: any[] = []

  // Normalizador sem acentos para comparar filtros
  const normalize = (s: string) => {
    return (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  // Opções de departamentos geradas dinamicamente a partir dos dados carregados
  const departments = [
    { value: 'all', label: t('employees.filters.selectDepartment') },
    ...[
      'Administrativo',
      'Comercial',
      'Financeiro',
      'Gestão de Pessoas',
      'Informática',
      'Manutenção',
      'Marketing',
      'Operacional',
      'Produção',
      'Qualidade',
      'Recursos Humanos',
      'Segurança do Trabalho',
      'Suprimentos',
      'Vendas',
      'Outros',
    ].map((d) => ({ value: normalize(d), label: d }))
  ]

  const positions = [
    { value: 'all', label: t('employees.filters.selectPosition') },
    ...[
      { key: 'Analista', label: t('employees.positions.analyst') },
      { key: 'Assistente', label: t('employees.positions.assistant') },
      { key: 'Auxiliar', label: t('employees.positions.auxiliary') },
      { key: 'Coordenador', label: t('employees.positions.coordinator') },
      { key: 'Diretor', label: t('employees.positions.director') },
      { key: 'Estagiário', label: t('employees.positions.intern') },
      { key: 'Gerente', label: t('employees.positions.manager') },
      { key: 'Operador', label: t('employees.positions.operator') },
      { key: 'Supervisor', label: 'Supervisor' },
      { key: 'Técnico', label: 'Técnico' },
      { key: 'Outros', label: 'Outros' },
    ].map((p) => ({ value: normalize(p.key), label: p.label }))
  ]

  const roleOptions = [
    { value: 'profissional', label: 'Profissional' },
    { value: 'técnico', label: 'Técnico' },
  ]

  const statusOptions = [
    { value: 'all', label: t('employees.filters.all') },
    { value: 'ativo', label: t('employees.status.active') },
    { value: 'inativo', label: t('employees.status.inactive') },
  ]

  // Filtro por tipo removido

  const getStatusColor = (status: string) => {
    switch (status) {
      case t('employees.status.active'):
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case t('employees.status.inactive'):
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      case t('employees.status.vacation'):
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case t('employees.status.leave'):
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-green-500/30'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case t('employees.roles.admin'):
        return 'bg-red-500/20 text-red-600'
      case t('employees.roles.professional'):
        return 'bg-blue-500/20 text-blue-600'
      case t('employees.roles.technician'):
        return 'bg-green-500/20 text-green-600'
      default:
        return 'bg-gray-500/20 text-gray-600'
    }
  }

 

  const filteredUsers = employees.filter(user => {
    const matchesDepartment = selectedDepartment === 'all' || normalize(user.department || '') === selectedDepartment
    const matchesPosition = selectedPosition === 'all' || normalize(user.position || '') === selectedPosition
    const matchesStatus = selectedStatus === 'all' || (user.status || '').toLowerCase() === selectedStatus
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.id || '').toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDepartment && matchesPosition && matchesStatus && matchesSearch
  })

  const stats = {
    total: employees.length,
    ativos: employees.filter(u => u.status === t('employees.status.active')).length,
    administradores: employees.filter(u => u.role === t('employees.roles.admin')).length,
    totalProjects: employees.reduce((sum, u) => sum + (u.projectsCompleted || 0), 0)
  }

  const handleExportCSV = () => {
    const headers = [
              'ID', t('employees.profile.name'), t('employees.profile.email'), t('employees.new.phone'), t('employees.profile.department'), t('employees.profile.position'), t('employees.status.title'), t('employees.projects.completed'), t('employees.location')
    ]
    const escape = (val: any) => {
      const s = String(val ?? '').replace(/\r|\n/g, ' ')
      if (s.includes('"') || s.includes(',') || s.includes(';')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = filteredUsers.map(u => [
      u.id, u.name, u.email, u.phone, u.department, u.position, u.status, u.projectsCompleted, u.location
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.href = url
    a.download = `${t('employees.export.filename')}-${date}.csv`
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
                <th>{t('employees.profile.department')}</th>
                <th>{t('employees.profile.position')}</th>
                <th>{t('employees.status.title')}</th>
                <th>{t('employees.projects.title')}</th>
                <th>{t('employees.location')}</th>
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
      userType={isAgent ? 'tecnico' : 'admin'}
      userName={userName || 'Usuário SENAI'}
      userEmail=""
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      {/* Header */}
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 py-16 lg:py-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('employees.title')}</h1>
            <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {isAgent 
                ? t('employees.subtitle.agent')
                : t('employees.subtitle.admin')
              }
            </p>
          </div>
          {!isAgent && !isClient && (
            <button
              className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <FaPlus className="text-sm" />
              <span>{t('employees.new')}</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('employees.stats.total')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUsers className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('employees.stats.active')}</p>
                <p className="text-2xl font-bold text-green-500">{stats.ativos}</p>
              </div>
              <FaUserCheck className="text-green-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('employees.stats.projects')}</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalProjects}</p>
              </div>
              <FaBriefcase className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`rounded-xl p-4 sm:p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={t('employees.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              {positions.map(option => (
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
              } focus:ring-2 focus:ring-red-500 focus-border-transparent`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

           
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
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
      </div>

      {/* Users List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-4 sm:p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('employees.title')} ({filteredUsers.length})
            </h2>
            {!isAgent && (
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}>
                  <FaDownload className="text-sm" />
                </button>
                <button onClick={handleExportPDF} className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}>
                  <FaPrint className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img 
                            src={getAvatarUrl(user.avatar) || ''} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              console.error('Erro ao carregar avatar:', user.avatar, 'URL tratada:', getAvatarUrl(user.avatar))
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`${user.avatar ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                          {user.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          {user.id} • {user.position}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)} hidden sm:inline`}>
                            {user.role}
                          </span>
                          
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => {
                    
                          setSelectedUser(user)
                        }}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        <FaEye className="text-sm" />
                      </button>
                                           {!isAgent && !isClient && (
                       <>
                         <button className={`p-2 rounded-lg ${
                           theme === 'dark' 
                             ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         } transition-colors`} onClick={() => {
                           setEditUser(user)
                           setEditOpen(true)
                           setEditDepartment(user.department || '')
                           setEditPosition(user.position || '')
                           setEditName(user.name || '')
                           setEditEmail(user.email || '')
                           setEditAvatarPreview(user.avatar || '')
                           setEditAvatar(null)
                           setSelectedCatId('')
                           setSelectedSubcatId('')
                           setSubcatOptions([])
                           setEditIsActive((user.status || '').toLowerCase() === 'ativo')
                           setEditPassword('')
                           setShowPasswordField(false)
                         }}>
                           <FaEdit className="text-sm" />
                         </button>
                         <button
                           onClick={() => handleToggleStatus(user)}
                           aria-label={`${user.is_active ? 'Desativar' : 'Ativar'} colaborador ${user.name}`}
                           title={user.is_active ? t('employees.toggleStatus.deactivate') : t('employees.toggleStatus.activate')}
                           className={`p-2 rounded-lg transition-colors ${
                             user.is_active
                               ? theme === 'dark'
                                 ? 'bg-orange-600 text-white hover:bg-orange-500'
                                 : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                               : theme === 'dark'
                                 ? 'bg-green-600 text-white hover:bg-green-500'
                                 : 'bg-green-100 text-green-600 hover:bg-green-200'
                           }`}
                         >
                           {user.is_active ? (
                             <FaTimes className="text-sm" />
                           ) : (
                             <FaCheck className="text-sm" />
                           )}
                         </button>
                         <button
                           className={`p-2 rounded-lg ${
                             theme === 'dark'
                               ? 'bg-red-600 text-white hover:bg-red-500'
                               : 'bg-red-100 text-red-600 hover:bg-red-200'
                           } transition-colors`}
                           onClick={() => setDeleteTarget(user)}
                         >
                           <FaTrash className="text-sm" />
                         </button>
                       </>
                     )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaPhone className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                        {user.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                        {user.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                        {user.location}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>{t('employees.projects.completed')}:</strong> {user.projectsCompleted}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>{t('employees.projects.active')}:</strong> {user.activeProjects}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredUsers.map((user, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  } flex flex-col min-h-[240px]`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                         {user.avatar ? (
                           <img 
                             src={getAvatarUrl(user.avatar) || ''} 
                             alt={user.name} 
                             className="w-full h-full object-cover" 
                             onError={(e) => {
                               console.error('Erro ao carregar avatar:', user.avatar, 'URL tratada:', getAvatarUrl(user.avatar))
                               e.currentTarget.style.display = 'none'
                               e.currentTarget.nextElementSibling?.classList.remove('hidden')
                             }}
                           />
                         ) : null}
                         <div className={`${user.avatar ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                           {user.name.split(' ').map((n: string) => n[0]).join('')}
                         </div>
                       </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </h3>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.position} • {user.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>



                  {/* Info */}
                  <div className="grid grid-cols-1 gap-2 text-xs flex-1">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>{user.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBriefcase className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>{user.projectsCompleted} {t('employees.projects.projects')}</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <FaEye className="text-sm" />
                    </button>
                                         {!isAgent && !isClient && (
                       <>
                         <button
                           className={`p-2 rounded-lg ${
                             theme === 'dark'
                               ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           } transition-colors`}
                           onClick={() => {
                             setEditUser(user)
                             setEditOpen(false)
                           }}
                         >
                           <FaEdit className="text-sm" />
                         </button>
                         <button
                           onClick={() => handleToggleStatus(user)}
                           aria-label={`${user.is_active ? 'Desativar' : 'Ativar'} colaborador ${user.name}`}
                           title={user.is_active ? t('employees.toggleStatus.deactivate') : t('employees.toggleStatus.activate')}
                           className={`p-2 rounded-lg transition-colors ${
                             user.is_active
                               ? theme === 'dark'
                                 ? 'bg-orange-600 text-white hover:bg-orange-500'
                                 : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                               : theme === 'dark'
                                 ? 'bg-green-600 text-white hover:bg-green-500'
                                 : 'bg-green-100 text-green-600 hover:bg-green-200'
                           }`}
                         >
                           {user.is_active ? (
                             <FaTimes className="text-sm" />
                           ) : (
                             <FaCheck className="text-sm" />
                           )}
                         </button>
                         <button
                           className={`p-2 rounded-lg ${
                             theme === 'dark'
                               ? 'bg-red-600 text-white hover:bg-red-500'
                               : 'bg-red-100 text-red-600 hover:bg-red-200'
                           } transition-colors`}
                           onClick={() => setDeleteTarget(user)}
                         >
                           <FaTrash className="text-sm" />
                         </button>
                       </>
                     )}
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
                  {t('employees.profile.title')}
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
                      {(() => {
                     
                        return null
                      })()}
                      {selectedUser.avatar ? (
                        <img 
                          src={getAvatarUrl(selectedUser.avatar) || ''} 
                          alt={selectedUser.name} 
                          className="w-24 h-24 rounded-full object-cover mb-4" 
                          onError={(e) => {
                            console.error('Erro ao carregar avatar no modal:', selectedUser.avatar, 'URL tratada:', getAvatarUrl(selectedUser.avatar))
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`${selectedUser.avatar ? 'hidden' : ''} w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-3xl mb-4`}>
                        {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedUser.id}
                      </p>

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

                {/* Read-only details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('employees.profile.departmentAndPosition')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <FaBuilding className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('employees.profile.department')}</p>
                          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.department || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaUserTie className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('employees.profile.position')}</p>
                          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.position || '—'}</p>
                        </div>
                      </div>
                    </div>
                    {/* Atividades recentes (últimos dois chamados) */}
                    <div className="mt-4">
                      <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('employees.profile.recentActivities')}</h4>
                      <div className="space-y-2">
                        {recentTickets.length === 0 && (
                          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{t('employees.profile.noRecentActivities')}</p>
                        )}
                        {recentTickets.map((t: any) => (
                          <div key={t.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.title}</p>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.ticket_number || `#${t.id}`} • {new Date(t.created_at).toLocaleString('pt-BR')}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(t.status)}`}>{t.status}</span>
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
        </div>
      )}

      {/* Edit Employee Modal - estrutura igual técnico */}
      {editOpen && editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-lg w-full ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('employees.profile.edit.title')}</h3>
                <button onClick={() => setEditOpen(false)} className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {editAvatarPreview ? (
                      <img src={editAvatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      editName.split(' ').map((n: string) => n[0]).join('')
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600 transition-colors">
                    <FaEdit className="text-xs" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('employees.profile.clickToChangePhoto')}
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.name')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('employees.profile.namePlaceholder')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.email')}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={t('employees.profile.emailPlaceholder')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Departamento */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.department')}</label>
                <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">{t('employees.filters.selectDepartment')}</option>
                  {departamentosOptions.map((d) => (<option key={d.key} value={d.key}>{d.label}</option>))}
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.position')}</label>
                <select value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">{t('employees.filters.selectPosition')}</option>
                  {cargosOptions.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.newPassword')}</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {showPasswordField ? t('employees.profile.cancelPassword') : t('employees.profile.changePassword')}
                  </button>
                </div>
                {showPasswordField && (
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={t('employees.profile.newPasswordPlaceholder')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                )}
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('employees.profile.active')}</span>
              </label>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setEditOpen(false)} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>{t('employees.profile.cancel')}</button>
              <button onClick={async () => {
                try {
                  const token = authCookies.getToken()
                  
                  // Upload do avatar se foi selecionado
                  let avatarUrl = editUser.avatar
                  if (editAvatar) {
                    const formData = new FormData()
                    formData.append('file', editAvatar)
                    formData.append('isAvatar', 'true')
                    
                    const uploadResp = await fetch('/api/attachments/upload', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` },
                      body: formData
                    })
                    
                    if (!uploadResp.ok) {
                      const t = await uploadResp.text()
                      throw new Error(`${t('employees.errors.uploadFailed')}: ${t}`)
                    }
                    
                    const uploadResult = await uploadResp.json()
                    if (uploadResult.success && uploadResult.data && uploadResult.data.avatarUrl) {
                      avatarUrl = uploadResult.data.avatarUrl
                    } else {
                      throw new Error(t('employees.errors.invalidUploadResponse'))
                    }
                  }
                  
                  // Atualizar dados do usuário
                  const userPayload: any = {
                    name: editName.trim() || undefined,
                    email: editEmail.trim() || undefined,
                    avatar: avatarUrl || undefined,
                  }
                  
                  const userResp = await fetch(`/admin/user/${encodeURIComponent(editUser.userId)}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(userPayload)
                  })
                  
                  if (!userResp.ok) {
                    const t = await userResp.text()
                    throw new Error(`${t('employees.errors.updateUserFailed')}: ${t}`)
                  }
                  
                  // Atualizar dados do colaborador
                  const clientPayload: any = {
                    department: editDepartment || undefined,
                    position: (selectedSubcatId ? subcatOptions.find(s => s.id === selectedSubcatId)?.name : editPosition) || undefined,
                  }
                  
                  const clientResp = await fetch(`/admin/client/${encodeURIComponent(editUser.clientId)}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientPayload)
                  })
                  
                  if (!clientResp.ok) {
                    const t = await clientResp.text()
                    throw new Error(`${t('employees.errors.updateEmployeeFailed')}: ${t}`)
                  }
                  
                  const updatedClient = await clientResp.json()
                  
                  // Alterar senha se necessário
                  if (showPasswordField && editPassword.trim()) {
                    const passwordResp = await fetch(`/admin/user/${encodeURIComponent(editUser.userId)}/password`, {
                      method: 'PUT',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: editPassword })
                    })
                    if (!passwordResp.ok) {
                      const t = await passwordResp.text()
                      throw new Error(`${t('employees.errors.passwordChangeFailed')}: ${t}`)
                    }
                  }
                  
                  // Atualizar estado local
                  setEmployees(prev => prev.map(u => u.clientId === updatedClient.id ? {
                    ...u,
                    name: editName.trim() || u.name,
                    email: editEmail.trim() || u.email,
                    avatar: avatarUrl || u.avatar,
                    department: updatedClient.department || u.department,
                    position: updatedClient.position || u.position
                  } : u))
                  
                  // Se o colaborador estava aberto no olhinho, refletir imediatamente
                  setSelectedUser((prev: any) => prev && prev.clientId === updatedClient.id ? {
                    ...prev,
                    name: editName.trim() || prev.name,
                    email: editEmail.trim() || prev.email,
                    avatar: avatarUrl || prev.avatar,
                    department: updatedClient.department || prev.department,
                    position: updatedClient.position || prev.position
                  } : prev)
                  
                  setEditOpen(false)
                } catch (e) {
                  alert((e as any).message || t('employees.errors.saveFailed'))
                }
              }} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg">{t('employees.profile.save')}</button>
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
        title={t('employees.profile.delete.title')}
        description={t('employees.profile.delete.confirmation').replace('{name}', deleteTarget?.name ?? t('employees.profile.delete.thisEmployee'))}
        confirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          setIsDeleting(true)
          try {
            const token = authCookies.getToken()
            const resp = await fetch(`${API_BASE}/admin/client/${encodeURIComponent(deleteTarget.clientId)}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!resp.ok) {
              const t = await resp.text()
              throw new Error(t || t('employees.errors.deleteFailed'))
            }
            setEmployees(prev => prev.filter(u => u.id !== deleteTarget.id))
            setDeleteTarget(null)
          } catch (e) {
            alert((e as any).message || t('employees.errors.deleteFailed'))
          } finally {
            setIsDeleting(false)
          }
        }}
      />
    </ResponsiveLayout>
  )
}
