'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaUser,
  FaUsers,
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaPrint,
  FaPlus,
  FaTimes,
  FaCheck,
  FaClock,
  FaStar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaTools,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar,
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaEllipsisV,
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
  FaDollarSign,
  FaTicketAlt,
  FaList,
  FaGraduationCap
} from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '../../../hooks/useAuth'
import TechnicianRegisterModal from '../../../components/maintenance/TechnicianRegisterModal'
import { authCookies } from '../../../utils/cookies'

export default function MaintenancePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { user, isLoading: authLoading } = useRequireAuth()
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
  const [editPassword, setEditPassword] = useState<string>('')
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [editEmail, setEditEmail] = useState<string>('')
  const [editAvatar, setEditAvatar] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('')

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

  // Opções para modal de edição
  const [editDeptOptions, setEditDeptOptions] = useState<string[]>([])
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ id: number, name: string }[]>([])
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<number[]>([])
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('')
  // Categoria usada APENAS no filtro (separada da categoria do modal de edição)
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('')
  // Detectar se o usuário é técnico (agent)
  const [isAgent, setIsAgent] = useState(false)
  // Detectar se o usuário é cliente (client)
  const [isClient, setIsClient] = useState(false)

  // Técnicos carregados da API
  const [technicians, setTechnicians] = useState<any[]>([])

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

  // Detectar role do usuário no carregamento da página
  useEffect(() => {
    if (user) {
      const role = (user?.role ?? user?.userRole ?? '').toString().toLowerCase()
      setIsAgent(role === 'agent' || role === 'tecnico')
      setIsClient(role === 'client' || role === 'profissional')
    }
  }, [user])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
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
          // Usar subcategoria primária como especialidade
          const specialty = a.primary_subcategory ? a.primary_subcategory.name : (skills.find((s) => !s.startsWith('CERT:') && !s.startsWith('EXP:') && !s.startsWith('AVAIL:') && !s.startsWith('URGENCY:')) || 'Geral')

          // Log para debug do avatar
          if (a.user?.avatar) {
            console.log('Avatar encontrado para', a.user.name, ':', a.user.avatar)
            console.log('Avatar tratado para', a.user.name, ':', getAvatarUrl(a.user.avatar))
          }

          return {
            agentId: a.id,
            userId: a.user?.id,
            displayId: a.employee_id ?? `AG-${a.id}`,
            name: a.user?.name ?? 'Sem nome',
            email: a.user?.email ?? '-',
            phone: a.user?.phone ?? '-',
            department: a.department ?? 'Geral',
            specialty,
            status: 'Disponível',
            experience: experience === '-' ? '-' : `${experience} anos`,
            rating: a.evaluationStats?.averageRating || 0,
            completedJobs: a._count?.ticket_assignments ?? 0,
            activeJobs: 0,
            location: '-',
            avatar: a.user?.avatar ? (a.user.avatar.startsWith('http') ? a.user.avatar : `${window.location.origin}${a.user.avatar}`) : null,
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
            categories: a.agent_categories?.map((ac: any) => ac.category) || [],
            primarySpecialty: a.primary_subcategory,
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

  // Opções de filtro adicionais (categoria) - todas do backend
  const [allCategoriesFilter, setAllCategoriesFilter] = useState<any[]>([])
  useEffect(() => {
    const loadAllCatsForFilter = async () => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        const res = await fetch('/helpdesk/categories', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        const data = await res.json()
        if (Array.isArray(data)) setAllCategoriesFilter(data)
      } catch {
        setAllCategoriesFilter([])
      }
    }
    loadAllCatsForFilter()
  }, [])
  const categoriesFilter = React.useMemo(() => {
    return (allCategoriesFilter || []).map((c: any) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [allCategoriesFilter])

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

  const normalize = (s: string) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filteredTechnicians = technicians.filter((technician) => {
    const matchesStatus = selectedStatus === 'all' || normalize(technician.status || '').includes(normalize(selectedStatus.replace('-', ' ')))
    const matchesSearch = normalize(technician.name || '').includes(normalize(searchTerm)) || normalize(technician.specialty || '').includes(normalize(searchTerm)) || normalize(String(technician.displayId || '')).includes(normalize(searchTerm))

    const selectedCat = filterCategoryId ? Number(filterCategoryId) : null
    const matchesCategory = !selectedCat || (Array.isArray(technician.categories) && technician.categories.some((c: any) => Number(c?.id) === selectedCat))
    


    return matchesStatus && matchesSearch && matchesCategory
  })

  const stats = {
    total: technicians.length,
    disponiveis: technicians.filter(t => t.status === 'Disponível').length,
    emTrabalho: technicians.filter(t => t.status === 'Em Trabalho').length,
    totalJobs: technicians.reduce((sum, t) => sum + (Number(t.completedJobs) || 0), 0)
  }

  const handleDelete = async (agentId: number) => {
    // Garantir autenticação
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
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
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
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
      // Recarregar lista rapidamente e refletir status/campos
      setTechnicians(prev => prev.map((t: any) => (t.agentId === agentId) ? { ...t, ...updates, status: typeof updates.is_active === 'boolean' ? (updates.is_active ? 'Disponível' : 'Ausente') : t.status } : t))
    } catch (e: any) {
      setActionError(e?.message || 'Erro ao atualizar técnico')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Preparar opções quando abrir o modal de edição
  useEffect(() => {
    if (!editModalOpen || !currentTechnician) return

    // Departamentos a partir dos técnicos carregados
    const uniqueDeps = Array.from(new Set((technicians || []).map((t: any) => (t.department || '').toString().trim()).filter(Boolean)))
    if (currentTechnician.department && !uniqueDeps.includes(currentTechnician.department)) uniqueDeps.push(currentTechnician.department)
    setEditDeptOptions(uniqueDeps.sort((a, b) => a.localeCompare(b, 'pt-BR')))

    // Carregar todas as categorias
    const loadCategories = async () => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        const res = await fetch('/helpdesk/categories', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        const data = await res.json()
        if (Array.isArray(data)) setAllCategories(data)
        // definir categoria padrão como a primeira do técnico
        const defaultCatId = (currentTechnician.categories?.[0]?.id) || ''
        setSelectedCategoryId(defaultCatId)
        if (defaultCatId) await loadSubcategories(defaultCatId)
      } catch {
        setAllCategories([])
        setSubcategoryOptions([])
      }
    }
    const loadSubcategories = async (categoryId: number) => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        const res = await fetch(`/helpdesk/categories/${categoryId}/subcategories`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        const subs = await res.json()
        const opts = (Array.isArray(subs) ? subs : []).map((s: any) => ({ id: s.id, name: s.name }))
        setSubcategoryOptions(opts)
        const skillsArr = (currentTechnician.skills || []) as string[]
        const preSel = opts.filter(o => skillsArr.includes(o.name)).map(o => o.id)
        setSelectedSubcategoryIds(preSel)
      } catch {
        setSubcategoryOptions([])
        setSelectedSubcategoryIds([])
      }
    }
    loadCategories()
    // armazenar a função no state para uso no onChange
    ;(window as any).__loadSubcategoriesForEdit = loadSubcategories
  }, [editModalOpen, currentTechnician, technicians])

  // Abrir modal buscando informações reais do agente
  const openTechnicianDetails = async (tech: any) => {
    // Abre modal com dados atuais enquanto carrega detalhes reais
    setSelectedTechnician({ ...tech, __loading: true })
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      const res = await fetch(`/admin/agent/${encodeURIComponent(tech.agentId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        // Falha silenciosa: mantém dados existentes
        setSelectedTechnician((prev: any) => prev ? { ...prev, __loading: false } : prev)
        return
      }
      const data = await res.json()
      const mapped = {
        agentId: data?.id ?? tech.agentId,
        displayId: data?.employee_id ?? tech.displayId,
        name: data?.user?.name ?? tech.name,
        email: data?.user?.email ?? tech.email,
        phone: data?.user?.phone ?? tech.phone,
        department: data?.department ?? tech.department,
        avatar: getAvatarUrl(data?.user?.avatar) ?? tech.avatar,
        completedJobs: data?._count?.ticket_assignments ?? tech.completedJobs,
        categories: Array.isArray(data?.agent_categories) ? data.agent_categories.map((ac: any) => ac.category) : (tech.categories || []),
        recentWork: Array.isArray(data?.ticket_assignments) ? data.ticket_assignments.map((ta: any) => ({
          id: ta.ticket?.id,
          ticket_number: ta.ticket?.ticket_number,
          title: ta.ticket?.title,
          status: ta.ticket?.status,
          priority: ta.ticket?.priority,
          created_at: ta.ticket?.created_at,
        })) : (tech.recentWork || []),
      }
      setSelectedTechnician((prev: any) => ({ ...(prev || {}), ...mapped, __loading: false }))
    } catch {
      setSelectedTechnician((prev: any) => prev ? { ...prev, __loading: false } : prev)
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 py-16 lg:py-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Técnicos</h1>
            <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie os técnicos da empresa.
            </p>
          </div>

          <div className="flex gap-3">
            {!isAgent && !isClient && (
              <button
                className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => setRegisterModalOpen(true)}
              >
                <FaPlus className="text-sm" />
                <span>Novo Técnico</span>
              </button>
            )}
            {isAgent && (
              <button
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => router.push('/pages/agent/available-tickets')}
              >
                <FaTicketAlt className="text-sm" />
                <span>Ver Tickets Disponíveis</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Técnicos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUser className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Técnicos Disponíveis</p>
                <p className="text-2xl font-bold text-green-500">{stats.disponiveis}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Técnicos em Trabalho</p>
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
      <div className={`rounded-xl p-4 sm:p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Buscar técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Filtro por categoria */}
              <select
                value={String(filterCategoryId || '')}
                onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : '' as any)}
                className={`flex-1 px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                <option value="">Todas as Categorias</option>
                {categoriesFilter.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Filtro por status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg border ${theme === 'dark'
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterCategoryId('');
                  setSelectedStatus('all');
                  setSearchTerm('');
                }}
                className={`px-4 py-3 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
                  } transition-colors`}
              >
                Limpar Filtros
              </button>

              {/* View Mode Toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg ${viewMode === 'list'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}
                >
                  <FaList className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg ${viewMode === 'grid'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}
                >
                  <FaChartBar className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technicians List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {filteredTechnicians.length} técnico(s)
            </h2>
            <div className="flex gap-2">
              <button className={`p-2 rounded-lg ${theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}>
                <FaDownload />
              </button>
              <button className={`p-2 rounded-lg ${theme === 'dark'
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
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 space-y-3 sm:space-y-0">
                    <div
                      className="flex items-center space-x-3 sm:space-x-4 cursor-pointer w-full sm:w-auto"
                      onClick={() => openTechnicianDetails(technician)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openTechnicianDetails(technician)
                      }}
                    >
                      {technician.avatar ? (
                        <img
                          src={technician.avatar}
                          alt={technician.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                          onError={(e) => {
                            // Se a imagem falhar ao carregar, mostrar as iniciais
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl ${technician.avatar ? 'hidden' : ''}`}>
                        {(technician.name || '').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {technician.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {technician.displayId} • {technician.specialty}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(technician.status)}`}>
                            {technician.status}
                          </span>
                          {technician.availability && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'} hidden sm:inline`}>
                              Disponibilidade: {technician.availability}
                            </span>
                          )}
                          {technician.urgency && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'} hidden sm:inline`}>
                              Urgência: {technician.urgency}
                            </span>
                          )}
                          <div className="flex items-center space-x-1">
                            <FaStar className={`text-sm ${getRatingColor(technician.rating)}`} />
                      <span className={`text-sm font-medium ${getRatingColor(technician.rating)}`}>
                        {(Number(technician.rating) || 0).toFixed(1)}
                      </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {actionError && (
                      <div className="mb-2 text-sm text-red-500">{actionError}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openTechnicianDetails(technician)}
                        aria-label={`Visualizar técnico ${technician.name}`}
                        title="Visualizar"
                        className={`p-2 rounded-lg ${theme === 'dark'
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } transition-colors`}
                      >
                        <FaEye className="text-sm" />
                      </button>
                      {!isAgent && !isClient && (
                        <button
                          onClick={() => {
                            setCurrentTechnician(technician)
                            setEditForm({
                              department: technician.department || '',
                              skills: (technician.skills || []).join(', '),
                              max_tickets: 10,
                              is_active: true,
                            })
                            setEditName(technician.name || '')
                            setEditEmail(technician.email || '')
                            setEditAvatarPreview(technician.avatar || '')
                            setEditAvatar(null)
                            setEditPassword('')
                            setShowPasswordField(false)
                            setEditModalOpen(true)
                          }}
                          aria-label={`Editar técnico ${technician.name}`}
                          title="Editar"
                          className={`p-2 rounded-lg ${theme === 'dark'
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } transition-colors`}>
                          <FaEdit className="text-sm" />
                        </button>
                      )}
                      {!isAgent && !isClient && (
                        <button
                          onClick={() => {
                            setCurrentTechnician(technician)
                            setDeleteConfirmText('')
                            setDeleteModalOpen(true)

                          }}
                          aria-label={`Excluir técnico ${technician.name}`}
                          title="Excluir"
                          className={`p-2 rounded-lg ${theme === 'dark'
                              ? 'bg-red-600 text-white hover:bg-red-500'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } transition-colors`}>
                          {actionLoadingId === (typeof technician.id === 'string' && technician.id.startsWith('AG-') ? parseInt(technician.id.replace('AG-', '')) : technician.id) ? '...' : <FaTrash className="text-sm" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {technician.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaPhone className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {technician.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {technician.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {technician.location}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Experiência:</strong> {technician.experience}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Concluídos:</strong> {Number(technician.completedJobs) || 0}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          <strong>Ativos:</strong> {technician.activeJobs}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTechnicians.map((technician, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
                    }`}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      {technician.avatar ? (
                        <img
                          src={technician.avatar}
                          alt={technician.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-lg"
                          onError={(e) => {
                            // Se a imagem falhar ao carregar, mostrar as iniciais
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ${technician.avatar ? 'hidden' : ''}`}>
                        {(technician.name || '').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base sm:text-lg leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {technician.name}
                        </h3>
                        <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {technician.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openTechnicianDetails(technician)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
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
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(technician.status)}`}>
                      {technician.status}
                    </span>
                    <div className="flex items-center space-x-1">
                      <FaStar className={`text-sm ${getRatingColor(technician.rating)}`} />
                  <span className={`text-sm font-bold ${getRatingColor(technician.rating)}`}>
                    {(Number(technician.rating) || 0).toFixed(1)}
                  </span>
                    </div>
                  </div>

                  {/* Informações Principais */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <FaBuilding className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {technician.department}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaTools className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Number(technician.completedJobs) || 0} serviços
                      </span>
                    </div>
                    {technician.experience && technician.experience !== '-' && (
                      <div className="flex items-center space-x-2">
                        <FaGraduationCap className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {technician.experience}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags de Disponibilidade e Urgência */}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                    {technician.availability && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                        {technician.availability}
                      </span>
                    )}
                    {technician.urgency && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-orange-900/30 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                        {technician.urgency}
                      </span>
                    )}
                  </div>

                  {/* Categorias (se houver) */}
                  {technician.categories && technician.categories.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaTools className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Categorias:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {technician.categories.slice(0, 2).map((category: any, catIndex: number) => (
                          <span 
                            key={catIndex} 
                            className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.name}
                          </span>
                        ))}
                        {technician.categories.length > 2 && (
                          <span className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            +{technician.categories.length - 2}
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
          <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Perfil do Técnico
                </h2>
                <button
                  onClick={() => setSelectedTechnician(null)}
                  className={`p-2 rounded-lg ${theme === 'dark'
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
                      {selectedTechnician.avatar ? (
                        <img
                          src={selectedTechnician.avatar}
                          alt={selectedTechnician.name}
                          className="w-24 h-24 rounded-full object-cover mb-4"
                          onError={(e) => {
                            // Se a imagem falhar ao carregar, mostrar as iniciais
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-3xl mb-4 ${selectedTechnician.avatar ? 'hidden' : ''}`}>
                        {(selectedTechnician.name || '').split(' ').map((n: string) => n[0]).join('')}
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
                  {(Number(selectedTechnician.rating) || 0).toFixed(1)}
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

                {/* Skills e trabalhos recentes (métricas removidas) */}
                <div className="lg:col-span-2 space-y-6">

                                     {/* Categories & Specialties */}
                   <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                     <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                       Categorias e Especialidade
                     </h3>
                     <div className="space-y-4">
                       <div>
                         <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Categorias</h4>
                         <div className="flex flex-wrap gap-2">
                           {selectedTechnician.categories?.map((category: any, index: number) => (
                             <span 
                               key={index} 
                               className={`px-3 py-1 rounded-full text-xs font-medium border`}
                               style={{
                                 backgroundColor: theme === 'dark' ? `${category.color}20` : `${category.color}10`,
                                 borderColor: category.color,
                                 color: theme === 'dark' ? category.color : category.color
                               }}
                             >
                               {category.name}
                             </span>
                           ))}
                           {(!selectedTechnician.categories || selectedTechnician.categories.length === 0) && (
                             <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                               Nenhuma categoria definida
                             </span>
                           )}
                         </div>
                       </div>
                       <div>
                         <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Especialidade</h4>
                         <div className="space-y-2">
                           <div className="flex items-center space-x-2">
                             <FaStar className="text-yellow-500 text-sm" />
                             <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                               {selectedTechnician.primarySpecialty?.name || selectedTechnician.specialty || 'Geral'}
                             </span>
                           </div>
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
                        <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
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
                    Clique no ícone para alterar a foto
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Digite o nome completo"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Digite o email"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                
                <div>
                  <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Categoria</label>
                  <select value={selectedCategoryId} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : ''; setSelectedCategoryId(id as any); if (id) { (window as any).__loadSubcategoriesForEdit?.(id) } else { setSubcategoryOptions([]); setSelectedSubcategoryIds([]) } }} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <option value="">Selecione...</option>
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Especialidade</label>
                  <div className={`rounded-lg border p-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <div className="max-h-48 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subcategoryOptions.map((s) => (
                        <label key={s.id} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          <input
                            type="checkbox"
                            checked={selectedSubcategoryIds.includes(s.id)}
                            onChange={(e) => {
                              setSelectedSubcategoryIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))
                            }}
                          />
                          <span>{s.name}</span>
                        </label>
                      ))}
                      {subcategoryOptions.length === 0 && (
                        <div className={`col-span-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Nenhuma subcategoria disponível</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nova Senha</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {showPasswordField ? 'Cancelar' : 'Alterar Senha'}
                  </button>
                </div>
                {showPasswordField && (
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                )}
              </div>
              <div className="flex items-end justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Ativo</span>
                </label>
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setEditModalOpen(false)} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>Cancelar</button>
              <button onClick={async () => {
                try {
                  const token = authCookies.getToken()
                  
                  // Upload do avatar se foi selecionado
                  let avatarUrl = currentTechnician.avatar
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
                      throw new Error(`Falha ao fazer upload da imagem: ${t}`)
                    }
                    
                    const uploadResult = await uploadResp.json()
                    if (uploadResult.success && uploadResult.data && uploadResult.data.avatarUrl) {
                      avatarUrl = uploadResult.data.avatarUrl
                    } else {
                      throw new Error('Resposta inválida do servidor de upload')
                    }
                  }
                  
                  // Atualizar dados do usuário
                  const userPayload: any = {
                    name: editName.trim() || undefined,
                    email: editEmail.trim() || undefined,
                    avatar: avatarUrl || undefined,
                  }
                  
                  const userResp = await fetch(`/admin/user/${encodeURIComponent(currentTechnician.userId)}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(userPayload)
                  })
                  
                  if (!userResp.ok) {
                    const t = await userResp.text()
                    throw new Error(`Falha ao atualizar dados do usuário: ${t}`)
                  }
                  
                  // Atualizar dados do técnico
                  const selectedNames = subcategoryOptions.filter(s => selectedSubcategoryIds.includes(s.id)).map(s => s.name)
                  const agentUpdates: any = {
                    department: editForm.department || undefined,
                    skills: selectedNames, // salva como array de nomes de subcategoria
                    is_active: editForm.is_active,
                  }
                  
                  await handleEdit(currentTechnician.agentId, agentUpdates)
                  
                  // Alterar senha se necessário
                  if (showPasswordField && editPassword.trim()) {
                    const passwordResp = await fetch(`/admin/user/${encodeURIComponent(currentTechnician.userId)}/password`, {
                      method: 'PUT',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: editPassword })
                    })
                    if (!passwordResp.ok) {
                      const t = await passwordResp.text()
                      throw new Error(`Falha ao alterar senha: ${t}`)
                    }
                  }
                  
                  // Atualizar estado local
                  setTechnicians(prev => prev.map(t => t.agentId === currentTechnician.agentId ? {
                    ...t,
                    name: editName.trim() || t.name,
                    email: editEmail.trim() || t.email,
                    avatar: avatarUrl || t.avatar,
                    department: editForm.department || t.department,
                    skills: selectedNames,
                    is_active: editForm.is_active
                  } : t))
                  
                  setEditModalOpen(false)
                } catch (e) {
                  alert((e as any).message || 'Erro ao salvar técnico')
                }
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
