'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])
  const [ticketsVersion, setTicketsVersion] = useState(0) // Forçar re-renderização
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
    deadline: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [isAgent, setIsAgent] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  // Listas usadas no modal de edição
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [availableAgents, setAvailableAgents] = useState<any[]>([])
  
  // Estados para funcionalidades de técnico
  const [acceptModal, setAcceptModal] = useState({ open: false, ticketId: null as null | number, ticket: null as any })
  const [rejectModal, setRejectModal] = useState({ open: false, ticketId: null as null | number, ticket: null as any })
  const [updateModal, setUpdateModal] = useState({ 
    open: false, 
    ticketId: null as null | number, 
    ticket: null as any,
    status: '',
    dueDate: '',
    report: '',
    attachments: [] as File[]
  })
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [closeConfirm, setCloseConfirm] = useState({ open: false, ticketId: null as null | number, statusToSet: '' as '' | 'Resolved' | 'Closed' })
  const [pinnedTicketId, setPinnedTicketId] = useState<number | null>(null)
  const [rejectedIds, setRejectedIds] = useState<number[]>([])

  // Função para normalizar strings (remover acentos e converter para minúsculas)
  const normalize = (value: string) => {
    try {
      return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    } catch {
      return value.toLowerCase()
    }
  }

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        // Verificar se o clique foi dentro de um dropdown
        const target = event.target as Element
        const dropdown = document.querySelector(`[data-dropdown-index="${openDropdown}"]`)
        const dropdownButton = document.querySelector(`[data-dropdown-button="${openDropdown}"]`)
        
        if (dropdown && (dropdown.contains(target) || dropdownButton?.contains(target))) {
          // Clique foi dentro do dropdown ou no botão, não fechar
          return
        }
        
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Carrega categorias quando abrir o modal de edição
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const token = authCookies.getToken()
        if (!token) return
        const res = await fetch(`${API_BASE}/helpdesk/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(data || [])
        }
      } catch {}
    }
    if (editModal.open) {
      loadCategories()
    }
  }, [editModal.open])

  // Carrega subcategorias e técnicos quando a categoria mudar no modal
  useEffect(() => {
    const loadSubsAndAgents = async () => {
      if (!editModal.open || !editModal.category_id) return
      try {
        const token = authCookies.getToken()
        if (!token) return
        const [subsRes, agentsRes] = await Promise.all([
          fetch(`${API_BASE}/helpdesk/categories/${editModal.category_id}/subcategories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/helpdesk/categories/${editModal.category_id}/agents`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])
        if (subsRes.ok) {
          const subs = await subsRes.json()
          setSubcategories(subs || [])
        } else {
          setSubcategories([])
        }
        if (agentsRes.ok) {
          const agents = await agentsRes.json()
          // Mapear para o id do usuário (assigned_to recebe user_id)
          setAvailableAgents(Array.isArray(agents) ? agents.map((a: any) => ({ id: a.user?.id, name: a.user?.name })) : [])
        } else {
          setAvailableAgents([])
        }
      } catch {
        setSubcategories([])
        setAvailableAgents([])
      }
    }
    loadSubsAndAgents()
  }, [editModal.open, editModal.category_id])

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
      const response = await fetch(`/helpdesk/agents/ticket/${ticketId}/accept`, {
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

      const response = await fetch(`/helpdesk/agents/tickets/${ticketId}/update`, {
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
      const createdCommentId = payload?.comment?.id as number | undefined

      // Se houver anexos selecionados no modal, enviar após a atualização
      try {
        if (Array.isArray(updateModal.attachments) && updateModal.attachments.length > 0) {
          const formDataFiles = new FormData()
          updateModal.attachments.forEach(file => {
            formDataFiles.append('files', file)
          })
          formDataFiles.append('ticketId', ticketId.toString())
          if (createdCommentId) {
            formDataFiles.append('commentId', String(createdCommentId))
          }
          const uploadRes = await fetch(`${API_BASE}/api/attachments/upload-multiple`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataFiles
          })
          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}))
            console.error('Falha ao enviar anexos do update:', errData)
          }
        }
      } catch (e) {
        console.error('Erro ao enviar anexos do update:', e)
      }

      const { toast } = await import('react-toastify')
      toast.success('Ticket atualizado com sucesso!')
      setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '', attachments: [] })
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

  // Upload de arquivos no modal de atualização do técnico
  const handleUpdateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return
    const files = Array.from(event.target.files)

    // Tamanho máximo 10MB
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024
      if (!isValidSize) alert(`Arquivo ${file.name} excede o tamanho máximo de 10MB`)
      return isValidSize
    })

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/zip', 'application/x-rar-compressed'
    ]
    const validTypeFiles = validFiles.filter(file => {
      const isValidType = allowedTypes.includes(file.type)
      if (!isValidType) alert(`Tipo de arquivo não suportado: ${file.name}`)
      return isValidType
    })

    setUpdateModal(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...validTypeFiles]
    }))
  }

  const removeUpdateFile = (index: number) => {
    setUpdateModal(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }))
  }

  // Função para carregar detalhes do ticket
  const loadTicketDetails = async (ticketId: number) => {
    try {
      const token = authCookies.getToken()
      if (!token) return
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

  // Helper para verificar se o usuário é admin
  const isUserAdmin = useMemo(() => {
    const role = (user?.role ?? user?.userRole ?? userRole ?? '').toString().toLowerCase()
    return role === 'admin' || role === 'administrator'
  }, [user, userRole])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        // Usar setTimeout para evitar que o mesmo clique que abre o dropdown o feche
        setTimeout(() => {
          // Verificar se o clique foi fora do dropdown
          const target = event.target as Element
          const dropdownElement = document.querySelector(`[data-dropdown-index="${openDropdown}"]`)
          const buttonElement = document.querySelector(`[data-dropdown-button="${openDropdown}"]`)
          
          if (dropdownElement && buttonElement) {
            const isClickInsideDropdown = dropdownElement.contains(target)
            const isClickOnButton = buttonElement.contains(target)
            
            if (!isClickInsideDropdown && !isClickOnButton) {
              console.log('🔍 Debug - Clique fora do dropdown detectado')
              setOpenDropdown(null)
            }
          }
        }, 0)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Log para debug do estado openDropdown
  useEffect(() => {
    console.log('🔍 Debug - Estado openDropdown mudou para:', openDropdown)
  }, [openDropdown])

  // Log para debug do estado viewModal
  useEffect(() => {
    console.log('🔍 Debug - Estado viewModal mudou para:', viewModal)
  }, [viewModal])

  // Função para exportar para Excel
  const exportToExcel = () => {
    // Criar dados para exportação
    const data = filteredTickets.map(ticket => ({
      'ID': ticket.ticket_number || ticket.id,
      'Título': ticket.title,
      'Descrição': ticket.description,
      'Status': ticket.status,
      'Prioridade': ticket.priority,
      'Solicitante': ticket.client?.name || ticket.requester || '-',
      'Técnico': ticket.assigned_agent?.name || ticket.technician || '-',
      'Categoria': ticket.category?.name || '-',
      'Subcategoria': ticket.subcategory?.name || '-',
      'Localização': ticket.location || '-',
      'Data de Criação': ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : '-',
      'Data de Atualização': ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('pt-BR') : '-',
      'Prazo': ticket.due_date ? new Date(ticket.due_date).toLocaleDateString('pt-BR') : '-',
      'Tags': ticket.tags?.join(', ') || '-'
    }))

    // Criar cabeçalho
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n')

    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `chamados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para exportar para PDF
  const exportToPDF = () => {
    // Criar conteúdo HTML para o PDF
    const content = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 2cm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { color: #666; font-size: 14px; margin-bottom: 10px; }
            .stats { margin-bottom: 20px; font-size: 14px; }
            .stats span { margin-right: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Chamados</h1>
            <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
            <div class="stats">
              <span><strong>Total de Chamados:</strong> ${filteredTickets.length}</span>
              <span><strong>Abertos:</strong> ${filteredTickets.filter(t => t.status === 'Open').length}</span>
              <span><strong>Em Andamento:</strong> ${filteredTickets.filter(t => t.status === 'InProgress').length}</span>
              <span><strong>Resolvidos:</strong> ${filteredTickets.filter(t => t.status === 'Resolved').length}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Solicitante</th>
                <th>Técnico</th>
                <th>Categoria</th>
                <th>Data de Criação</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTickets.map(ticket => `
                <tr>
                  <td>${ticket.ticket_number || ticket.id}</td>
                  <td>${ticket.title}</td>
                  <td>${ticket.status}</td>
                  <td>${ticket.priority}</td>
                  <td>${ticket.client?.name || ticket.requester || '-'}</td>
                  <td>${ticket.assigned_agent?.name || ticket.technician || '-'}</td>
                  <td>${ticket.category?.name || '-'}</td>
                  <td>${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Usar a API de impressão do navegador para gerar PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.focus()
      
      // Aguardar o carregamento e imprimir
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    } else {
      // Fallback: criar arquivo HTML para download
      const blob = new Blob([content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chamados_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Carregar tickets da API
  useEffect(() => {
    if (authLoading || !user) return

    const fetchTickets = async () => {
      try {
        const token = authCookies.getToken()
        if (!token) return

        console.log('🔍 Debug - Iniciando fetchTickets...')
        console.log('🔍 Debug - User:', user)
        
        // Verificar se é agent/tecnico
        const role = (user.role ?? user.userRole ?? '').toString().toLowerCase()
        console.log('🔍 Debug - User role definido:', {
          userRole: role,
          userRoleOriginal: user.role,
          userRoleAlt: user.userRole,
          userId: user.userId,
          user: user
        })
        setIsAgent(role === 'agent')
        setCurrentUserId(user.userId)
        setUserRole(role) // Definir o userRole corretamente
        
        // Forçar limpeza do cache
        console.log('🔍 Debug - Limpando cache de tickets...')
        setTickets([])
        setFilteredTickets([])

        // Para agentes, buscar tanto tickets disponíveis quanto atribuídos
        if (role === 'agent') {
          console.log('🔧 Carregando tickets (atribuidos + disponíveis) para agente...')
          
          const [assignedResponse, availableResponse] = await Promise.all([
            fetch(`/helpdesk/agents/my-tickets`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/helpdesk/agents/available-tickets`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
          ])

          const assignedData = assignedResponse.ok ? await assignedResponse.json() : { tickets: [] }
          const availableData = availableResponse.ok ? await availableResponse.json() : { tickets: [] }

          // Combinar e marcar tickets atribuídos
          const assignedTickets = (assignedData.tickets || []).map((t: any) => ({ ...t, isAssigned: true }))
          const availableTickets = (availableData.tickets || []).map((t: any) => ({ ...t, isAssigned: false }))
          
          const allTickets = [...assignedTickets, ...availableTickets]
          console.log('🔧 Tickets carregados para agente:', allTickets.length)
          setTickets(allTickets)
          setFilteredTickets(allTickets)
        } else {
          // Para outros usuários, buscar todos os tickets
          console.log('🔧 Carregando todos os tickets...')
          const res = await fetch('/helpdesk/tickets', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.message || 'Falha ao carregar chamados')
          }
          
          const data = await res.json()
          const items = Array.isArray(data) ? data : (data.tickets ?? [])
          console.log('🔧 Tickets carregados:', items.length)
          
          // Log detalhado dos tickets para debug
          items.forEach((ticket, index) => {
            console.log(`🔍 Debug - Ticket ${index + 1}:`, {
              id: ticket.id,
              ticket_number: ticket.ticket_number,
              assigned_to: ticket.assigned_to,
              status: ticket.status,
              client_id: ticket.client_id,
              client_user_id: ticket.client?.user?.id
            })
          })
          
          setTickets(items)
          setFilteredTickets(items)
          setTicketsVersion(prev => prev + 1) // Forçar re-renderização
        }
      } catch (e) {
        console.error('Erro ao carregar tickets:', e)
        // silencioso aqui; UX tratada por filtros e estados
      }
    }
    
    fetchTickets()
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      console.log('🔍 Debug - Página recebeu foco, recarregando tickets...')
      fetchTickets()
    }
    window.addEventListener('focus', handleFocus)
    
    // Adicionar um evento para recarregar os dados quando a página se tornar visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔍 Debug - Página se tornou visível, recarregando tickets...')
        fetchTickets()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authLoading, user])

  // Verificar se há um ticketId na URL para abrir o modal automaticamente
  const searchParams = useSearchParams()
  

  

  

  
  useEffect(() => {
    const ticketId = searchParams?.get('ticketId')
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === parseInt(ticketId))
      if (ticket) {
        // Abrir o modal de visualização do ticket
        setViewModal({ open: true, loading: true, ticket: null })
        
        // Carregar detalhes completos do ticket
        const loadTicketDetails = async () => {
          try {
            const token = typeof window !== 'undefined' ? authCookies.getToken() : null
            if (!token) return
            
            const res = await fetch(`/helpdesk/tickets/${ticketId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (res.ok) {
              const detailed = await res.json()
              setViewModal({ open: true, loading: false, ticket: detailed })
            } else {
              setViewModal({ open: false, loading: false, ticket: null })
            }
          } catch (error) {
            console.error('Erro ao carregar detalhes do ticket:', error)
            setViewModal({ open: false, loading: false, ticket: null })
          }
        }
        
        loadTicketDetails()
      }
    }
  }, [searchParams, tickets])

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
    const base = tickets.filter((t: any) => !(isAgent && !t.assigned_to && rejectedIds.includes(t.id)))

    const mappedTickets = base.map((t: any) => ({
      id: t.ticket_number || `#${t.id}`,
      title: t.title || 'Sem título',
      description: t.description || 'Sem descrição',
      status: mapStatusToPt(t.status || 'Open'),
      priority: mapPriorityToPt(t.priority || 'Medium'),
      category: t.category?.name || '-',
      location: t.location || t.client?.user?.department || '-',
      technician: t.assignee?.name || 'Não atribuído',
      requester: t.client?.user?.name || t.creator?.name || 'Não informado',
      category_id: t.category?.id || null,
      subcategory_id: t.subcategory?.id || null,
      assigned_to: t.assigned_to || null,
      createdAt: new Date(t.created_at || new Date()).toLocaleString('pt-BR'),
      updatedAt: new Date(t.modified_at || t.created_at || new Date()).toLocaleString('pt-BR'),
      estimatedTime: t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '-',
      actualTime: '-',
      tags: [t.category?.name].filter(Boolean),
      isAssigned: !!t.assigned_to, // Flag para identificar tickets atribuídos
      isAvailable: !t.assigned_to && (t.status === 'Open'), // Ticket disponível para aceitar
      assignmentRequestId: undefined, // ID da solicitação de atribuição
      originalTicket: t // Manter referência ao ticket original
    }))

    // Ordenar: ticket recém aceito fica fixo no topo; depois aceitos; depois por data
    return mappedTickets.sort((a: any, b: any) => {
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
    return tickets.filter((t: any) => t.assigned_to === currentUserId && activeStatuses.includes(t.status)).length
  }, [tickets, currentUserId])

  const statusOptions = [
    { value: 'all', label: t('tickets.filters.all'), color: 'gray' },
    { value: 'pendente', label: t('tickets.stats.pending'), color: 'red' },
    { value: 'em-andamento', label: t('tickets.stats.inProgress'), color: 'yellow' }
  ]

  const priorityOptions = [
    { value: 'all', label: t('tickets.filters.all'), color: 'gray' },
    { value: 'alta', label: t('tickets.filters.high'), color: 'red' },
    { value: 'media', label: t('tickets.filters.medium'), color: 'yellow' },
    { value: 'baixa', label: t('tickets.filters.low'), color: 'green' }
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

  // Chamados ativos (excluindo resolvidos e fechados)
  const openChamados = useMemo(() => {
    const filteredChamados = chamados.filter((chamado: any) => {
      // Filtrar apenas tickets que não estão concluídos (Resolved/Closed)
      const originalTicket = chamado.originalTicket
      const status = originalTicket?.status
      const isConcluded = status === 'Resolved' || status === 'Closed'
      
      // Log para debug
      if (isConcluded) {
        console.log('🔍 Debug - Ticket filtrado (concluído):', chamado.id, status)
      }
      
      // Verificar se o ticket existe e não está concluído
      return originalTicket && !isConcluded
    })
    
    console.log('🔍 Debug - Tickets filtrados:', filteredChamados.length, 'de', chamados.length)
    console.log('🔍 Debug - Status dos tickets restantes:', filteredChamados.map(c => ({ id: c.id, status: c.originalTicket?.status })))
    
    return filteredChamados.sort((a, b) => {
      // 1. Primeiro: Status (Pendente > Em Andamento > Concluído > Cancelado)
      const statusOrder = { 'Pendente': 0, 'Em Andamento': 1, 'Concluído': 2, 'Cancelado': 3 }
      const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4
      const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4
      
      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder
      }
      
      // 2. Segundo: Prioridade (Crítica > Alta > Média > Baixa)
      const priorityOrder = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 }
      const aPriorityOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4
      const bPriorityOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4
      
      if (aPriorityOrder !== bPriorityOrder) {
        return aPriorityOrder - bPriorityOrder
      }
      
      // 3. Terceiro: Tickets atribuídos aparecem antes dos não atribuídos
      if (a.isAssigned && !b.isAssigned) return -1
      if (!a.isAssigned && b.isAssigned) return 1
      
      // 4. Quarto: Por data de criação (mais recentes primeiro)
      return new Date(b.originalTicket.created_at).getTime() - new Date(a.originalTicket.created_at).getTime()
    });
  }, [chamados])

  // Para agentes, usar todos os chamados retornados pela API (já filtrados no backend)
  // Para admins, filtrar apenas chamados em aberto
  const filteredTicketsForAgent = useMemo(() => {
    if (!isAgent) return openChamados
    // Para agente, exibir apenas pendentes/em andamento (ativos) e disponíveis
    return openChamados
  }, [isAgent, chamados, openChamados])

  const filteredChamados = (isAgent ? filteredTicketsForAgent : openChamados).filter((chamado: any) => {
    const matchesStatus = selectedStatus === 'all' || 
      chamado.status.toLowerCase().includes(selectedStatus.replace('-', ' '))
    const matchesPriority = selectedPriority === 'all' || 
      normalize(chamado.priority) === selectedPriority
    const matchesSearch = chamado.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chamado.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chamado.id.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  const stats = {
    total: (isAgent ? filteredTicketsForAgent : openChamados).length,
    pendentes: (isAgent ? filteredTicketsForAgent : openChamados).filter((c: any) => c.status === 'Pendente').length,
    emAndamento: (isAgent ? filteredTicketsForAgent : openChamados).filter((c: any) => c.status === 'Em Andamento').length,
    resolvidos: (isAgent ? filteredTicketsForAgent : openChamados).filter((c: any) => c.status === 'Resolved').length,
    fechados: (isAgent ? filteredTicketsForAgent : openChamados).filter((c: any) => c.status === 'Closed').length,
    cancelados: (isAgent ? filteredTicketsForAgent : openChamados).filter((c: any) => c.status === 'Cancelled').length
  }

  // Helper para obter o ticket e o ID numérico a partir do ID exibido
  const getTicketAndIdByDisplay = (displayId: string): { ticket: any | undefined; id: number | null } => {
    console.log('🔍 Debug - getTicketAndIdByDisplay chamado com displayId:', displayId)
    console.log('🔍 Debug - tickets disponíveis:', tickets.length)
    
    // Primeiro, tentar encontrar por ticket_number exato
    const ticket = tickets.find(t => (t.ticket_number ?? `#${t.id}`) === displayId)
    console.log('🔍 Debug - ticket encontrado por ticket_number:', ticket)
    if (ticket) return { ticket, id: ticket.id }
    
    // Se não encontrou, tentar extrair o ID numérico do displayId
    let id: number | null = null
    
    // Remover # se existir e tentar converter para número
    const cleanDisplayId = displayId.replace('#', '')
    if (!isNaN(Number(cleanDisplayId))) {
      id = parseInt(cleanDisplayId)
    }
    
    console.log('🔍 Debug - id calculado:', id)
    
    // Buscar ticket pelo ID numérico
    const ticketById = id ? tickets.find(t => t.id === id) : undefined
    console.log('🔍 Debug - ticket encontrado por id:', ticketById)
    
    // Se ainda não encontrou, tentar buscar por correspondência parcial
    if (!ticketById) {
      const partialMatch = tickets.find(t => 
        t.ticket_number?.includes(displayId) || 
        displayId.includes(t.ticket_number || '') ||
        t.id.toString() === displayId
      )
      console.log('🔍 Debug - ticket encontrado por correspondência parcial:', partialMatch)
      if (partialMatch) return { ticket: partialMatch, id: partialMatch.id }
    }
    
    return { ticket: ticketById, id }
  }

  // Helper para verificar se o cliente pode editar o ticket
  const canClientEditTicket = (ticket: any): boolean => {
    if (!ticket) return false
    
    // Verificar se é cliente
    const isClient = userRole?.toLowerCase() === 'client' || userRole?.toLowerCase() === 'profissional'
    if (!isClient) return false
    
    // Verificar se é o dono do ticket
    const isTicketOwner = ticket.client?.user?.id === currentUserId
    if (!isTicketOwner) return false
    
    // Verificar se o ticket não está atribuído
    const isNotAssigned = !ticket.assigned_to
    if (!isNotAssigned) return false
    
    // Verificar se o status permite edição
    const allowedStatuses = ['Open', 'WaitingForClient', 'WaitingForThirdParty']
    const hasAllowedStatus = allowedStatuses.includes(ticket.status)
    if (!hasAllowedStatus) return false
    
    return true
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} overflow-x-hidden`}
    >
      {/* Header */}
      <div className={`mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} w-full max-w-full overflow-hidden`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 py-8 lg:py-4 w-full">
          <div className="mb-4 lg:mb-0 flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{isAgent ? t('called.title.agent') : t('called.title.admin')}</h1>
            <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} break-words`}>
              {isAgent ? t('called.subtitle.agent') : t('called.subtitle.admin')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
            <Link href="/pages/called/history" className="order-2 sm:order-1">
              <button
                className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
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
                <button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                  <FaPlus />
                  <span>{t('called.newTicket')}</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-full">
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
      <div className={`rounded-xl p-4 sm:p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} w-full max-w-full overflow-hidden`}>
        <div className="space-y-4 w-full">
          {/* Search */}
          <div className="relative w-full">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={t('called.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-3 w-full">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
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
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
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
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSearchTerm('');
                }}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border flex-1 lg:flex-none whitespace-nowrap ${
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
                  className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FaClipboardList className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FaChartBar className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>          

      {/* Chamados List */}
      <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} w-full max-w-full overflow-hidden`}>
        <div className={`p-4 sm:p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <h2 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}>
              {t('called.list.title')} ({filteredChamados.length})
            </h2>
            <div className="flex gap-2 flex-shrink-0">
              <button 
                onClick={exportToExcel}
                className={`p-1.5 sm:p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}
                title="Exportar para Excel"
              >
                <FaDownload className="w-4 h-4" />
              </button>
              <button 
                onClick={exportToPDF}
                className={`p-1.5 sm:p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}
                title="Exportar para PDF"
              >
                <FaPrint className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
          {viewMode === 'list' ? (
            <div className="space-y-4 w-full">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  onClick={async (e) => {
                    // Se o modal de edição estiver aberto, não abrir o modal de visualização
                    if (editModal.open) {
                      e.stopPropagation()
                      return
                    }
                    
                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                    if (!ticket) return
                    setViewModal({ open: true, loading: true, ticket: null })
                    try {
                      const token = authCookies.getToken()
                      if (!token) throw new Error('Sessão expirada')
                      const res = await fetch(`/helpdesk/tickets/${ticket.id}`, {
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
                  className={`ticket-card rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg w-full max-w-full overflow-hidden cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-4 w-full">
                    {/* Header do Card */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
                      <div className="flex-1 min-w-0">
                        {/* Tags e Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`font-bold text-base sm:text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}
                            title="ID do chamado"
                          >
                            {chamado.id}
                          </span>
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(chamado.status)} flex-shrink-0`}
                            title="Status do chamado"
                          >
                            {chamado.status}
                          </span>
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPriorityColor(chamado.priority)} flex-shrink-0`}
                            title="Prioridade do chamado"
                          >
                            {chamado.priority}
                          </span>
                          {chamado.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                              }`}
                              title="Categoria"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Título e Descrição */}
                        <h3 className={`text-base sm:text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}>
                          {chamado.title}
                        </h3>
                        
                        <p className={`text-sm mb-4 line-clamp-2 break-words ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}> 
                          {chamado.description}
                        </p>

                        {/* Informações do Chamado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center space-x-2 min-w-0">
                            <FaUser className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.requester')}</strong> {chamado.requester}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <FaTools className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.technician')}</strong> {chamado.technician}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <FaMapMarkerAlt className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.location')}</strong> {chamado.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <FaClock className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="hidden sm:inline">{t('called.labels.time')}</strong> {chamado.estimatedTime}
                            </span>
                          </div>
                        </div>

                        {/* Footer do Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 gap-3 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs flex-1 min-w-0">
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                              {t('called.labels.createdAt')} {chamado.createdAt}
                            </span>
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                              {t('called.labels.updatedAt')} {chamado.updatedAt}
                            </span>
                          </div>
                        
                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
                                  const res = await fetch(`/helpdesk/tickets/${ticket.id}`, {
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
                              title="Visualizar detalhes"
                            >
                              <FaEye className="text-sm" />
                            </button>

                            {/* Botões específicos para técnicos - tickets disponíveis */}
                            {isAgent && !chamado.isAssigned && chamado.isAvailable && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
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
                                  onClick={(e) => {
                                    e.stopPropagation()
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                  if (ticket) {
                                    setUpdateModal({ 
                                      open: true, 
                                      ticketId: ticket.id, 
                                      ticket: ticket,
                                      status: ticket.status || 'Open',
                                      dueDate: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
                                      report: '',
                                      attachments: []
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

                            {/* Edição pelo Cliente (dono) enquanto não atribuído */}
                            {(userRole?.toLowerCase() === 'client' || userRole?.toLowerCase() === 'profissional') && (() => {
                              const { ticket } = getTicketAndIdByDisplay(chamado.id)
                              
                              // Usar a função helper para verificar permissões
                              const canEdit = canClientEditTicket(ticket)
                              
                              // Forçar re-renderização baseada na versão dos tickets e status
                              const key = `edit-${chamado.id}-${ticketsVersion}-${canEdit}-${ticket?.assigned_to}-${ticket?.status}`
                              
                              console.log('🔍 Debug - Verificação canEdit com helper:', {
                                chamadoId: chamado.id,
                                ticketExists: !!ticket,
                                assignedTo: ticket?.assigned_to,
                                status: ticket?.status,
                                clientUserId: ticket?.client?.user?.id,
                                currentUserId,
                                canEdit,
                                ticketFull: ticket,
                                userRole: userRole
                              })
                              
                              // Se não pode editar, não renderizar o botão
                              if (!canEdit) {
                                console.log('🔍 Debug - Botão de edição NÃO renderizado para:', chamado.id, 'Motivo: Cliente não pode editar este ticket')
                                return null
                              }
                              
                              console.log('🔍 Debug - Botão de edição SERÁ renderizado para:', chamado.id)
                              return (
                                <button
                                  key={key}
                                  onClick={(e) => {
                                    console.log('🔍 Debug - Botão editar clicado, stopPropagation chamado')
                                    e.stopPropagation()
                                    e.preventDefault()
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
                                      deadline: ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,16) : ''
                                    })
                                  }}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark'
                                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  } transition-colors`}
                                  title="Editar"
                                >
                                  <FaEdit />
                                </button>
                              )
                            })()}

                            {/* Botões apenas para Admin */}
                            {isUserAdmin && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
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
                                  onClick={(e) => {
                                    e.stopPropagation()
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {filteredChamados.map((chamado, index) => (
                <div
                  key={index}
                  onClick={async (e) => {
                    // Se o modal de edição estiver aberto, não abrir o modal de visualização
                    if (editModal.open) {
                      e.stopPropagation()
                      return
                    }
                    
                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                    if (!ticket) return
                    setViewModal({ open: true, loading: true, ticket: null })
                    try {
                      const token = authCookies.getToken()
                      if (!token) throw new Error('Sessão expirada')
                      const res = await fetch(`/helpdesk/tickets/${ticket.id}`, {
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
                  className={`ticket-card rounded-xl p-4 border transition-all duration-300 hover:shadow-lg w-full max-w-full overflow-hidden cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Header do Card Grid */}
                  <div className="flex items-center justify-between mb-3 w-full">
                    <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words flex-1 min-w-0`}>
                      {chamado.id}
                    </span>
                    <div className="relative flex-shrink-0" style={{ position: 'relative' }}>
                                            <button
                        data-dropdown-button={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('🔍 Debug - Clicou no botão de três pontinhos, index:', index)
                          console.log('🔍 Debug - openDropdown atual:', openDropdown)
                          setOpenDropdown(openDropdown === index ? null : index)
                        }}
                        className={`p-1.5 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        <FaEllipsisV className="text-xs" />
                      </button>
                      
                      {openDropdown === index && (
                        <div 
                          data-dropdown-index={index}
                          className={`absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg border z-[9999] ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-200'
                          }`}>
                          {(() => {
                            console.log('🔍 Debug - Renderizando dropdown para index:', index)
                            return null
                          })()}
                          <div className="py-1">
                                                                                     <button
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                if (!ticket) return
                                setViewModal({ open: true, loading: true, ticket: null })
                                try {
                                  const token = authCookies.getToken()
                                  if (!token) throw new Error('Sessão expirada')
                                  const res = await fetch(`/helpdesk/tickets/${ticket.id}`, {
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
                                } finally {
                                  setOpenDropdown(null)
                                }
                              }}
                               className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                 theme === 'dark' 
                                   ? 'text-gray-300 hover:bg-gray-600' 
                                   : 'text-gray-700 hover:bg-gray-100'
                               } transition-colors`}
                             >
                               <FaEye className="w-3 h-3" />
                               <span>Visualizar</span>
                             </button>
                            
                            {isUserAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
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
                                      deadline: ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,16) : ''
                                    })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-gray-300 hover:bg-gray-600' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaEdit className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                            )}

                            {/* Botões específicos para técnicos */}
                            {isAgent && !chamado.isAssigned && chamado.isAvailable && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('🔍 Debug - Clicou em Aceitar para chamado:', chamado.id)
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      console.log('🔍 Debug - Ticket encontrado, abrindo modal de aceitar')
                                      setAcceptModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    } else {
                                      console.log('🔍 Debug - Ticket não encontrado')
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                    theme === 'dark' 
                                      ? 'text-green-400 hover:bg-gray-600' 
                                      : 'text-green-600 hover:bg-gray-100'
                                  } transition-colors`}
                                >
                                  <FaCheckCircle className="w-3 h-3" />
                                  <span>Aceitar</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('🔍 Debug - Clicou em Recusar para chamado:', chamado.id)
                                    const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                    if (ticket) {
                                      console.log('🔍 Debug - Ticket encontrado, abrindo modal de recusar')
                                      setRejectModal({ open: true, ticketId: ticket.id, ticket: ticket })
                                    } else {
                                      console.log('🔍 Debug - Ticket não encontrado')
                                    }
                                    setOpenDropdown(null)
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                    theme === 'dark' 
                                      ? 'text-red-400 hover:bg-gray-600' 
                                      : 'text-red-600 hover:bg-gray-100'
                                  } transition-colors`}
                                >
                                  <FaTimes className="w-3 h-3" />
                                  <span>Recusar</span>
                                </button>
                              </>
                            )}

                            {isAgent && chamado.isAssigned && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('🔍 Debug - Clicou em Atualizar para chamado:', chamado.id)
                                  const { ticket } = getTicketAndIdByDisplay(chamado.id)
                                  if (ticket) {
                                    console.log('🔍 Debug - Ticket encontrado, abrindo modal de atualizar')
                                    setUpdateModal({ 
                                      open: true, 
                                      ticketId: ticket.id, 
                                      ticket: ticket,
                                      status: ticket.status || 'Open',
                                      dueDate: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
                                      report: '',
                                      attachments: []
                                    })
                                  } else {
                                    console.log('🔍 Debug - Ticket não encontrado')
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-blue-400 hover:bg-gray-600' 
                                    : 'text-blue-600 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaEdit className="w-3 h-3" />
                                <span>Atualizar</span>
                              </button>
                            )}

                            {/* Edição pelo Cliente (dono) enquanto não atribuído - Grid */}
                            {(userRole?.toLowerCase() === 'client' || userRole?.toLowerCase() === 'profissional') && (() => {
                              const { ticket } = getTicketAndIdByDisplay(chamado.id)
                              
                              // Usar a função helper para verificar permissões
                              const canEdit = canClientEditTicket(ticket)
                              
                              // Forçar re-renderização baseada na versão dos tickets e status
                              const key = `edit-grid-${chamado.id}-${ticketsVersion}-${canEdit}-${ticket?.assigned_to}-${ticket?.status}`
                              
                              console.log('🔍 Debug - Verificação canEdit com helper (Grid):', {
                                chamadoId: chamado.id,
                                ticketExists: !!ticket,
                                assignedTo: ticket?.assigned_to,
                                status: ticket?.status,
                                clientUserId: ticket?.client?.user?.id,
                                currentUserId,
                                canEdit,
                                ticketFull: ticket,
                                userRole: userRole
                              })
                              
                              // Se não pode editar, não renderizar o botão
                              if (!canEdit) {
                                console.log('🔍 Debug - Botão de edição NÃO renderizado para (Grid):', chamado.id, 'Motivo: Cliente não pode editar este ticket')
                                return null
                              }
                              
                              console.log('🔍 Debug - Botão de edição SERÁ renderizado para (Grid):', chamado.id)
                              return (
                                <button
                                  key={key}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
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
                                      deadline: ticket.due_date ? new Date(ticket.due_date).toISOString().slice(0,16) : ''
                                    })
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                    theme === 'dark' 
                                      ? 'text-gray-300 hover:bg-gray-600' 
                                      : 'text-gray-700 hover:bg-gray-100'
                                  } transition-colors`}
                                >
                                  <FaEdit className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                              )
                            })()}

                            {/* Botão de excluir apenas para Admin */}
                            {isUserAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const { ticket, id } = getTicketAndIdByDisplay(chamado.id)
                                  const numericId = ticket?.id ?? id
                                  if (numericId) {
                                    setDeleteModal({ open: true, ticketId: numericId, displayId: chamado.id, title: chamado.title })
                                  }
                                  setOpenDropdown(null)
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 ${
                                  theme === 'dark' 
                                    ? 'text-red-400 hover:bg-gray-600' 
                                    : 'text-red-600 hover:bg-gray-100'
                                } transition-colors`}
                              >
                                <FaTrash className="w-3 h-3" />
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Título e Status */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-1`}>
                      {chamado.title}
                    </h3>
                    {chamado.isAssigned && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700 flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Descrição */}
                  <p className={`text-xs mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {chamado.description}
                  </p>

                  {/* Status e Prioridade */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(chamado.status)}`}>
                      {chamado.status}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(chamado.priority)}`}>
                      {chamado.priority}
                    </span>
                  </div>

                  {/* Informações Compactas */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <FaUser className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chamado.technician}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaMapMarkerAlt className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {chamado.location}
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewModal({ open: false, loading: false, ticket: null })} />
          <div className={`relative w-full max-w-4xl max-h-[90vh] sm:max-h-[95vh] rounded-lg sm:rounded-2xl shadow-xl flex flex-col ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            {/* Header do Modal */}
            <div className={`p-3 sm:p-4 md:p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base sm:text-lg md:text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}>
                    {viewModal.ticket?.title}
                  </h3>
                  <div className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} break-words mt-1`}>
                    {t('called.labels.number')} {viewModal.ticket?.ticket_number ?? `#${viewModal.ticket?.id}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(mapStatusToPt(viewModal.ticket?.status))}`}>
                      {mapStatusToPt(viewModal.ticket?.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(mapPriorityToPt(viewModal.ticket?.priority))}`}>
                      {mapPriorityToPt(viewModal.ticket?.priority)}
                    </span>
                  </div>
                  {/* Botão de fechar no header para mobile */}
                  <button 
                    onClick={() => setViewModal({ open: false, loading: false, ticket: null })} 
                    className={`sm:hidden p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo do Modal com Scroll */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-3 sm:p-4 md:p-6">
                {viewModal.loading ? (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('common.loading')}
                  </div>
                ) : viewModal.ticket ? (
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
                    {/* Descrição */}
                    <div>
                      <h4 className={`font-semibold mb-1 sm:mb-2 text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Descrição
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words leading-relaxed`}>
                        {viewModal.ticket.description}
                      </p>
                    </div>

                    {/* Informações Principais */}
                    <div>
                      <h4 className={`font-semibold mb-1 sm:mb-2 md:mb-3 text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Informações do Chamado
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 md:gap-3 lg:gap-4 text-xs sm:text-sm">
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>{t('called.labels.requester')}:</strong> {viewModal.ticket.client?.user?.name ?? viewModal.ticket.creator?.name ?? '-'}
                        </div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>{t('called.labels.technician')}:</strong> {viewModal.ticket.assignee?.name ?? '-'}
                        </div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>Categoria:</strong> {viewModal.ticket.category?.name ?? '-'}
                        </div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>Subcategoria:</strong> {viewModal.ticket.subcategory?.name ?? '-'}
                        </div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>{t('called.labels.createdAt')}:</strong> {new Date(viewModal.ticket.created_at).toLocaleString('pt-BR')}
                        </div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                          <strong>{t('called.labels.updatedAt')}:</strong> {new Date(viewModal.ticket.modified_at ?? viewModal.ticket.created_at).toLocaleString('pt-BR')}
                        </div>
                        {viewModal.ticket.due_date && (
                          <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                            <strong>{t('called.labels.deadline')}:</strong> {new Date(viewModal.ticket.due_date).toLocaleString('pt-BR')}
                          </div>
                        )}
                        {typeof viewModal.ticket.resolution_time === 'number' && (
                          <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                            <strong>{t('called.labels.resolutionTime')}:</strong> {viewModal.ticket.resolution_time} min
                          </div>
                        )}
                        {typeof viewModal.ticket.satisfaction_rating === 'number' && (
                          <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                            <strong>{t('called.labels.customerSatisfaction')}:</strong> {viewModal.ticket.satisfaction_rating}/5
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Anexos */}
                    {Array.isArray(viewModal.ticket.attachments) && viewModal.ticket.attachments.length > 0 && (
                      <div>
                        <h4 className={`font-semibold mb-1 sm:mb-2 md:mb-3 text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('called.attachments')} ({viewModal.ticket.attachments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 md:gap-3">
                          {viewModal.ticket.attachments.map((att: any) => {
                            const isImage = (att.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.original_name || '')
                            const viewUrl = `${API_BASE}/api/attachments/view/${att.id}`
                            const downloadUrl = `${API_BASE}/api/attachments/download/${att.id}`
                            const comments = Array.isArray(viewModal.ticket.comments) ? viewModal.ticket.comments : []
                            const uploaderComment = comments.find((c: any) => Array.isArray(c.attachments) && c.attachments.some((a: any) => a.id === att.id))
                            const clientUserId = viewModal.ticket.client?.user?.id
                            const assigneeUserId = viewModal.ticket.assignee?.id
                            let uploaderName = ''
                            let uploaderType = ''
                            if (uploaderComment && uploaderComment.user) {
                              uploaderName = uploaderComment.user.name || 'Usuário'
                              if (clientUserId && uploaderComment.user.id === clientUserId) uploaderType = 'Cliente'
                              else if (assigneeUserId && uploaderComment.user.id === assigneeUserId) uploaderType = 'Técnico'
                              else uploaderType = 'Usuário'
                            } else {
                              const attCreated = att.created_at ? new Date(att.created_at) : null
                              const ticketCreated = viewModal.ticket.created_at ? new Date(viewModal.ticket.created_at) : null
                              const isNearCreation = attCreated && ticketCreated ? Math.abs(attCreated.getTime() - ticketCreated.getTime()) <= (5 * 60 * 1000) : false
                              if (isNearCreation && viewModal.ticket.client?.user?.name) {
                                uploaderName = viewModal.ticket.client.user.name
                                uploaderType = 'Cliente'
                              } else if (viewModal.ticket.assignee?.name) {
                                uploaderName = viewModal.ticket.assignee.name
                                uploaderType = 'Técnico'
                              } else if (viewModal.ticket.creator?.name) {
                                uploaderName = viewModal.ticket.creator.name
                                uploaderType = 'Usuário'
                              } else {
                                uploaderName = '—'
                                uploaderType = 'Usuário'
                              }
                            }
                            return (
                              <div key={att.id} className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-2`}>
                                {isImage ? (
                                  <button 
                                    onClick={() => setImagePreview({ open: true, src: viewUrl, name: att.original_name || att.filename })} 
                                    className="block w-full"
                                  >
                                    <img 
                                      src={viewUrl} 
                                      alt={att.original_name || att.filename} 
                                      className="w-full h-20 sm:h-24 object-cover rounded" 
                                    />
                                  </button>
                                ) : (
                                  <div className={`h-20 sm:h-24 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>
                                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-xs`}>
                                      {t('common.file')}
                                    </span>
                                  </div>
                                )}
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span 
                                      className={`truncate flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} 
                                      title={att.original_name || att.filename}
                                    >
                                      {att.original_name || att.filename}
                                    </span>
                                    <a 
                                      href={downloadUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-blue-600 hover:underline flex-shrink-0 ml-1"
                                    >
                                      {t('common.download')}
                                    </a>
                                  </div>
                                  <div className={`mt-1 text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    por <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{uploaderName}</span> ({uploaderType})
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Comentários */}
                                          {viewModal.ticket.comments?.length > 0 && (
                        <div>
                          <h4 className={`font-semibold mb-1 sm:mb-2 md:mb-3 text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('called.comments')} ({viewModal.ticket.comments.length})
                          </h4>
                          <div className="space-y-1 sm:space-y-2 md:space-y-3 max-h-32 sm:max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto pr-2">
                            {viewModal.ticket.comments.map((c: any) => (
                              <div key={c.id} className={`rounded-lg p-2 sm:p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(c.created_at).toLocaleString('pt-BR')}
                                </span>
                                {c.user && (
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {c.user.name}
                                  </span>
                                )}
                              </div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words leading-relaxed`}>
                                {c.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico */}
                                          {viewModal.ticket.ticket_history?.length > 0 && (
                        <div>
                          <h4 className={`font-semibold mb-1 sm:mb-2 md:mb-3 text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('called.history')} ({viewModal.ticket.ticket_history.length})
                          </h4>
                          <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto pr-2 text-xs sm:text-sm">
                            {viewModal.ticket.ticket_history.map((h: any) => (
                              <div key={h.id} className={`rounded-lg p-2 sm:p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} break-words flex-1`}>
                                  <strong>{h.field_name}:</strong> {h.old_value ?? '—'} → {h.new_value ?? '—'}
                                </span>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0`}>
                                  {new Date(h.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className={`hidden sm:block p-3 sm:p-4 md:p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0 bg-inherit`}>
              <div className="flex justify-end">
                <button 
                  onClick={() => setViewModal({ open: false, loading: false, ticket: null })} 
                  className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium`}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox simples para imagens de anexos */}
      {imagePreview.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6">
          <div className="absolute inset-0 bg-black/90" onClick={() => setImagePreview({ open: false, src: '', name: '' })} />
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <img 
              src={imagePreview.src} 
              alt={imagePreview.name} 
              className="w-full h-auto max-h-[95vh] object-contain rounded shadow-2xl" 
            />
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button 
                onClick={() => setImagePreview({ open: false, src: '', name: '' })} 
                className="px-3 py-2 bg-white/90 text-gray-800 rounded shadow-lg hover:bg-white transition-colors text-sm font-medium"
              >
                Fechar
              </button>
              <a 
                href={imagePreview.src} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-2 bg-blue-600/90 text-white rounded shadow-lg hover:bg-blue-600 transition-colors text-sm font-medium text-center"
              >
                Abrir
              </a>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black/70 text-white px-3 py-2 rounded text-sm truncate">
                {imagePreview.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição (Admin) */}
      {editModal.open && (() => {
        // Verificar se o ticket atual pode ser editado
        const currentTicket = tickets.find(t => t.id === editModal.ticketId)
        const canEdit = isUserAdmin || (currentTicket && canClientEditTicket(currentTicket))
        
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={async () => {
              if (!isSaving) {
                setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, deadline: '' })
              }
            }} />
            <div className={`relative w-full max-w-xl rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="p-6">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Editar chamado</h3>
                
                {/* Aviso se o ticket não pode ser editado */}
                {!canEdit && currentTicket && (
                  <div className={`mt-4 p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <div className="flex items-center space-x-2">
                      <FaExclamationTriangle className="flex-shrink-0" />
                      <div>
                        <p className="font-medium">Este chamado não pode ser editado</p>
                        <p className="text-sm mt-1">
                          {currentTicket.assigned_to 
                            ? 'O chamado já foi aceito por um técnico e não pode mais ser modificado.'
                            : 'Você não tem permissão para editar este chamado.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                                )}
                
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
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Categoria</label>
                    <select value={editModal.category_id} onChange={(e) => setEditModal(prev => ({ ...prev, category_id: Number(e.target.value), subcategory_id: undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value={0}>Selecione...</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subcategoria</label>
                    <select value={editModal.subcategory_id ?? ''} onChange={(e) => setEditModal(prev => ({ ...prev, subcategory_id: e.target.value ? Number(e.target.value) : undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} disabled={!editModal.category_id}>
                      <option value="">Selecione...</option>
                      {subcategories.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Atribuído ao técnico</label>
                    <select value={editModal.assigned_to ?? ''} onChange={(e) => setEditModal(prev => ({ ...prev, assigned_to: e.target.value ? Number(e.target.value) : undefined }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} disabled={!editModal.category_id}>
                      <option value="">Selecione...</option>
                      {availableAgents.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Prazo (due date)</label>
                  <input type="datetime-local" value={editModal.deadline} onChange={(e) => setEditModal(prev => ({ ...prev, deadline: e.target.value }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button                 disabled={isSaving} onClick={async () => {
                  setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, deadline: '' })
                }} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg transition-colors disabled:opacity-60`}>Cancelar</button>
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    if (!editModal.ticketId) return
                    
                    // Verificação adicional de segurança antes de enviar
                    const currentTicket = tickets.find(t => t.id === editModal.ticketId)
                    if (currentTicket && !canClientEditTicket(currentTicket)) {
                      const { toast } = await import('react-toastify')
                      toast.error('Este chamado não pode mais ser editado. Já foi aceito por um técnico.')
                      setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, deadline: '' })
                      return
                    }
                    
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
                                        setEditModal({ open: false, ticketId: null, title: '', description: '', status: 'Open', priority: 'Medium', category_id: 0, subcategory_id: undefined, assigned_to: undefined, deadline: '' })
                      
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
        )
      })()}

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
          <div className="absolute inset-0 bg-black/50" onClick={() => !isUpdating && setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '', attachments: [] })} />
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

                {/* Upload de anexos (opcional) */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Anexos (opcional)
                  </label>
                  <div className={`${theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'} border-2 border-dashed rounded-lg p-4 text-center`}>
                    <input
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.mp4,.avi,.mov,.wmv,.zip,.rar"
                      onChange={handleUpdateFileUpload}
                    />
                    {Array.isArray(updateModal.attachments) && updateModal.attachments.length > 0 && (
                      <div className="mt-3 space-y-2 text-left">
                        {updateModal.attachments.map((file, idx) => (
                          <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} text-sm truncate`}>{file.name}</span>
                            <button onClick={() => removeUpdateFile(idx)} className={`p-1 rounded ${theme === 'dark' ? 'text-gray-300 hover:bg-red-600 hover:text-white' : 'text-gray-600 hover:bg-red-600 hover:text-white'}`}>
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={isUpdating}
                  onClick={() => setUpdateModal({ open: false, ticketId: null, ticket: null, status: '', dueDate: '', report: '', attachments: [] })}
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
