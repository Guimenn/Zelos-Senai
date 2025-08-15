'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import { Button } from '@heroui/button'
import ResponsiveLayout from '../../../../components/responsive-layout'
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaEdit,
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
  FaTh
} from 'react-icons/fa'

interface Ticket {
  id: string
  title: string
  description: string
  status: 'Aberto' | 'Em Andamento' | 'Pausado' | 'Resolvido' | 'Fechado' | 'Cancelado'
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  category: string
  subcategory?: string
  location: string
  requester: string
  requester_email?: string
  assigned_to?: string
  created_at: Date
  updated_at: Date
  resolved_at?: Date
  deadline?: Date
  estimated_duration?: string
  attachments?: number
  comments?: number
  tags: string[]
  backendId?: number
}

interface FilterState {
  search: string
  status: string[]
  priority: string[]
  category: string[]
  urgency: string[]
  impact: string[]
  dateRange: {
    start: string
    end: string
  }
  assignedTo: string
  requester: string
}

interface SortState {
  field: keyof Ticket
  direction: 'asc' | 'desc'
}

export default function HistoryPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    priority: [],
    category: [],
    urgency: [],
    impact: [],
    dateRange: { start: '', end: '' },
    assignedTo: '',
    requester: ''
  })
  const [sort, setSort] = useState<SortState>({ field: 'created_at', direction: 'desc' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [isAgent, setIsAgent] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Carregamento via API substitui mock
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        // Detectar se é agente
        let isAgentUser = false
        try {
          const { jwtDecode } = await import('jwt-decode')
          const decoded: any = jwtDecode(token)
          const role = (decoded.role ?? decoded.userRole ?? '').toString().toLowerCase()
          isAgentUser = role === 'agent'
          setIsAgent(isAgentUser)
          setCurrentUserId(decoded.userId)
        } catch {}
        
        // Usar rota específica para histórico de agentes
        const endpoint = isAgentUser ? '/helpdesk/agents/my-history' : '/helpdesk/tickets'
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
          status: ((): Ticket['status'] => {
            switch (t.status) {
              case 'Open': return 'Aberto'
              case 'InProgress': return 'Em Andamento'
              case 'Resolved': return 'Resolvido'
              case 'Closed': return 'Fechado'
              case 'Cancelled': return 'Cancelado'
              case 'WaitingForClient':
              case 'WaitingForThirdParty':
                return 'Pausado'
              default: return 'Aberto'
            }
          })(),
          priority: ((): Ticket['priority'] => {
            switch (t.priority) {
              case 'Critical': return 'Crítica'
              case 'High': return 'Alta'
              case 'Medium': return 'Média'
              case 'Low': return 'Baixa'
              default: return 'Média'
            }
          })(),
          category: t.category?.name ?? '-',
          subcategory: t.subcategory?.name ?? undefined,
          location: t.client?.user?.department ?? '-',
          requester: t.client?.user?.name ?? t.creator?.name ?? '-',
          requester_email: t.client?.user?.email ?? undefined,
          assigned_to: t.assignee?.name ?? undefined,
          created_at: new Date(t.created_at),
          updated_at: new Date(t.modified_at ?? t.created_at),
          resolved_at: t.resolved_at ? new Date(t.resolved_at) : undefined,
          deadline: t.due_date ? new Date(t.due_date) : undefined,
          estimated_duration: undefined,
          attachments: Array.isArray(t.attachments) ? t.attachments.length : undefined,
          comments: Array.isArray(t.comments) ? t.comments.length : undefined,
          tags: [t.category?.name].filter(Boolean) as string[]
        }))
        setTickets(mapped)
        setFilteredTickets(mapped)
      } catch (e) {
        // silencioso aqui; UX tratada por filtros e estados
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
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, sort, tickets])

  const applyFilters = () => {
    let filtered = [...tickets]

    // Para agentes, mostrar apenas tickets concluídos (Resolvido, Fechado)
    if (isAgent) {
      filtered = filtered.filter(ticket => 
        ticket.status === 'Resolvido' || ticket.status === 'Fechado'
      )
    }

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
    if (filters.status.length > 0) {
      filtered = filtered.filter(ticket => filters.status.includes(ticket.status))
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(ticket => filters.priority.includes(ticket.priority))
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(ticket => filters.category.includes(ticket.category))
    }

    // Date range filter (created_at)
    if (filters.dateRange.start || filters.dateRange.end) {
      const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null
      const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null
      filtered = filtered.filter(ticket => {
        const created = ticket.created_at
        const afterStart = start ? created >= new Date(start.setHours(0, 0, 0, 0)) : true
        const beforeEnd = end ? created <= new Date(end.setHours(23, 59, 59, 999)) : true
        return afterStart && beforeEnd
      })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto': return 'bg-blue-500'
      case 'Em Andamento': return 'bg-yellow-500'
      case 'Pausado': return 'bg-orange-500'
      case 'Resolvido': return 'bg-green-500'
      case 'Fechado': return 'bg-gray-500'
      case 'Cancelado': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-red-500'
      case 'Alta': return 'bg-orange-500'
      case 'Média': return 'bg-yellow-500'
      case 'Baixa': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Equipamentos': return <FaTools className="w-4 h-4" />
      case 'Climatização': return <FaThermometerHalf className="w-4 h-4" />
      case 'Iluminação': return <FaLightbulb className="w-4 h-4" />
      case 'Informática': return <FaDesktop className="w-4 h-4" />
      case 'Infraestrutura': return <FaBuilding className="w-4 h-4" />
      case 'Segurança': return <FaShieldAlt className="w-4 h-4" />
      default: return <FaCog className="w-4 h-4" />
    }
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      category: [],
      urgency: [],
      impact: [],
      dateRange: { start: '', end: '' },
      assignedTo: '',
      requester: ''
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
        ticket.comments || 0,
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

  const deleteTickets = async () => {
    if (selectedTickets.length === 0) return
    try {
      const token = localStorage.getItem('token')
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
              <Button
                onClick={() => router.push('/pages/called/new')}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <FaPlus className="w-4 h-4" />
                <span>Novo Chamado</span>
              </Button>
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

            <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Em Andamento
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {tickets.filter(t => t.status === 'Em Andamento').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                  <FaClock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Concluídos
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {tickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado').length}
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
                    {tickets.filter(t => t.priority === 'Crítica').length}
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                  showFilters 
                    ? 'bg-blue-500 text-white' 
                    : theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaFilter className="w-4 h-4" />
                <span>Filtros</span>
              </button>

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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    multiple
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      status: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Resolvido">Resolvido</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prioridade
                  </label>
                  <select
                    multiple
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priority: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Categoria
                  </label>
                  <select
                    multiple
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      category: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Climatização">Climatização</option>
                    <option value="Iluminação">Iluminação</option>
                    <option value="Informática">Informática</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Segurança">Segurança</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Data de Criação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                    />
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
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  Limpar Filtros
                </button>
                <div className="text-sm text-gray-500">
                  {filteredTickets.length} de {tickets.length} chamados encontrados
                </div>
              </div>
            </div>
          )}
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
                          {ticket.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
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
                         <div className="flex items-center space-x-4 text-xs">
                           <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                             Criado: {ticket.created_at.toLocaleDateString('pt-BR')}
                           </span>
                           <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                             Atualizado: {ticket.updated_at.toLocaleDateString('pt-BR')}
                           </span>
                         </div>
                         
                         <div className="flex items-center space-x-2">
                           <button
                             onClick={() => router.push(`/pages/called/${ticket.id}`)}
                             className={`p-2 rounded-lg ${
                               theme === 'dark' 
                                 ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             } transition-colors`}
                           >
                             <FaEye />
                           </button>
                           <button
                             onClick={() => router.push(`/pages/called/${ticket.id}/edit`)}
                             className={`p-2 rounded-lg ${
                               theme === 'dark' 
                                 ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             } transition-colors`}
                           >
                             <FaEdit />
                           </button>
                           <button
                             onClick={() => router.push(`/pages/called/${ticket.id}/comments`)}
                             className={`p-2 rounded-lg ${
                               theme === 'dark' 
                                 ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             } transition-colors`}
                           >
                             <FaComments />
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
