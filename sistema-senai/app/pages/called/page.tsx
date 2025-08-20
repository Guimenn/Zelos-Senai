'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import { useRouter } from 'next/navigation'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useI18n } from '../../../contexts/I18nContext'
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
  FaChartBar,
  FaTimes
} from 'react-icons/fa'
import Link from 'next/link'
import { useRequireAuth } from '../../../hooks/useAuth'
import { authCookies } from '../../../utils/cookies'


export default function ChamadosPage() {
  const API_BASE = ''
  const { theme } = useTheme()
  const { t } = useI18n()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [deleteModal, setDeleteModal] = useState({ open: false, ticketId: null as null | number, displayId: '', title: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, loading: false, ticket: null as any })
  const [imagePreview, setImagePreview] = useState<{ open: boolean; src: string; name: string }>(() => ({ open: false, src: '', name: '' }))
  const [editModal, setEditModal] = useState({
    open: false,
    ticketId: null as null | number,
    title: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    category_id: 0 as number,
    subcategory_id: undefined as number | undefined,
    assigned_to: undefined as number | undefined,
    client_id: undefined as number | undefined,
    deadline: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [isAgent, setIsAgent] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  
  // Estados para funcionalidades de técnico
  const [acceptModal, setAcceptModal] = useState({ open: false, ticketId: null as null | number, ticket: null as any })
  const [rejectModal, setRejectModal] = useState({ open: false, ticketId: null as null | number, ticket: null as any })
  const [updateModal, setUpdateModal] = useState({ 
    open: false, 
    ticketId: null as null | number, 
    ticket: null as any,
    status: '',
    dueDate: '',
    report: ''
  })
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [closeConfirm, setCloseConfirm] = useState({ open: false, ticketId: null as null | number, statusToSet: '' as '' | 'Resolved' | 'Closed' })
  const [pinnedTicketId, setPinnedTicketId] = useState<number | null>(null)
  const [rejectedIds, setRejectedIds] = useState<number[]>([])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Funções para técnico aceitar/recusar/atualizar tickets
  const handleAcceptTicket = async (ticketId: number) => {
    try {
      setIsAccepting(true)
      const token = authCookies.getToken()
      if (!token) throw new Error('Token não encontrado')

      // Verificação no cliente: no máximo 3 tickets ativos
      const activeStatuses = ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
      const currentAssignedCount = tickets.filter(t => t.assigned_to === currentUserId && activeStatuses.includes(t.status)).length
      if (currentAssignedCount >= 3) {
        const { toast } = await import('react-toastify')
        toast.error('Limite de 3 tickets ativos atingido. Conclua ou libere um ticket antes de aceitar outro.')
        return
      }

      // Aceitar diretamente via endpoint do agente
      const response = await fetch(`http://localhost:3001/helpdesk/agents/ticket/${ticketId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const { toast } = await import('react-toastify')
        toast.error(errorData.message || 'Erro ao aceitar ticket')
        return
      }

      const { toast } = await import('react-toastify')
      toast.success('Ticket aceito com sucesso!')
      setAcceptModal({ open: false, ticketId: null, ticket: null })
      
      // Atualizar lista: remover da seção de disponíveis e fixar como atribuído no topo
      const accepted = await response.json()
      const acceptedTicket = (accepted.ticket || {})
      setPinnedTicketId(acceptedTicket.id ?? ticketId)
      setTickets(prev => {
        const without = prev.filter(t => t.id !== ticketId)
        return [acceptedTicket, ...without]
      })
    } catch (error: any) {
      const { toast } = await import('react-toastify')
      toast.error(error.message || 'Erro ao aceitar ticket')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectTicket = async (ticketId: number) => {
    try {
      setIsRejecting(true)
      // Recusar localmente: remove da lista de disponíveis para este técnico
      setTickets(prev => prev.filter(t => t.id !== ticketId))

      // Persistir rejeição local por agente (para não reaparecer nesta página)
      setRejectedIds(prev => {
        const updated = Array.from(new Set([...prev, ticketId]))
        try {
          localStorage.setItem('rejected_ticket_ids', JSON.stringify(updated))
        } catch {}
        return updated
      })

      const { toast } = await import('react-toastify')
      toast.success('Ticket recusado com sucesso!')
      setRejectModal({ open: false, ticketId: null, ticket: null })
    } catch (error: any) {
      const { toast } = await import('react-toastify')
      toast.error(error.message || 'Erro ao recusar ticket')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleUpdateTicket = async (ticketId: number, data: any) => {
    try {
      setIsUpdating(true)
      const token = authCookies.getToken()
      if (!token) throw new Error('Token não encontrado')

      const response = await fetch(`http://localhost:3001/helpdesk/agents/tickets/${ticketId}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao atualizar ticket')
      }

      const payload = await response.json().catch(() => ({}))
      const updatedTicket = payload.ticket || payload

      const { toast } = await import('react-toastify')
      toast.success('Ticket atualizado com sucesso!')
      setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '' })
      setCloseConfirm({ open: false, ticketId: null, statusToSet: '' })

      // Atualiza lista localmente
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
    } catch (error: any) {
      const { toast } = await import('react-toastify')
      toast.error(error.message || 'Erro ao atualizar ticket')
    } finally {
      setIsUpdating(false)
    }
  }

  // Função para carregar detalhes do ticket
  const loadTicketDetails = async (ticketId: number) => {
    try {
      const token = authCookies.getToken()
      if (!token) return
      const res = await fetch(`http://localhost:3001/helpdesk/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Falha ao carregar detalhes do chamado')
      }
      const detailed = await res.json()
      setViewModal({ open: true, loading: false, ticket: detailed })
    } catch (e: any) {
      setViewModal({ open: false, loading: false, ticket: null })
      const { toast } = await import('react-toastify')
      toast.error(e?.message ?? 'Erro ao carregar detalhes do chamado')
    }
  }

  // Mapeamento de status/priority do backend -> PT
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

  const { user, isLoading: authLoading } = useRequireAuth()

  // Carregar tickets da API
  useEffect(() => {
    const fetchTickets = async () => {
      if (authLoading || !user) return
      
      setIsLoading(true)
      setError(null)
      try {
        const token = authCookies.getToken()
        if (!token) {
          const { toast } = await import('react-toastify')
          toast.error('Faça login para ver os chamados')
          return
        }

        // Usar dados do usuário do hook
        setUserRole((user.role ?? user.userRole ?? '').toString())
        
        // Verificar se é agent/tecnico
        const role = (user.role ?? user.userRole ?? '').toString().toLowerCase()
        const isAgentRole = role === 'agent' || role === 'tecnico'
        setIsAgent(isAgentRole)
        setCurrentUserId(user.userId)
        
        // Debug logs
        console.log('🔍 Debug - User role:', role)
        console.log('🔍 Debug - Is agent role:', isAgentRole)
        console.log('🔍 Debug - User object:', user)

        // Para agentes, buscar tanto tickets disponíveis quanto atribuídos
        if (isAgentRole) {
          console.log('🔧 Carregando tickets (atribuidos + disponíveis) para agente...')
          
          const [assignedResponse, availableResponse] = await Promise.all([
            fetch(`http://localhost:3001/helpdesk/agents/my-tickets`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`http://localhost:3001/helpdesk/agents/available-tickets`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
          ])

          const assignedData = assignedResponse.ok ? await assignedResponse.json() : { tickets: [] }
          const availableData = availableResponse.ok ? await availableResponse.json() : { tickets: [] }

          let assignedTickets = Array.isArray(assignedData) ? assignedData : (assignedData.tickets ?? [])
          const availableTicketsRaw = Array.isArray(availableData) ? availableData : (availableData.tickets ?? [])
          const availableTickets = (availableTicketsRaw || []).map((t: any) => ({ ...t, isAvailable: true }))

          // Fallback para atribuídos
          if (!assignedTickets || assignedTickets.length === 0) {
            try {
              const fallbackRes = await fetch(`http://localhost:3001/helpdesk/tickets?assigned_to=${user.userId}&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (fallbackRes.ok) {
                const fbData = await fallbackRes.json()
                assignedTickets = Array.isArray(fbData) ? fbData : (fbData.tickets ?? [])
              }
            } catch {}
          }

          const allTickets = [...availableTickets, ...assignedTickets]
          console.log('🔧 Carregados:', { available: availableTickets.length, assigned: assignedTickets.length, total: allTickets.length })
          setTickets(allTickets)
        } else {
          // Para outros perfis, usar rota geral
          const response = await fetch(`http://localhost:3001/helpdesk/tickets?page=1&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.message || 'Falha ao carregar chamados')
          }
          
          const data = await response.json()
          const items = Array.isArray(data) ? data : (data.tickets ?? [])
          setTickets(items)
        }
      } catch (e: any) {
        console.error('Erro ao carregar tickets:', e)
        setError(e?.message ?? 'Erro ao carregar chamados')
        const { toast } = await import('react-toastify')
        toast.error(e?.message ?? 'Erro ao carregar chamados')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      fetchTickets()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [authLoading, user])

  // Carregar rejeições persistidas do técnico ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rejected_ticket_ids')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setRejectedIds(parsed)
      }
    } catch {}
  }, [])

  // Dados simulados para demonstração
  const chamados = useMemo(() => {
    // Ocultar tickets rejeitados pelo técnico enquanto estiverem disponíveis (não atribuídos)
    const base = tickets.filter(t => !(isAgent && !t.assigned_to && rejectedIds.includes(t.id)))

    const mappedTickets = base.map((t) => ({
      id: t.ticket_number ?? `#${t.id}`,
      title: t.title,
      description: t.description,
      status: mapStatusToPt(t.status),
      priority: mapPriorityToPt(t.priority),
      category: t.category?.name ?? '-',
      location: t.client?.user?.department ?? '-',
      technician: t.assignee?.name ?? '-',
      requester: t.client?.user?.name ?? t.creator?.name ?? '-',
      category_id: t.category_id,
      subcategory_id: t.subcategory_id,
      assigned_to: t.assigned_to,
      client_id: t.client_id,
      createdAt: new Date(t.created_at).toLocaleString('pt-BR'),
      updatedAt: new Date(t.modified_at ?? t.created_at).toLocaleString('pt-BR'),
      estimatedTime: '-',
      actualTime: '-',
      tags: [t.category?.name].filter(Boolean),
      isAssigned: !!t.assigned_to, // Flag para identificar tickets atribuídos
      isAvailable: !!(t as any).isAvailable || (!t.assigned_to && (t.status === 'Open')), // Ticket disponível para aceitar
      assignmentRequestId: t.assignmentRequestId, // ID da solicitação de atribuição
      originalTicket: t // Manter referência ao ticket original
    }))

    // Ordenar: ticket recém aceito fica fixo no topo; depois aceitos; depois por data
    return mappedTickets.sort((a, b) => {
      if (pinnedTicketId) {
        const aPinned = a.originalTicket.id === pinnedTicketId
        const bPinned = b.originalTicket.id === pinnedTicketId
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
      }
      if (a.isAssigned && !b.isAssigned) return -1
      if (!a.isAssigned && b.isAssigned) return 1
      return new Date(b.originalTicket.created_at).getTime() - new Date(a.originalTicket.created_at).getTime()
    })
  }, [tickets, isAgent, rejectedIds, pinnedTicketId])

  const assignedCount = useMemo(() => {
    const activeStatuses = ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
    return tickets.filter(t => t.assigned_to === currentUserId && activeStatuses.includes(t.status)).length
  }, [tickets, currentUserId])

  const statusOptions = [
    { value: 'all', label: 'Todos', color: 'gray' },
    { value: 'pendente', label: 'Pendente', color: 'red' },
    { value: 'em-andamento', label: 'Em Andamento', color: 'yellow' }
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

  // Apenas chamados em aberto (Pendente/Em Andamento)
  const openChamados = useMemo(() => {
    return chamados.filter(c => c.status === 'Pendente' || c.status === 'Em Andamento')
      .sort((a, b) => {
        // Tickets atribuídos (aceitos) aparecem primeiro
        if (a.isAssigned && !b.isAssigned) return -1;
        if (!a.isAssigned && b.isAssigned) return 1;
        // Depois ordenar por data de criação (mais recentes primeiro)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [chamados])

  // Para agentes, usar todos os chamados retornados pela API (já filtrados no backend)
  // Para admins, filtrar apenas chamados em aberto
  const filteredTicketsForAgent = useMemo(() => {
    if (!isAgent) return openChamados
    // Para agente, exibir apenas pendentes/em andamento (ativos) e disponíveis
    return openChamados
  }, [isAgent, chamados, openChamados])

  const filteredChamados = (isAgent ? filteredTicketsForAgent : openChamados).filter(chamado => {
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
    total: (isAgent ? filteredTicketsForAgent : openChamados).length,
    pendentes: (isAgent ? filteredTicketsForAgent : openChamados).filter(c => c.status === 'Pendente').length,
    emAndamento: (isAgent ? filteredTicketsForAgent : openChamados).filter(c => c.status === 'Em Andamento').length,
    concluidos: 0
  }

  // Helper para obter o ticket e o ID numérico a partir do ID exibido
  const getTicketAndIdByDisplay = (displayId: string): { ticket: any | undefined; id: number | null } => {
    const ticket = tickets.find(t => (t.ticket_number ?? `#${t.id}`) === displayId)
    if (ticket) return { ticket, id: ticket.id }
    const numeric = Number.isNaN(Number(displayId)) ? NaN : Number(displayId)
    const parsedFallback = parseInt((displayId || '').replace('#', ''))
    const id = Number.isFinite(numeric) ? numeric : (Number.isFinite(parsedFallback) ? parsedFallback : null)
    return { ticket: id ? tickets.find(t => t.id === id) : undefined, id }
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-2">{isAgent ? t('called.title.agent') : t('called.title.admin')}</h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAgent ? t('called.subtitle.agent') : t('called.subtitle.admin')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link href="/pages/called/history" className="order-2 sm:order-1">
              <button
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
                  theme === 'dark' 
                    ? 'bg-blue-700 text-white hover:bg-blue-600' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <FaEye className="w-4 h-4" />
                <span>{t('called.viewHistory')}</span>
              </button>
            </Link>
            
            {!isAgent && (
              <Link href="/pages/called/new" className="order-1 sm:order-2">
                <button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                  <FaPlus />
                  <span>{t('called.newTicket')}</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('called.stats.total')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaClipboardList className="text-blue-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('called.stats.pending')}</p>
                <p className="text-2xl font-bold text-red-500">{stats.pendentes}</p>
              </div>
              <FaExclamationTriangle className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('called.stats.inProgress')}</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.emAndamento}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
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
              placeholder={t('called.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
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
                className={`px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                {priorityOptions.map(option => (
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
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSearchTerm('');
                }}
                className={`px-4 py-3 rounded-lg border flex-1 sm:flex-none whitespace-nowrap ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                } transition-colors`}
              >
                {t('called.clear')}
              </button>
              
              {/* View Mode Toggle */}
              <div className={`flex gap-1 border rounded-lg p-1 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FaClipboardList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FaChartBar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>          

      {/* Chamados List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('called.list.title')} ({filteredChamados.length})
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
            <div className="space-y-3">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`font-bold text-base sm:text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {chamado.id}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(chamado.status)}`}>
                            {chamado.status}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPriorityColor(chamado.priority)}`}>
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
                        
                        <h3 className={`text-base sm:text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {chamado.title}
                        </h3>
                        
                        <p className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {chamado.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <FaUser className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.requester')}</strong> {chamado.requester}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaTools className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.technician')}</strong> {chamado.technician}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.location')}</strong> {chamado.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaClock className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.time')}</strong> {chamado.estimatedTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                              {t('called.labels.createdAt')} {chamado.createdAt}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                              {t('called.labels.updatedAt')} {chamado.updatedAt}
                            </span>
                          </div>
                        
                          <div className="flex flex-wrap items-center gap-2">
                            {(() => {
                              console.log('🔍 Debug - Renderizando botões para chamado:', { 
                                chamadoId: chamado.id, 
                                isAgent, 
                                isAssigned: chamado.isAssigned,
                                userRole 
                              })
                              return null
                            })()}

                            <button
                              onClick={async () => {
                                const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                if (!ticket) return
                                setViewModal({ open: true, loading: true, ticket: null })
                                try {
                                  const token = authCookies.getToken()
                                  if (!token) throw new Error('Sessão expirada')
                                  const res = await fetch(`http://localhost:3001/helpdesk/tickets/${ticket.id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  if (!res.ok) {
                                    const data = await res.json().catch(() => ({}))
                                    throw new Error(data.message || 'Falha ao carregar chamado')
                                  }
                                  const detailed = await res.json()
                                  setViewModal({ open: true, loading: false, ticket: detailed })
                                } catch (e) {
                                  setViewModal({ open: false, loading: false, ticket: null })
                                  const { toast } = await import('react-toastify')
                                  toast.error('Erro ao carregar detalhes do chamado')
                                }
                              }}
                              className={`p-2 rounded-lg ${
                                theme === 'dark' 
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } transition-colors`}
                              title="Visualizar"
                            >
                              <FaEye className="text-sm" />
                            </button>

                            {/* Botões específicos para técnicos - tickets disponíveis */}
                            {isAgent && !chamado.isAssigned && chamado.isAvailable && (
                              <>
                                <button
                                  onClick={() => {
                                    const { ticket, id } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      setAcceptModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-green-600 text-white hover:bg-green-500' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                                  } transition-colors`}
                                  title="Aceitar"
                                >
                                  <FaCheckCircle className="text-sm" />
                                </button>
                                <button
                                  onClick={() => {
                                    const { ticket, id } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      setRejectModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-red-600 text-white hover:bg-red-500' 
                                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  } transition-colors`}
                                  title="Recusar"
                                >
                                  <FaTimes className="text-sm" />
                                </button>
                              </>
                            )}

                            {isAgent && chamado.isAssigned && (
                              <button
                                onClick={() => {
                                  const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                  if (ticket) {
                                    setUpdateModal({ 
                                      open: true, 
                                      ticketId: ticket.id, 
                                      ticket: ticket,
                                      status: ticket.status || 'Open',
                                      dueDate: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
                                      report: ''
                                    })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`p-2 rounded-lg ${
                                  theme === 'dark' 
                                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                } transition-colors`}
                                title="Atualizar"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                            )}

                            {/* Botões apenas para Admin */}
                            {(userRole?.toLowerCase() === 'admin') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (!ticket) return
                                    setEditModal({
                                      open: true,
                                      ticketId: ticket.id,
                                      title: ticket.title ?? '',
                                      description: ticket.description ?? '',
                                      status: ticket.status ?? 'Open',
                                      priority: ticket.priority ?? 'Medium',
                                      category_id: ticket.category_id,
                                      subcategory_id: ticket.subcategory_id ?? undefined,
                                      assigned_to: ticket.assigned_to ?? undefined,
                                      client_id: ticket.client_id ?? undefined,
                                      deadline: ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,16) : ''
                                    })
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  } transition-colors`}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => {
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (!ticket) return
                                    setDeleteModal({ open: true, ticketId: ticket.id, displayId: chamado.id, title: chamado.title })
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-red-600 text-white hover:bg-red-500' 
                                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  } transition-colors`}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {chamado.id}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        <FaEllipsisV className="text-sm" />
                      </button>
                      
                      {openDropdown === index && (
                                                 <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-10 ${
                           theme === 'dark' 
                             ? 'bg-gray-700 border-gray-600' 
                             : 'bg-white border-gray-200'
                         }`}>
                           <div className="py-1">
                            <button
                              onClick={() => {
                                const { ticket, id } = getTicketAndIdByDisplay(chamado.id)
                                const numericId = ticket?.id ?? id
                                if (numericId) {
                                  setViewModal({ open: true, loading: true, ticket: null })
                                  loadTicketDetails(numericId)
                                }
                                setOpenDropdown(null)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                theme === 'dark' 
                                  ? 'text-gray-300 hover:bg-gray-600' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              } transition-colors`}
                            >
                              <FaEye className="w-4 h-4" />
                              <span>Visualizar</span>
                            </button>
                            
                            {userRole === 'Admin' && (
                              <button
                                onClick={() => {
                                  const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                  if (ticket) {
                                    setEditModal({
                                      open: true,
                                      ticketId: ticket.id,
                                      title: ticket.title,
                                      description: ticket.description,
                                      status: ticket.status,
                                      priority: ticket.priority,
                                      category_id: ticket.category_id || 0,
                                      subcategory_id: ticket.subcategory_id,
                                      assigned_to: ticket.assigned_to,
                                      client_id: ticket.client_id,
                                      deadline: ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,16) : ''
                                    })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-600' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaEdit className="w-4 h-4" />
                                <span>Editar</span>
                              </button>
                            )}

                            {/* Botões específicos para técnicos */}
                            {isAgent && !chamado.isAssigned && chamado.isAvailable && (
                              <>
                                <button
                                  onClick={() => {
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      setAcceptModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                    theme === 'dark' 
                                      ? 'text-green-400 hover:bg-gray-600' 
                                      : 'text-green-600 hover:bg-gray-100'
                                  } transition-colors`}
                                >
                                  <FaCheckCircle className="w-4 h-4" />
                                  <span>Aceitar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      setRejectModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                    theme === 'dark' 
                                      ? 'text-red-400 hover:bg-gray-600' 
                                      : 'text-red-600 hover:bg-gray-100'
                                  } transition-colors`}
                                >
                                  <FaTimes className="w-4 h-4" />
                                  <span>Recusar</span>
                                </button>
                              </>
                            )}

                            {isAgent && chamado.isAssigned && (
                              <button
                                onClick={() => {
                                  const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                  if (ticket) {
                                    setUpdateModal({ 
                                      open: true, 
                                      ticketId: ticket.id, 
                                      ticket: ticket,
                                      status: ticket.status || 'Open',
                                      dueDate: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
                                      report: ''
                                    })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-blue-400 hover:bg-gray-600' 
                                    : 'text-blue-600 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaEdit className="w-4 h-4" />
                                <span>Atualizar</span>
                              </button>
                            )}

                            {/* Botão de excluir apenas para Admin */}
                            {(userRole?.toLowerCase() === 'admin') && (
                              <button
                                onClick={() => {
                                  const { ticket, id } = getTicketAndIdByDisplay(chamado.id)
                                  const numericId = ticket?.id ?? id
                                  if (numericId) {
                                    setDeleteModal({ open: true, ticketId: numericId, displayId: chamado.id, title: chamado.title })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-red-400 hover:bg-gray-600' 
                                    : 'text-red-600 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaTrash className="w-4 h-4" />
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {chamado.title}
                    </h3>
                    {chamado.isAssigned && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                        ✓ Aceito
                      </span>
                    )}
                  </div>

                  <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {chamado.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(chamado.status)}`}>
                      {chamado.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(chamado.priority)}`}>
                      {chamado.priority}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <FaUser className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chamado.technician}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chamado.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaClock className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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

      {/* Modal de confirmação de exclusão */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isDeleting && setDeleteModal({ open: false, ticketId: null, displayId: '', title: '' })} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('called.modal.confirmDelete')}</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-2`}>
                  {t('called.modal.areYouSure')} <span className="font-semibold">{deleteModal.displayId}</span>?
                </p>
                {deleteModal.title && (
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>{deleteModal.title}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteModal({ open: false, ticketId: null, displayId: '', title: '' })}
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}
                >
                  {t('called.modal.cancel')}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!deleteModal.ticketId) return
                    try {
                      setIsDeleting(true)
                      const token = authCookies.getToken()
                      if (!token) throw new Error('Sessão expirada')
                      const res = await fetch(`/helpdesk/tickets/${deleteModal.ticketId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.message || 'Falha ao excluir chamado')
                      }
                      setTickets(prev => prev.filter(t => t.id !== deleteModal.ticketId))
                      setDeleteModal({ open: false, ticketId: null, displayId: '', title: '' })
                      const { toast } = await import('react-toastify')
                      toast.success('Chamado excluído com sucesso')
                    } catch (e: any) {
                      const { toast } = await import('react-toastify')
                      toast.error(e?.message ?? 'Erro ao excluir chamado')
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${theme === 'dark' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-red-600 text-white hover:bg-red-500'}`}
                >
                  {isDeleting ? t('called.modal.deleting') : t('called.modal.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização */}
      {viewModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModal({ open: false, loading: false, ticket: null })} />
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              {viewModal.loading ? (
                <div className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('common.loading')}</div>
              ) : viewModal.ticket ? (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{viewModal.ticket.title}</h3>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('called.labels.number')} {viewModal.ticket.ticket_number ?? `#${viewModal.ticket.id}`}</div>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{viewModal.ticket.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(mapStatusToPt(viewModal.ticket.status))}`}>
                        {mapStatusToPt(viewModal.ticket.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(mapPriorityToPt(viewModal.ticket.priority))}`}>
                        {mapPriorityToPt(viewModal.ticket.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{t('called.labels.requester')}</strong> {viewModal.ticket.client?.user?.name ?? viewModal.ticket.creator?.name ?? '-'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{t('called.labels.technician')}</strong> {viewModal.ticket.assignee?.name ?? '-'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>Categoria:</strong> {viewModal.ticket.category?.name ?? '-'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>Subcategoria:</strong> {viewModal.ticket.subcategory?.name ?? '-'}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{t('called.labels.createdAt')}</strong> {new Date(viewModal.ticket.created_at).toLocaleString('pt-BR')}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong>{t('called.labels.updatedAt')}</strong> {new Date(viewModal.ticket.modified_at ?? viewModal.ticket.created_at).toLocaleString('pt-BR')}
                    </div>
                    {viewModal.ticket.due_date && (
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>{t('called.labels.deadline')}</strong> {new Date(viewModal.ticket.due_date).toLocaleString('pt-BR')}
                      </div>
                    )}
                    {typeof viewModal.ticket.resolution_time === 'number' && (
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>{t('called.labels.resolutionTime')}</strong> {viewModal.ticket.resolution_time} min
                      </div>
                    )}
                    {typeof viewModal.ticket.satisfaction_rating === 'number' && (
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>{t('called.labels.customerSatisfaction')}</strong> {viewModal.ticket.satisfaction_rating}/5
                      </div>
                    )}
                  </div>
                  {/* Anexos do ticket */}
                  {Array.isArray(viewModal.ticket.attachments) && viewModal.ticket.attachments.length > 0 && (
                    <div className="mt-6">
                      <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('called.attachments')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {viewModal.ticket.attachments.map((att: any) => {
                          const isImage = (att.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.original_name || '')
                          const viewUrl = `${API_BASE}/api/attachments/view/${att.id}`
                          const downloadUrl = `${API_BASE}/api/attachments/download/${att.id}`
                          return (
                            <div key={att.id} className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-2`}> 
                              {isImage ? (
                                <button onClick={() => setImagePreview({ open: true, src: viewUrl, name: att.original_name || att.filename })} className="block w-full">
                                  <img src={viewUrl} alt={att.original_name || att.filename} className="w-full h-32 object-cover rounded" />
                                </button>
                              ) : (
                                <div className={`h-32 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>
                                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{t('common.file')}</span>
                                </div>
                              )}
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className={`truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} title={att.original_name || att.filename}>
                                  {att.original_name || att.filename}
                                </span>
                                <a href={downloadUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{t('common.download')}</a>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {viewModal.ticket.comments?.length > 0 && (
                    <div className="mt-6">
                      <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('called.comments')}</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {viewModal.ticket.comments.map((c: any) => (
                          <div key={c.id} className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-xs opacity-70">{new Date(c.created_at).toLocaleString('pt-BR')}</div>
                            <div className="text-sm">{c.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewModal.ticket.ticket_history?.length > 0 && (
                    <div className="mt-6">
                      <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('called.history')}</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-sm">
                        {viewModal.ticket.ticket_history.map((h: any) => (
                          <div key={h.id} className={`rounded-lg p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                <strong>{h.field_name}:</strong> {h.old_value ?? '—'} → {h.new_value ?? '—'}
                              </span>
                              <span className="opacity-70">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-6">
                    <button onClick={() => setViewModal({ open: false, loading: false, ticket: null })} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors`}>
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox simples para imagens de anexos */}
      {imagePreview.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setImagePreview({ open: false, src: '', name: '' })} />
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <img src={imagePreview.src} alt={imagePreview.name} className="w-full h-auto max-h-[90vh] object-contain rounded" />
            <div className="absolute top-2 right-2">
              <button onClick={() => setImagePreview({ open: false, src: '', name: '' })} className="px-3 py-1 bg-white/90 text-gray-800 rounded shadow">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição (Admin) */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isSaving && setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, client_id: undefined, deadline: '' })} />
          <div className={`relative w-full max-w-xl rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Editar chamado</h3>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Título</label>
                  <input value={editModal.title} onChange={(e) => setEditModal(prev => ({ ...prev, title: e.target.value }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Descrição</label>
                  <textarea value={editModal.description} onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))} rows={4} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                    <select value={editModal.status} onChange={(e) => setEditModal(prev => ({ ...prev, status: e.target.value as any }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value="Open">Pendente</option>
                      <option value="InProgress">Em Andamento</option>
                      <option value="Resolved">Resolvido</option>
                      <option value="Closed">Concluído</option>
                      <option value="Cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Prioridade</label>
                    <select value={editModal.priority} onChange={(e) => setEditModal(prev => ({ ...prev, priority: e.target.value as any }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value="Low">Baixa</option>
                      <option value="Medium">Média</option>
                      <option value="High">Alta</option>
                      <option value="Critical">Crítica</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Categoria (ID)</label>
                    <input type="number" value={editModal.category_id} onChange={(e) => setEditModal(prev => ({ ...prev, category_id: Number(e.target.value) }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subcategoria (ID)</label>
                    <input type="number" value={editModal.subcategory_id ?? ''} onChange={(e) => setEditModal(prev => ({ ...prev, subcategory_id: e.target.value ? Number(e.target.value) : undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Atribuído a (User ID)</label>
                    <input type="number" value={editModal.assigned_to ?? ''} onChange={(e) => setEditModal(prev => ({ ...prev, assigned_to: e.target.value ? Number(e.target.value) : undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cliente (Client ID)</label>
                    <input type="number" value={editModal.client_id ?? ''} onChange={(e) => setEditModal(prev => ({ ...prev, client_id: e.target.value ? Number(e.target.value) : undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Prazo (due date)</label>
                  <input type="datetime-local" value={editModal.deadline} onChange={(e) => setEditModal(prev => ({ ...prev, deadline: e.target.value }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button disabled={isSaving} onClick={() => setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, client_id: undefined, deadline: '' })} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}>Cancelar</button>
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    if (!editModal.ticketId) return
                    try {
                      setIsSaving(true)
                      const token = authCookies.getToken()
                      if (!token) throw new Error('Sessão expirada')
                      const body = {
                        title: editModal.title,
                        description: editModal.description,
                        status: editModal.status,
                        priority: editModal.priority,
                        category_id: editModal.category_id || undefined,
                        subcategory_id: editModal.subcategory_id,
                        assigned_to: editModal.assigned_to,
                        client_id: editModal.client_id,
                        due_date: editModal.deadline ? new Date(editModal.deadline).toISOString() : undefined,
                      }
                      const res = await fetch(`/helpdesk/tickets/${editModal.ticketId}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.message || 'Falha ao salvar alterações')
                      }
                      const updated = await res.json()
                      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
                      setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, client_id: undefined, deadline: '' })
                      const { toast } = await import('react-toastify')
                      toast.success('Chamado atualizado com sucesso')
                    } catch (e: any) {
                      const { toast } = await import('react-toastify')
                      toast.error(e?.message ?? 'Erro ao salvar alterações')
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aceitar Ticket */}
      {acceptModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isAccepting && setAcceptModal({ open: false, ticketId: null, ticket: null })} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Aceitar Ticket</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-2`}>
                  Tem certeza que deseja aceitar o ticket <span className="font-semibold">{acceptModal.ticket?.ticket_number || `#${acceptModal.ticketId}`}</span>?
                </p>
                {acceptModal.ticket?.title && (
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>{acceptModal.ticket.title}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={isAccepting}
                  onClick={() => setAcceptModal({ open: false, ticketId: null, ticket: null })}
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}
                >
                  Cancelar
                </button>
                <button
                  disabled={isAccepting}
                  onClick={() => acceptModal.ticketId && handleAcceptTicket(acceptModal.ticketId)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {isAccepting ? 'Aceitando...' : 'Aceitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recusar Ticket */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isRejecting && setRejectModal({ open: false, ticketId: null, ticket: null })} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recusar Ticket</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-2`}>
                  Tem certeza que deseja recusar o ticket <span className="font-semibold">{rejectModal.ticket?.ticket_number || `#${rejectModal.ticketId}`}</span>?
                </p>
                {rejectModal.ticket?.title && (
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>{rejectModal.ticket.title}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={isRejecting}
                  onClick={() => setRejectModal({ open: false, ticketId: null, ticket: null })}
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}
                >
                  Cancelar
                </button>
                <button
                  disabled={isRejecting}
                  onClick={() => rejectModal.ticketId && handleRejectTicket(rejectModal.ticketId)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {isRejecting ? 'Recusando...' : 'Recusar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualizar Ticket */}
      {updateModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isUpdating && setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '' })} />
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Atualizar Ticket #{updateModal.ticket?.ticket_number || updateModal.ticketId}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Status
                  </label>
                  <select
                    value={updateModal.status}
                    onChange={(e) => setUpdateModal(prev => ({ ...prev, status: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    required
                  >
                    <option value="Open">Aberto</option>
                    <option value="InProgress">Em Progresso</option>
                    <option value="WaitingForClient">Aguardando Cliente</option>
                    <option value="WaitingForThirdParty">Aguardando Terceiros</option>
                    <option value="Resolved">Resolvido</option>
                    <option value="Closed">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Prazo (opcional)
                  </label>
                  <input
                    type="date"
                    value={updateModal.dueDate}
                    onChange={(e) => setUpdateModal(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Relatório * (obrigatório)
                  </label>
                  <textarea
                    value={updateModal.report}
                    onChange={(e) => setUpdateModal(prev => ({ ...prev, report: e.target.value }))}
                    placeholder="Descreva o progresso, ações realizadas, próximos passos..."
                    className={`w-full px-3 py-2 border rounded-lg h-32 resize-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={isUpdating}
                  onClick={() => setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '' })}
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}
                >
                  Cancelar
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => {
                    if (!updateModal.ticketId || !updateModal.report.trim()) return
                    const nextStatus = updateModal.status as 'Open' | 'InProgress' | 'WaitingForClient' | 'WaitingForThirdParty' | 'Resolved' | 'Closed'
                    // Confirmação se for Resolved ou Closed (Cancelado)
                    if (nextStatus === 'Resolved' || nextStatus === 'Closed') {
                      setCloseConfirm({ open: true, ticketId: updateModal.ticketId!, statusToSet: nextStatus === 'Resolved' ? 'Resolved' : 'Closed' })
                      return
                    }
                    handleUpdateTicket(updateModal.ticketId, {
                      status: nextStatus,
                      due_date: updateModal.dueDate || null,
                      report: updateModal.report.trim()
                    })
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isUpdating ? 'Salvando...' : 'Atualizar Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Fechamento (Resolvido/Cancelado) */}
      {closeConfirm.open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCloseConfirm({ open: false, ticketId: null, statusToSet: '' })} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {closeConfirm.statusToSet === 'Resolved' ? 'Confirmar Resolução' : 'Confirmar Cancelamento'}
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-2`}>
                {closeConfirm.statusToSet === 'Resolved'
                  ? 'Você confirma que o chamado foi realmente resolvido? Ele será fechado e sairá da sua lista de ativos. Depois, só ficará disponível no histórico.'
                  : 'Você confirma o cancelamento deste chamado? Ele será fechado como cancelado e sairá da sua lista de ativos. Depois, só ficará disponível no histórico.'}
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setCloseConfirm({ open: false, ticketId: null, statusToSet: '' })}
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors`}
                >
                  Voltar
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => {
                    if (!closeConfirm.ticketId || !closeConfirm.statusToSet) return
                    handleUpdateTicket(closeConfirm.ticketId, {
                      status: closeConfirm.statusToSet,
                      due_date: updateModal.dueDate || null,
                      report: (updateModal.report || '').trim()
                    })
                    // Remover da lista visível (ativos)
                    setTickets(prev => prev.filter(t => t.id !== closeConfirm.ticketId))
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${closeConfirm.statusToSet === 'Resolved' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  {isUpdating ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}
