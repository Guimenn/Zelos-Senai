'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireAuth } from '../../../../hooks/useAuth'
import { Button } from '@heroui/button'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { authCookies } from '../../../../utils/cookies'
import AgentEvaluationModal from '../../../../components/agent-evaluation-modal'
import { API_BASE } from '../../../../lib/config'
import ChatButtonSimple from '../../../../components/chat/ChatButtonSimple'

import {
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaTrash,
  FaDownload,
  FaPrint,
  FaCalendarAlt,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaTools,
  FaThermometerHalf,
  FaLightbulb,
  FaDesktop,
  FaBuilding,
  FaShieldAlt,
  FaCog,
  FaArrowLeft,
  FaPlus,
  FaFileAlt,
  FaComments,
  FaHistory,
  FaChartBar,
  FaList,
  FaPaperclip,
  FaTh,
  FaStar
} from 'react-icons/fa'

interface Ticket {
  id: string
  title: string
  description: string
  status: 'Open' | 'InProgress' | 'WaitingForClient' | 'WaitingForThirdParty' | 'Resolved' | 'Closed' 
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  category: string
  subcategory?: string
  location: string
  requester: string
  requester_email?: string
  assigned_to?: string
  assigned_agent_id?: number | null
  assignee?: {
    id: number
    name: string
    email: string
    agent?: {
      id: number
      employee_id: string
      department: string
    }
  }
  created_at: Date
  updated_at: Date
  resolved_at?: Date
  deadline?: Date
  estimated_duration?: string
  attachments?: number
  tags: string[]
  backendId?: number
}

interface FilterState {
  search: string
  status: string
  priority: string
  category: string
  dateRange: {
    start: string
    end: string
  }
}

interface SortState {
  field: keyof Ticket
  direction: 'asc' | 'desc'
}

// Função para formatar o prazo do ticket
const formatDeadline = (dueDate: string | Date | null) => {
  try {
    if (!dueDate) return '-'
    
    const now = new Date()
    const due = new Date(dueDate)
    
    if (now > due) {
      return 'Vencido'
    }
    
    const diffMs = due.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) {
      return 'Vence em menos de 1h'
    } else if (diffHours < 24) {
      return `Vence em ${diffHours}h`
    } else if (diffDays < 7) {
      return `Vence em ${diffDays}d`
    } else {
      return due.toLocaleDateString('pt-BR')
    }
  } catch (error) {
    console.error('Erro na função formatDeadline:', error)
    return '-'
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user, isLoading: authLoading } = useRequireAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    dateRange: { start: '', end: '' }
  })
  const [sort, setSort] = useState<SortState>({ field: 'created_at', direction: 'desc' })
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [isAgent, setIsAgent] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [viewModal, setViewModal] = useState({ open: false, loading: false, ticket: null as any })
  const [imagePreview, setImagePreview] = useState({ open: false, src: '', name: '' })
  
  // Estados para avaliação de agentes
  const [evaluationModal, setEvaluationModal] = useState({ open: false, agentId: 0, agentName: '' })
  



  // Controlar scroll do body quando modal estiver aberto
  useEffect(() => {
    if (viewModal.open || imagePreview.open || evaluationModal.open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [viewModal.open, imagePreview.open, evaluationModal.open])

  // Carregamento via API substitui mock
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = authCookies.getToken()
        if (!token) return
        
        // Detectar tipo de usuário usando o hook
        let isAgentUser = false
        let isClientUser = false
        let isAdminUser = false
        
        if (user) {
          const role = (user.role ?? user.userRole ?? '').toString().toLowerCase()
          isAgentUser = role === 'agent'
          isClientUser = role === 'client'
          isAdminUser = role === 'admin'
          setIsAgent(isAgentUser)
          setIsClient(isClientUser)
          setIsAdmin(isAdminUser)
          setCurrentUserId(user.userId)
          console.log('Tipo de usuário detectado:', { isAgentUser, isClientUser, isAdminUser })
          console.log('User object:', user)
          console.log('Role:', role)
        }
        
        // Usar rota específica baseada no tipo de usuário
        let endpoint = '/helpdesk/tickets'
        if (isAgentUser) {
          endpoint = '/helpdesk/agents/my-history'
        } else if (isClientUser) {
          endpoint = '/helpdesk/client/my-tickets'
        }
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Falha ao carregar chamados')
        }
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.tickets ?? [])

        const mapped: Ticket[] = items.map((t: any) => ({
            id: (t.ticket_number ?? String(t.id)) as string,
            backendId: Number(t.id),
            title: t.title ?? '-',
            description: t.description ?? '-',
            status: t.status as Ticket['status'],
            priority: t.priority as Ticket['priority'],
            category: t.category?.name ?? '-',
            subcategory: t.subcategory?.name ?? undefined,
            location: t.location ?? t.client?.department ?? t.client?.user?.department ?? t.client?.address ?? t.client?.user?.address ?? '-',
            requester: t.client?.user?.name ?? t.creator?.name ?? '-',
            requester_email: t.client?.user?.email ?? undefined,
            assigned_to: t.assignee ? `${t.assignee.name} (ID: ${t.assignee.id})` : undefined,
            assigned_agent_id: t.assignee?.agent?.id || null,
            created_at: new Date(t.created_at),
            updated_at: new Date(t.modified_at ?? t.created_at),
            resolved_at: t.closed_at ? new Date(t.closed_at) : undefined,
            deadline: t.due_date ? new Date(t.due_date) : undefined,
            estimated_duration: formatDeadline(t.due_date),
            attachments: Array.isArray(t.attachments) ? t.attachments.length : undefined,
            tags: [t.category?.name].filter(Boolean) as string[]
          }))
        setTickets(mapped)
        setFilteredTickets(mapped)
      } catch (e) {
        // silencioso aqui; UX tratada por filtros e estados
      }
    }

    const fetchCategories = async () => {
      try {
        const token = authCookies.getToken()
        if (!token) return
        
        const res = await fetch(`${API_BASE}/helpdesk/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!res.ok) {
          throw new Error('Falha ao carregar categorias')
        }
        
        const data = await res.json()
        const categoriesList = Array.isArray(data) ? data : []
        
        setCategories(categoriesList.map((cat: any) => ({
          id: cat.id,
          name: cat.name
        })))
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        // Fallback para categorias hardcoded se a API falhar
        setCategories([
          { id: 1, name: 'Suporte Técnico' },
          { id: 2, name: 'Infraestrutura' },
          { id: 3, name: 'Sistema' }
        ])
      }
    }
    
    fetchTickets()
    fetchCategories()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      fetchTickets()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [filters, sort, tickets])

  const applyFilters = () => {
    let filtered = [...tickets]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        ticket.id.toLowerCase().includes(searchTerm) ||
        ticket.requester.toLowerCase().includes(searchTerm) ||
        ticket.location.toLowerCase().includes(searchTerm)
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority)
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filters.category)
    }

    // Date range filter (created_at)
    if (filters.dateRange.start || filters.dateRange.end) {
      const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null
      const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null
      
      // Validar se as datas são válidas
      const isValidStart = start && !isNaN(start.getTime())
      const isValidEnd = end && !isNaN(end.getTime())
      
      // Validar se data inicial não é posterior à data final
      const isValidRange = !isValidStart || !isValidEnd || start <= end
      
      if (isValidRange) {
        filtered = filtered.filter(ticket => {
          const created = new Date(ticket.created_at)
          
          // Verificar se a data de criação é válida
          if (isNaN(created.getTime())) {
            return false
          }
          
          // Definir início do dia para data inicial
          const startOfDay = isValidStart ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0) : null
          // Definir fim do dia para data final
          const endOfDay = isValidEnd ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : null
          
          const afterStart = startOfDay ? created >= startOfDay : true
          const beforeEnd = endOfDay ? created <= endOfDay : true
          
          return afterStart && beforeEnd
        })
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sort.field]
      const bValue = b[sort.field]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sort.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      return 0
    })


    setFilteredTickets(filtered)
    setPage(1)
  }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Open': return 'Aberto'
      case 'InProgress': return 'Em Andamento'
      case 'WaitingForClient': return 'Aguardando Cliente'
      case 'WaitingForThirdParty': return 'Aguardando Terceiros'
      case 'Resolved': return 'Resolvido'
      case 'Closed': return 'Fechado'
      default: return status
    }
  }

  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'Crítica'
      case 'High': return 'Alta'
      case 'Medium': return 'Média'
      case 'Low': return 'Baixa'
      default: return priority
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': 
        return 'bg-blue-500 text-white'
      case 'InProgress': 
        return 'bg-yellow-500 text-white'
      case 'WaitingForClient':
      case 'WaitingForThirdParty':
        return 'bg-orange-500 text-white'
      case 'Resolved': 
        return 'bg-green-500 text-white'
      case 'Closed': 
        return 'bg-gray-500 text-white'
      default: 
        return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': 
        return 'bg-red-600 text-white'
      case 'High': 
        return 'bg-orange-500 text-white'
      case 'Medium': 
        return 'bg-yellow-500 text-white'
      case 'Low': 
        return 'bg-green-500 text-white'
      default: 
        return 'bg-gray-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Sistema': return <FaDesktop className="w-4 h-4" />
      case 'Hardware': return <FaTools className="w-4 h-4" />
      case 'Software': return <FaCog className="w-4 h-4" />
      case 'Rede': return <FaShieldAlt className="w-4 h-4" />
      case 'Outros': return <FaLightbulb className="w-4 h-4" />
      default: return <FaCog className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Open': return 'Aberto'
      case 'InProgress': return 'Em Andamento'
      case 'WaitingForClient': return 'Aguardando Cliente'
      case 'WaitingForThirdParty': return 'Aguardando Terceiros'
      case 'Resolved': return 'Resolvido'
      case 'Closed': return 'Fechado'
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'Crítica'
      case 'High': return 'Alta'
      case 'Medium': return 'Média'
      case 'Low': return 'Baixa'
      default: return priority
    }
  }

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      dateRange: { start: '', end: '' }
    })
  }

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const selectAllTickets = () => {
    setSelectedTickets(filteredTickets.map(ticket => ticket.id))
  }

  const deselectAllTickets = () => {
    setSelectedTickets([])
  }

  const exportToCSV = () => {
    const ticketsToExport = selectedTickets.length > 0 
      ? tickets.filter(ticket => selectedTickets.includes(ticket.id))
      : filteredTickets

    if (ticketsToExport.length === 0) {
      alert('Nenhum chamado para exportar')
      return
    }

    // Cabeçalhos do CSV
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Status',
      'Prioridade',
      'Categoria',
      'Subcategoria',
      'Localização',
      'Solicitante',
      'Email do Solicitante',
      'Atribuído para',
      'Data de Criação',
      'Data de Atualização',
      'Data de Resolução',
      'Prazo',
      'Duração Estimada',
      'Anexos',
      'Comentários',
      'Tags'
    ]

    // Converter dados para CSV
    const csvContent = [
      headers.join(','),
      ...ticketsToExport.map(ticket => [
        ticket.id,
        `"${ticket.title.replace(/"/g, '""')}"`,
        `"${ticket.description.replace(/"/g, '""')}"`,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.subcategory || '',
        ticket.location,
        ticket.requester,
        ticket.requester_email || '',
        ticket.assigned_to || '',
        new Date(ticket.created_at).toLocaleDateString('pt-BR'),
        new Date(ticket.updated_at).toLocaleDateString('pt-BR'),
        ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString('pt-BR') : '',
        ticket.deadline ? new Date(ticket.deadline).toLocaleDateString('pt-BR') : '',
        ticket.estimated_duration || '',
        ticket.attachments || 0,
        `"${ticket.tags.join(', ')}"`
      ].join(','))
    ].join('\n')

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `chamados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    const ticketsToExport = selectedTickets.length > 0 
      ? tickets.filter(ticket => selectedTickets.includes(ticket.id))
      : filteredTickets

    if (ticketsToExport.length === 0) {
      alert('Nenhum chamado para exportar')
      return
    }

    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Configurações
      const pageHeight = doc.internal.pageSize.height
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = margin
      
      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de Chamados', margin, yPosition)
      yPosition += 15
      
      // Data de geração
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition)
      yPosition += 10
      
      doc.text(`Total de chamados: ${ticketsToExport.length}`, margin, yPosition)
      yPosition += 20
      
      // Processar cada ticket
      for (let i = 0; i < ticketsToExport.length; i++) {
        const ticket = ticketsToExport[i]
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = margin
        }
        
        // Cabeçalho do ticket
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Chamado #${ticket.id}`, margin, yPosition)
        yPosition += 8
        
        // Informações do ticket
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        const info = [
          `Título: ${ticket.title}`,
          `Status: ${ticket.status}`,
          `Prioridade: ${ticket.priority}`,
          `Categoria: ${ticket.category}${ticket.subcategory ? ` > ${ticket.subcategory}` : ''}`,
          `Localização: ${ticket.location}`,
          `Solicitante: ${ticket.requester}`,
          `Criado em: ${new Date(ticket.created_at).toLocaleDateString('pt-BR')}`,
          `Atualizado em: ${new Date(ticket.updated_at).toLocaleDateString('pt-BR')}`
        ]
        
        if (ticket.assigned_to) {
          info.push(`Atribuído para: ${ticket.assigned_to}`)
        }
        
        if (ticket.resolved_at) {
          info.push(`Resolvido em: ${new Date(ticket.resolved_at).toLocaleDateString('pt-BR')}`)
        }
        
        info.forEach(line => {
          doc.text(line, margin, yPosition)
          yPosition += 5
        })
        
        // Descrição
        if (ticket.description) {
          yPosition += 3
          doc.setFont('helvetica', 'bold')
          doc.text('Descrição:', margin, yPosition)
          yPosition += 5
          
          doc.setFont('helvetica', 'normal')
          const splitDescription = doc.splitTextToSize(ticket.description, pageWidth - 2 * margin)
          doc.text(splitDescription, margin, yPosition)
          yPosition += splitDescription.length * 5
        }
        
        yPosition += 10
      }
      
      // Salvar PDF
      doc.save(`chamados_${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Verifique se a biblioteca jsPDF está disponível.')
    }
  }

  const printTickets = async () => {
    const ticketsToPrint = selectedTickets.length > 0 
      ? tickets.filter(ticket => selectedTickets.includes(ticket.id))
      : filteredTickets

    if (ticketsToPrint.length === 0) {
      alert('Nenhum chamado para imprimir')
      return
    }

    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Configurações
      const pageHeight = doc.internal.pageSize.height
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = margin
      
      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de Chamados - SENAI', margin, yPosition)
      yPosition += 15
      
      // Data de geração
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition)
      yPosition += 10
      
      doc.text(`Total de chamados: ${ticketsToPrint.length}`, margin, yPosition)
      yPosition += 20
      
      // Processar cada ticket
      for (let i = 0; i < ticketsToPrint.length; i++) {
        const ticket = ticketsToPrint[i]
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = margin
        }
        
        // Cabeçalho do ticket
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Chamado #${ticket.id}`, margin, yPosition)
        yPosition += 8
        
        // Informações do ticket
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        const info = [
          `Título: ${ticket.title}`,
          `Status: ${ticket.status}`,
          `Prioridade: ${ticket.priority}`,
          `Categoria: ${ticket.category}${ticket.subcategory ? ` > ${ticket.subcategory}` : ''}`,
          `Localização: ${ticket.location}`,
          `Solicitante: ${ticket.requester}`,
          `Criado em: ${new Date(ticket.created_at).toLocaleDateString('pt-BR')}`,
          `Atualizado em: ${new Date(ticket.updated_at).toLocaleDateString('pt-BR')}`
        ]
        
        if (ticket.assigned_to) {
          info.push(`Atribuído para: ${ticket.assigned_to}`)
        }
        
        if (ticket.resolved_at) {
          info.push(`Resolvido em: ${new Date(ticket.resolved_at).toLocaleDateString('pt-BR')}`)
        }
        
        info.forEach(line => {
          doc.text(line, margin, yPosition)
          yPosition += 5
        })
        
        // Descrição
        if (ticket.description) {
          yPosition += 3
          doc.setFont('helvetica', 'bold')
          doc.text('Descrição:', margin, yPosition)
          yPosition += 5
          
          doc.setFont('helvetica', 'normal')
          const splitDescription = doc.splitTextToSize(ticket.description, pageWidth - 2 * margin)
          doc.text(splitDescription, margin, yPosition)
          yPosition += splitDescription.length * 5
        }
        
        yPosition += 10
      }
      
      // Abrir janela de impressão do PDF
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const printWindow = window.open(pdfUrl, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.')
      }
      
    } catch (error) {
      console.error('Erro ao gerar PDF para impressão:', error)
      alert('Erro ao gerar PDF para impressão. Verifique se a biblioteca jsPDF está disponível.')
    }
  }

  const loadTicketDetails = async (ticketId: number) => {
    try {
      setViewModal({ open: true, loading: true, ticket: null })
      const token = authCookies.getToken()
      if (!token) throw new Error('Sessão expirada')
      
      const res = await fetch(`/helpdesk/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Falha ao carregar detalhes do chamado')
      }
      
      const detailed = await res.json()
      setViewModal({ open: true, loading: false, ticket: detailed })
    } catch (e: any) {
      console.error('Erro ao carregar detalhes:', e)
      setViewModal({ open: false, loading: false, ticket: null })
      const { toast } = await import('react-toastify')
      toast.error(e?.message ?? 'Erro ao carregar detalhes do chamado')
    }
  }

  const viewImage = (imageUrl: string, fileName: string) => {
    setImagePreview({ open: true, src: imageUrl, name: fileName })
  }

  const deleteTickets = async () => {
    if (selectedTickets.length === 0) return
    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Sessão expirada')
      // Deleta em série para manter feedback simples
      for (const displayId of selectedTickets) {
        const ticket = tickets.find(t => t.id === displayId)
        if (!ticket || typeof ticket.backendId !== 'number') continue
        const res = await fetch(`/helpdesk/tickets/${ticket.backendId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || `Falha ao excluir ${displayId}`)
        }
      }
      setTickets(prev => prev.filter(ticket => !selectedTickets.includes(ticket.id)))
      setSelectedTickets([])
      const { toast } = await import('react-toastify')
      toast.success('Chamado(s) excluído(s) com sucesso')
    } catch (e: any) {
      const { toast } = await import('react-toastify')
      toast.error(e?.message ?? 'Erro ao excluir chamado(s)')
    }
  }

  const openEvaluationModal = (agentId: number, agentName: string) => {
    setEvaluationModal({ open: true, agentId, agentName })
  }

  const closeEvaluationModal = () => {
    setEvaluationModal({ open: false, agentId: 0, agentName: '' })
  }

  const handleEvaluationSubmitted = () => {
    // Recarregar dados se necessário
    closeEvaluationModal()
  }

  // Helper para obter o ticket e o ID numérico a partir do ID exibido
  const getTicketAndIdByDisplay = (displayId: string): { ticket: any | undefined; id: number | null } => {
    console.log('🔍 Debug - getTicketAndIdByDisplay chamado com displayId:', displayId)
    console.log('🔍 Debug - tickets disponíveis:', tickets.length)
    
    // Buscar ticket pelo displayId (que é o ticket_number ou String(t.id))
    const ticket = tickets.find(t => t.id === displayId)
    console.log('🔍 Debug - ticket encontrado por displayId:', ticket)
    
    if (ticket) {
      // Retornar o backendId (ID numérico real) para o ChatButtonSimple
      console.log('🔍 Debug - retornando ticket com backendId:', ticket.backendId)
      return { ticket, id: ticket.backendId || null }
    }
    
    console.log('🔍 Debug - ticket não encontrado')
    return { ticket: undefined, id: null }
  }



  const handleTicketUpdated = () => {
    // Recarregar dados após edição
    // Recarregar a página para atualizar os dados
    window.location.reload()
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } shadow-lg`}
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Histórico de Chamados
                </h1>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Visualize e gerencie todos os chamados de manutenção
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              { !isAgent && (
                <Button
                  onClick={() => router.push('/pages/called/new')}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Novo Chamado</span>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total de Chamados
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {tickets.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <FaFileAlt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            { !isAgent && (
              <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Em Andamento
                    </p>
                    <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tickets.filter(t => t.status === 'InProgress').length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                    <FaClock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            )}

            <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Concluídos
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Críticos
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {tickets.filter(t => t.priority === 'Critical').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                  <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Buscar por título, descrição, ID, solicitante..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaTh className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-4 space-y-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Status:
              </span>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'Open', label: 'Abertos' },
                { key: 'InProgress', label: 'Em Andamento' },
                { key: 'WaitingForClient', label: 'Aguardando Cliente' },
                { key: 'WaitingForThirdParty', label: 'Aguardando Terceiros' },
                { key: 'Resolved', label: 'Resolvidos' },
                { key: 'Closed', label: 'Fechados' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilters(prev => ({ ...prev, status: filter.key }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                    filters.status === filter.key
                      ? 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prioridade
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">Todas</option>
                  <option value="Low">Baixa</option>
                  <option value="Medium">Média</option>
                  <option value="High">Alta</option>
                  <option value="Critical">Crítica</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Categoria
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Data de Criação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      title="Data inicial (opcional)"
                    />
                    <span className={`text-xs mt-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      De
                    </span>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      title="Data final (opcional)"
                    />
                    <span className={`text-xs mt-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Até
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all' || filters.dateRange.start || filters.dateRange.end) && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-500">
            {filteredTickets.length} de {tickets.length} chamados encontrados
          </div>

        </div>

        {/* Bulk Actions */}
        {selectedTickets.length > 0 && (
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedTickets.length} chamado(s) selecionado(s)
                </span>
                <button
                  onClick={deselectAllTickets}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300"
                >
                  Desmarcar todos
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 flex items-center space-x-2"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
                <button
                  onClick={printTickets}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center space-x-2"
                >
                  <FaPrint className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={deleteTickets}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 flex items-center space-x-2"
                >
                  <FaTrash className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tickets List */}
        <div className={`rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
          {/* Table Header */}
          <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                  onChange={selectedTickets.length === filteredTickets.length ? deselectAllTickets : selectAllTickets}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Chamados
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={`${sort.field}-${sort.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    setSort({ field: field as keyof Ticket, direction: direction as 'asc' | 'desc' })
                  }}
                  className={`px-3 py-1 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="created_at-desc">Mais Recentes</option>
                  <option value="created_at-asc">Mais Antigos</option>
                  <option value="priority-desc">Prioridade (Alta → Baixa)</option>
                  <option value="priority-asc">Prioridade (Baixa → Alta)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="title-asc">Título (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className={`text-center py-12 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <FaFileAlt className={`mx-auto h-12 w-12 mb-4 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    Nenhum chamado encontrado
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {filters.search || filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0 || filters.dateRange.start || filters.dateRange.end
                      ? 'Tente ajustar os filtros para encontrar chamados.'
                      : 'Não há chamados cadastrados no sistema.'}
                  </p>
                  {(filters.search || filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0 || filters.dateRange.start || filters.dateRange.end) && (
                    <button
                      onClick={clearFilters}
                      className={`mt-4 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                    } ${
                      selectedTickets.includes(ticket.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => toggleTicketSelection(ticket.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                            {translateStatus(ticket.status)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                            {translatePriority(ticket.priority)}
                          </span>
                          {ticket.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className={`px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.title}
                        </h3>
                        
                        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {ticket.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <FaUser className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              <strong>Solicitante:</strong> {ticket.requester}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaTools className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              <strong>Técnico:</strong> {ticket.assigned_to || '-'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              <strong>Local:</strong> {ticket.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaClock className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              <strong>Tempo Estimado:</strong> {ticket.estimated_duration}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-4 text-xs">
                               <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                 Criado: {ticket.created_at.toLocaleDateString('pt-BR')}
                               </span>
                               <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                 Atualizado: {ticket.updated_at.toLocaleDateString('pt-BR')}
                               </span>
                             </div>
                             

                           </div>
                           
                           <div className="flex items-center space-x-2">
                             <button
                               onClick={() => ticket.backendId && loadTicketDetails(ticket.backendId)}
                               className={`p-2 rounded-lg ${
                                 theme === 'dark' 
                                   ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                               } transition-colors`}
                               disabled={!ticket.backendId}
                             >
                               <FaEye />
                             </button>

                             {/* Botão do Chat */}
                             {(() => {
                               const { ticket: ticketData, id: ticketId } = getTicketAndIdByDisplay(ticket.id)
                               if (!ticketData || !ticketId) return null
                               
                               return (
                                 <div onClick={(e) => e.stopPropagation()}>
                                   <ChatButtonSimple
                                     key={`chat-${ticket.id}`}
                                     ticketId={ticketId.toString()}
                                     size="sm"
                                     variant="outline"
                                     isHistoryMode={true}
                                   />
                                 </div>
                               )
                             })()}
                           
                            
                                                          
                              {isAdmin && (
                                <button
                                  onClick={async () => {
                                    console.log('Botão de avaliação clicado')
                                    console.log('ticket.assigned_to:', ticket.assigned_to)
                                    console.log('ticket.assigned_agent_id:', ticket.assigned_agent_id)
                                    
                                    try {
                                      // Usar o ID do agente do relacionamento se disponível
                                      if (ticket.assignee?.agent?.id) {
                                        console.log('ID do agente encontrado:', ticket.assignee.agent.id)
                                        openEvaluationModal(ticket.assignee.agent.id, ticket.assigned_to || 'Técnico')
                                        return
                                      }
                                      
                                      // Fallback para assigned_agent_id se disponível
                                      if (ticket.assigned_agent_id) {
                                        console.log('ID do agente encontrado (fallback):', ticket.assigned_agent_id)
                                        openEvaluationModal(ticket.assigned_agent_id, ticket.assigned_to || 'Técnico')
                                        return
                                      }
                                      
                                      // Fallback: Extrair ID do agente do nome (formato: "Nome (ID: 123)")
                                      const agentMatch = ticket.assigned_to?.match(/\(ID: (\d+)\)/)
                                      const agentId = agentMatch ? parseInt(agentMatch[1]) : null
                                      
                                      if (agentId) {
                                        console.log('ID do agente extraído do nome:', agentId)
                                        openEvaluationModal(agentId, ticket.assigned_to || 'Técnico')
                                      } else {
                                        // Se não conseguir extrair o ID, buscar na API
                                        const token = authCookies.getToken()
                                        if (token) {
                                          const response = await fetch('/admin/agent', {
                                            headers: { Authorization: `Bearer ${token}` }
                                          })
                                          
                                          if (response.ok) {
                                            const data = await response.json()
                                            const agents = data.agents || data // Fallback para diferentes formatos
                                            
                                            if (Array.isArray(agents)) {
                                              const agent = agents.find((a: any) => 
                                                a.name === ticket.assigned_to || 
                                                a.user?.name === ticket.assigned_to ||
                                                a.employee_id === ticket.assigned_to
                                              )
                                               
                                              if (agent) {
                                                console.log('Agente encontrado na API:', agent)
                                                openEvaluationModal(agent.id, agent.name || agent.user?.name || ticket.assigned_to || 'Técnico')
                                                return
                                              }
                                            }
                                          }
                                        }
                                        
                                        console.log('Usando ID fixo como fallback')
                                        openEvaluationModal(1, ticket.assigned_to || 'Técnico')
                                      }
                                    } catch (error) {
                                      console.error('Erro ao processar agente:', error)
                                      openEvaluationModal(1, ticket.assigned_to || 'Técnico')
                                    }
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  } transition-colors`}
                                  title="Avaliar Técnico"
                                >
                                  <FaStar />
                                </button>
                              )}
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.length === 0 ? (
                <div className={`col-span-full text-center py-12 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <FaFileAlt className={`mx-auto h-12 w-12 mb-4 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    Nenhum chamado encontrado
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {filters.search || filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0 || filters.dateRange.start || filters.dateRange.end
                      ? 'Tente ajustar os filtros para encontrar chamados.'
                      : 'Não há chamados cadastrados no sistema.'}
                  </p>
                  {(filters.search || filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0 || filters.dateRange.start || filters.dateRange.end) && (
                    <button
                      onClick={clearFilters}
                      className={`mt-4 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                    } flex flex-col min-h-[280px]`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.id}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {translateStatus(ticket.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {translatePriority(ticket.priority)}
                          </span>
                        </div>
                        <h3 className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 break-words flex-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {ticket.description}
                    </p>

                    {/* Tags */}
                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ticket.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span key={tagIndex} className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            +{ticket.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <FaUser className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {ticket.requester}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaTools className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {ticket.assigned_to || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {ticket.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {ticket.estimated_duration}
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-xs">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          Criado: {ticket.created_at.toLocaleDateString('pt-BR')}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          Atualizado: {ticket.updated_at.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
                      <button
                        onClick={() => ticket.backendId && loadTicketDetails(ticket.backendId)}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                        disabled={!ticket.backendId}
                        title="Visualizar"
                      >
                        <FaEye className="text-sm" />
                      </button>

                      {/* Botão do Chat - Grid */}
                      {(() => {
                        const { ticket: ticketData, id: ticketId } = getTicketAndIdByDisplay(ticket.id)
                        if (!ticketData || !ticketId) return null
                        
                        return (
                          <div className="p-2" onClick={(e) => e.stopPropagation()}>
                            <ChatButtonSimple
                              key={`chat-grid-${ticket.id}`}
                              ticketId={ticketId.toString()}
                              size="sm"
                              variant="outline"
                              isHistoryMode={true}
                            />
                          </div>
                        )
                      })()}
                      
                     
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            try {
                              if (ticket.assignee?.agent?.id) {
                                openEvaluationModal(ticket.assignee.agent.id, ticket.assigned_to || 'Técnico')
                                return
                              }
                              
                              if (ticket.assigned_agent_id) {
                                openEvaluationModal(ticket.assigned_agent_id, ticket.assigned_to || 'Técnico')
                                return
                              }
                              
                              const agentMatch = ticket.assigned_to?.match(/\(ID: (\d+)\)/)
                              const agentId = agentMatch ? parseInt(agentMatch[1]) : null
                              
                              if (agentId) {
                                openEvaluationModal(agentId, ticket.assigned_to || 'Técnico')
                              } else {
                                const token = authCookies.getToken()
                                if (token) {
                                  const response = await fetch('/admin/agent', {
                                    headers: { Authorization: `Bearer ${token}` }
                                  })
                                  
                                  if (response.ok) {
                                    const data = await response.json()
                                    const agents = data.agents || data
                                    
                                    if (Array.isArray(agents)) {
                                      const agent = agents.find((a: any) => 
                                        a.name === ticket.assigned_to || 
                                        a.user?.name === ticket.assigned_to ||
                                        a.employee_id === ticket.assigned_to
                                      )
                                       
                                      if (agent) {
                                        openEvaluationModal(agent.id, agent.name || agent.user?.name || ticket.assigned_to || 'Técnico')
                                        return
                                      }
                                    }
                                  }
                                }
                                
                                openEvaluationModal(1, ticket.assigned_to || 'Técnico')
                              }
                            } catch (error) {
                              console.error('Erro ao processar agente:', error)
                              openEvaluationModal(1, ticket.assigned_to || 'Técnico')
                            }
                          }}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          } transition-colors`}
                          title="Avaliar Técnico"
                        >
                          <FaStar className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visualização */}
      {viewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModal({ open: false, loading: false, ticket: null })} />
          <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex flex-col shadow-2xl`}>
            {viewModal.loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : viewModal.ticket ? (
              <>
                <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Detalhes do Chamado
                    </h2>
                    <button
                      onClick={() => setViewModal({ open: false, loading: false, ticket: null })}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative">
                  <div className="space-y-6">
                    {/* Header do Ticket */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(viewModal.ticket.priority)}`}>
                            {translatePriority(viewModal.ticket.priority)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewModal.ticket.status)}`}>
                            {translateStatus(viewModal.ticket.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {viewModal.ticket.ticket_number}
                          </span>
                        </div>
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {viewModal.ticket.title}
                        </h3>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Descrição
                      </h4>
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {viewModal.ticket.description}
                      </p>
                    </div>

                    {/* Informações do Ticket */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Solicitante:</strong> {viewModal.ticket.client?.user?.name ?? viewModal.ticket.creator?.name ?? '-'}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Técnico:</strong> {viewModal.ticket.assignee?.name ?? '-'}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Categoria:</strong> {viewModal.ticket.category?.name ?? '-'}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Subcategoria:</strong> {viewModal.ticket.subcategory?.name ?? '-'}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Criado:</strong> {new Date(viewModal.ticket.created_at).toLocaleString('pt-BR')}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Atualizado:</strong> {new Date(viewModal.ticket.modified_at ?? viewModal.ticket.created_at).toLocaleString('pt-BR')}
                      </div>
                      {viewModal.ticket.due_date && (
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Prazo:</strong> {new Date(viewModal.ticket.due_date).toLocaleString('pt-BR')}
                        </div>
                      )}
                                             {viewModal.ticket.resolution_time && (
                         <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                           <strong>Tempo de Resolução:</strong> {viewModal.ticket.resolution_time} minutos
                         </div>
                       )}
                     </div>

                     {/* Histórico de Comentários */}
                     {viewModal.ticket.comments && viewModal.ticket.comments.length > 0 && (
                       <div>
                         <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                           Histórico do Chamado
                         </h4>
                         <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                           {viewModal.ticket.comments.map((comment: any, index: number) => (
                             <div key={comment.id || index} className={`p-4 rounded-lg border ${
                               theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                             }`}>
                               <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center space-x-2">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                     comment.user?.name ? 'bg-blue-500' : 'bg-gray-500'
                                   }`}>
                                     {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : '?'}
                                   </div>
                                   <div>
                                     <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                       {comment.user?.name || 'Usuário'}
                                     </span>
                                     <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                       {new Date(comment.created_at).toLocaleString('pt-BR')}
                                     </span>
                                   </div>
                                 </div>
                                 {comment.is_internal && (
                                   <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                     Interno
                                   </span>
                                 )}
                               </div>
                               <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                 {comment.content}
                               </div>
                                                                {comment.attachments && comment.attachments.length > 0 && (
                                   <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                       {comment.attachments.map((attachment: any, attIndex: number) => {
                                         const isImage = attachment.mime_type && attachment.mime_type.startsWith('image/')
                                         const imageUrl = attachment.url || `${API_BASE}/api/attachments/view/${attachment.id}`
                                         
                                         return (
                                           <div key={attIndex} className="flex items-center space-x-2">
                                             {isImage ? (
                                               <div className="flex-1">
                                                 <img
                                                   src={imageUrl}
                                                   alt={attachment.original_name || 'Imagem'}
                                                   className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                   loading="lazy"
                                                   onClick={() => viewImage(imageUrl, attachment.original_name || 'Imagem')}
                                                   onError={(e) => {
                                                     console.error('Erro ao carregar imagem:', imageUrl)
                                                     e.currentTarget.style.display = 'none'
                                                   }}
                                                   onLoad={() => {
                                                     console.log('Imagem carregada com sucesso:', imageUrl)
                                                   }}
                                                 />
                                                 <span className="text-xs text-gray-500 truncate block">
                                                   {attachment.original_name || 'Imagem'}
                                                 </span>
                                               </div>
                                             ) : (
                                               <a
                                                 href={imageUrl}
                                                 target="_blank"
                                                 rel="noopener noreferrer"
                                                 className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                                                   theme === 'dark' 
                                                     ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                 } transition-colors`}
                                               >
                                                 <FaPaperclip className="w-3 h-3" />
                                                 <span>{attachment.original_name || 'Anexo'}</span>
                                               </a>
                                             )}
                                           </div>
                                         )
                                       })}
                                     </div>
                                   </div>
                                 )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Anexos do Ticket */}
                     {viewModal.ticket.attachments && viewModal.ticket.attachments.length > 0 && (
                       <div>
                         <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                           Anexos do Chamado
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {viewModal.ticket.attachments.map((attachment: any, index: number) => {
                             const isImage = attachment.mime_type && attachment.mime_type.startsWith('image/')
                             const imageUrl = attachment.url || `${API_BASE}/api/attachments/view/${attachment.id}`
                             
                             return (
                               <div key={index} className={`p-4 rounded-lg border ${
                                 theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                               }`}>
                                 {isImage ? (
                                   <div className="space-y-3">
                                     <img
                                       src={imageUrl}
                                       alt={attachment.original_name || 'Imagem'}
                                       className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                       loading="lazy"
                                       onClick={() => viewImage(imageUrl, attachment.original_name || 'Imagem')}
                                       onError={(e) => {
                                         console.error('Erro ao carregar imagem:', imageUrl)
                                         e.currentTarget.style.display = 'none'
                                       }}
                                       onLoad={() => {
                                         console.log('Imagem carregada com sucesso:', imageUrl)
                                       }}
                                     />
                                     <div className="flex items-center justify-between">
                                       <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                         {attachment.original_name || 'Imagem'}
                                       </span>
                                       <button
                                         onClick={() => viewImage(imageUrl, attachment.original_name || 'Imagem')}
                                         className={`px-2 py-1 text-xs rounded ${
                                           theme === 'dark' 
                                             ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                             : 'bg-blue-500 text-white hover:bg-blue-600'
                                         } transition-colors`}
                                       >
                                         Ver
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="flex items-center justify-between">
                                     <div className="flex items-center space-x-2">
                                       <FaPaperclip className="w-4 h-4 text-gray-500" />
                                       <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                         {attachment.original_name || 'Anexo'}
                                       </span>
                                     </div>
                                     <button
                                       onClick={async () => {
                                         try {
                                           const token = authCookies.getToken()
                                           if (!token) {
                                             alert('Você precisa estar logado para baixar arquivos')
                                             return
                                           }

                                           const downloadUrl = `${API_BASE}/api/attachments/download/${attachment.id}`
                                           console.log('Baixando arquivo:', attachment.original_name)
                                           console.log('URL:', downloadUrl)

                                           const response = await fetch(downloadUrl, {
                                             method: 'GET',
                                             headers: {
                                               'Authorization': `Bearer ${token}`,
                                               'Content-Type': 'application/json'
                                             }
                                           })
                                           
                                           console.log('Response status:', response.status)
                                           
                                           if (!response.ok) {
                                             const errorText = await response.text()
                                             console.error('Erro na resposta:', errorText)
                                             throw new Error(`Erro ${response.status}: ${errorText}`)
                                           }
                                           
                                           const blob = await response.blob()
                                           console.log('Blob criado:', blob.size, 'bytes')
                                           
                                           const url = window.URL.createObjectURL(blob)
                                           const link = document.createElement('a')
                                           link.href = url
                                           link.download = attachment.original_name || 'Anexo'
                                           link.style.display = 'none'
                                           document.body.appendChild(link)
                                           link.click()
                                           document.body.removeChild(link)
                                           window.URL.revokeObjectURL(url)
                                           
                                           console.log('Download iniciado com sucesso')
                                         } catch (error) {
                                           console.error('Erro ao baixar:', error)
                                           alert(`Erro ao baixar arquivo: ${error.message}`)
                                         }
                                       }}
                                       className={`px-2 py-1 text-xs rounded ${
                                         theme === 'dark' 
                                           ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                           : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                       } transition-colors cursor-pointer`}
                                     >
                                       Baixar
                                     </button>
                                   </div>
                                 )}
                               </div>
                             )
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 {/* Indicador de scroll */}
                 <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t ${theme === 'dark' ? 'from-gray-800 to-transparent' : 'from-white to-transparent'} pointer-events-none`}></div>
               </>
             ) : null}
          </div>
                 </div>
       )}

       {/* Modal de Visualização de Imagens */}
       {imagePreview.open && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fadeIn">
           <div className="absolute inset-0 bg-black/80" onClick={() => setImagePreview({ open: false, src: '', name: '' })} />
           <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col">
             <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
               <h3 className="text-lg font-semibold text-gray-900 truncate">
                 {imagePreview.name}
               </h3>
               <button 
                 onClick={() => setImagePreview({ open: false, src: '', name: '' })} 
                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <FaTimes className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
               <img 
                 src={imagePreview.src} 
                 alt={imagePreview.name} 
                 className="w-full h-auto object-contain rounded-lg shadow-lg" 
               />
             </div>
           </div>
         </div>
       )}

       {/* Modal de Avaliação de Agente */}
       {evaluationModal.open && (
         <AgentEvaluationModal
           isOpen={evaluationModal.open}
           onClose={closeEvaluationModal}
           agentId={evaluationModal.agentId}
           agentName={evaluationModal.agentName}
           onEvaluationSubmitted={handleEvaluationSubmitted}
         />
       )}

      

     </ResponsiveLayout>
   )
 }
