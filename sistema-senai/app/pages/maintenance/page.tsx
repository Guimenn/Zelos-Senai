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
import { useI18n } from '../../../contexts/I18nContext'
import { toast } from 'react-toastify'

export default function MaintenancePage() {
  const { theme } = useTheme()
  const { t } = useI18n()
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
         alert(t('maintenance.avatar.fileTypeError'))
         return
       }
       
       // Validar tamanho (máximo 5MB)
       if (file.size > 5 * 1024 * 1024) {
         alert(t('maintenance.avatar.fileSizeError'))
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
                 if (!res.ok) throw new Error(data?.message || t('maintenance.errors.loadTechnicians'))
        

        
        const mapped = (data?.agents || []).map((a: any) => {
          // Converter skills de string para array se necessário
          const skills: string[] = Array.isArray(a.skills) ? a.skills : (a.skills ? a.skills.split(',').map((s: string) => s.trim()) : [])
          // Extrair extras serializados
          const certifications = skills.filter((s) => s.startsWith('CERT:')).map((s) => s.replace('CERT:', ''))
          const experience = skills.find((s) => s.startsWith('EXP:'))?.replace('EXP:', '') || '-'
          const availability = skills.find((s) => s.startsWith('AVAIL:'))?.replace('AVAIL:', '') || '-'
          const urgency = skills.find((s) => s.startsWith('URGENCY:'))?.replace('URGENCY:', '') || '-'
          // Usar subcategoria primária como especialidade
                     const specialty = a.primary_subcategory ? a.primary_subcategory.name : (skills.find((s) => !s.startsWith('CERT:') && !s.startsWith('EXP:') && !s.startsWith('AVAIL:') && !s.startsWith('URGENCY:')) || t('maintenance.defaultSpecialty'))

        

          return {
            agentId: a.id,
            userId: a.user?.id,
            displayId: a.employee_id ?? `AG-${a.id}`,
            name: a.user?.name ?? 'Sem nome',
            email: a.user?.email ?? '-',
            phone: a.user?.phone ?? '-',
                         department: a.department ?? t('maintenance.defaultDepartment'),
            specialty,
            status: a.user?.is_active ? 'Disponível' : 'Indisponível',
            experience: experience === '-' ? '-' : `${experience} anos`,
            rating: a.evaluationStats?.averageRating || 0,
            completedJobs: a._count?.ticket_assignments ?? 0,
            activeJobs: 0,
            location: a.user?.address || '-',
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
            is_active: a.user?.is_active ?? true,
          }
        })
        
        setTechnicians(mapped)
             } catch (e: any) {
         setLoadError(e?.message || t('maintenance.errors.loadTechnicians'))
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
    { value: 'all', label: t('maintenance.departments.all') },
    { value: 'equipamentos', label: t('maintenance.departments.equipment') },
    { value: 'climatizacao', label: t('maintenance.departments.climatization') },
    { value: 'iluminacao', label: t('maintenance.departments.lighting') },
    { value: 'informatica', label: t('maintenance.departments.it') }
  ]

  const statusOptions = [
    { value: 'all', label: t('technicians.filters.allStatus') },
    { value: 'disponivel', label: 'Disponível' },
    { value: 'em-trabalho', label: 'Em Trabalho' },
    { value: 'indisponivel', label: 'Indisponível' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'Em Trabalho':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'Indisponível':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  // Função específica para cores de status de tickets/trabalhos
  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
      case 'Aberto':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case 'InProgress':
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'Resolved':
      case 'Resolvido':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'Closed':
      case 'Fechado':
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
      case 'Cancelled':
      case 'Cancelado':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  // Função para traduzir status de tickets para português
  const translateTicketStatus = (status: string) => {
    switch (status) {
      case 'Open':
        return 'Aberto'
      case 'InProgress':
        return 'Em Andamento'
      case 'Resolved':
        return 'Resolvido'
      case 'Closed':
        return 'Fechado'
      case 'Cancelled':
        return 'Cancelado'
      default:
        return status
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
    disponiveis: technicians.filter(tech => tech.status === 'Disponível').length,
    emTrabalho: technicians.filter(tech => tech.status === 'Em Trabalho').length,
    totalJobs: technicians.reduce((sum, tech) => sum + (Number(tech.completedJobs) || 0), 0)
  }

  const handleDelete = async (agentId: number) => {
    // Garantir autenticação
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
    if (!token) {
      setActionError(t('maintenance.errors.authRequired'))
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
           setActionError(t('maintenance.errors.sessionExpired'))
           return
         }
         if (res.status === 403) {
           setActionError(t('maintenance.errors.noPermission'))
           return
         }
         const data = await res.json().catch(() => ({}))
         throw new Error(data?.message || t('maintenance.errors.deleteTechnician'))
      }
      // Remover da lista
      setTechnicians(prev => prev.filter((tech: any) => tech.agentId !== agentId))
         } catch (e: any) {
       setActionError(e?.message || t('maintenance.errors.deleteTechnician'))
     } finally {
      setActionLoadingId(null)
    }
  }

  const handleEdit = async (agentId: number, updates: Partial<any>) => {
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
    if (!token) {
      setActionError(t('maintenance.errors.authRequired'))
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
          setActionError(t('maintenance.errors.sessionExpired'))
          return
        }
        if (res.status === 403) {
          setActionError(t('maintenance.errors.noPermission'))
          return
        }
        throw new Error(data?.message || t('maintenance.errors.updateTechnician'))
      }
      // Recarregar lista rapidamente e refletir status/campos
      setTechnicians(prev => prev.map((tech: any) => (tech.agentId === agentId) ? { ...tech, ...updates, status: typeof updates.is_active === 'boolean' ? (updates.is_active ? 'Disponível' : 'Indisponível') : tech.status } : tech))
    } catch (e: any) {
      setActionError(e?.message || t('maintenance.errors.updateTechnician'))
    } finally {
      setActionLoadingId(null)
    }
  }

  // Função para alternar status do técnico (ativar/desativar)
  const handleToggleStatus = async (technician: any) => {
    const token = typeof window !== 'undefined' ? authCookies.getToken() : null
    if (!token) {
      setActionError(t('maintenance.errors.authRequired'))
      return
    }
    
    setActionError(null)
    setActionLoadingId(technician.agentId)
    
    try {
      const res = await fetch(`/admin/user/${technician.userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          setActionError(t('maintenance.errors.sessionExpired'))
          return
        }
        if (res.status === 403) {
          setActionError(t('maintenance.errors.noPermission'))
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Erro ao alternar status do técnico')
      }
      
      const data = await res.json()
      
      // Atualizar o status na lista local
      setTechnicians(prev => prev.map((tech: any) => 
        tech.agentId === technician.agentId 
          ? { 
              ...tech, 
              status: data.user.is_active ? 'Disponível' : 'Indisponível',
              is_active: data.user.is_active
            } 
          : tech
      ))
      
      // Mostrar mensagem de sucesso com toast
      toast.success(data.user.is_active ? t('maintenance.toggleStatus.activated') : t('maintenance.toggleStatus.deactivated'))
      
    } catch (e: any) {
      setActionError(e?.message || 'Erro ao alternar status do técnico')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Preparar opções quando abrir o modal de edição
  useEffect(() => {
    if (!editModalOpen || !currentTechnician) return

    // Departamentos a partir dos técnicos carregados
    const uniqueDeps = Array.from(new Set((technicians || []).map((tech: any) => (tech.department || '').toString().trim()).filter(Boolean)))
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
        const skillsArr = Array.isArray(currentTechnician.skills) ? currentTechnician.skills : (currentTechnician.skills ? currentTechnician.skills.split(',').map((s: string) => s.trim()) : [])
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

     // Função para exportar para Excel
   const exportToExcel = () => {
     // Criar dados para exportação
     const data = filteredTechnicians.map(tech => ({
       'ID': tech.displayId,
       'Nome': tech.name,
       'Email': tech.email,
       'Telefone': tech.phone,
       'Departamento': tech.department,
       'Especialidade': tech.specialty,
       'Status': tech.status,
       'Experiência': tech.experience,
       'Avaliação': (Number(tech.rating) || 0).toFixed(1),
       'Serviços Concluídos': Number(tech.completedJobs) || 0,
       'Serviços Ativos': tech.activeJobs,
       'Disponibilidade': tech.availability || '-',
       'Urgência': tech.urgency || '-',
       'Categorias': tech.categories?.map((c: any) => c.name).join(', ') || '-'
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
     link.setAttribute('download', `tecnicos_${new Date().toISOString().split('T')[0]}.csv`)
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
             <h1>Relatório de Técnicos</h1>
             <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
                           <div class="stats">
                <span><strong>Total de Técnicos:</strong> ${filteredTechnicians.length}</span>
                <span><strong>Disponíveis:</strong> ${filteredTechnicians.filter(tech => tech.status === 'Disponível').length}</span>
                <span><strong>Em Trabalho:</strong> ${filteredTechnicians.filter(tech => tech.status === 'Em Trabalho').length}</span>
              </div>
           </div>
           <table>
             <thead>
               <tr>
                 <th>ID</th>
                 <th>Nome</th>
                 <th>Email</th>
                 <th>Departamento</th>
                 <th>Especialidade</th>
                 <th>Status</th>
                 <th>Avaliação</th>
                 <th>Serviços</th>
               </tr>
             </thead>
             <tbody>
               ${filteredTechnicians.map(tech => `
                 <tr>
                   <td>${tech.displayId}</td>
                   <td>${tech.name}</td>
                   <td>${tech.email}</td>
                   <td>${tech.department}</td>
                   <td>${tech.specialty}</td>
                   <td>${tech.status}</td>
                   <td>${(Number(tech.rating) || 0).toFixed(1)}</td>
                   <td>${Number(tech.completedJobs) || 0}</td>
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
       link.download = `tecnicos_${new Date().toISOString().split('T')[0]}.html`
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
       URL.revokeObjectURL(url)
     }
   }

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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('technicians.title')}</h1>
            <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('technicians.subtitle')}
            </p>
          </div>

          <div className="flex gap-3">
            {!isAgent && !isClient && (
              <button
                className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => setRegisterModalOpen(true)}
              >
                <FaPlus className="text-sm" />
                <span>{t('technicians.new.button')}</span>
              </button>
            )}
            {isAgent && (
              <button
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => router.push('/pages/agent/available-tickets')}
              >
                <FaTicketAlt className="text-sm" />
                <span>{t('maintenance.viewAvailable')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('technicians.stats.total')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUser className="text-red-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('technicians.stats.available')}</p>
                <p className="text-2xl font-bold text-green-500">{stats.disponiveis}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('technicians.stats.working')}</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.emTrabalho}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('technicians.stats.services')}</p>
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
              placeholder={t('maintenance.search.placeholder')}
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
                <option value="">{t('technicians.filters.allCategories')}</option>
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
                                 {t('technicians.filters.clearFilters')}
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
              {filteredTechnicians.length} {t('technicians.title').toLowerCase()}(s)
            </h2>
                         <div className="flex gap-2">
               <button 
                 onClick={exportToExcel}
                 className={`p-2 rounded-lg ${theme === 'dark'
                   ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                 } transition-colors`}
                 title={t('employees.export.excel')}
               >
                 <FaDownload />
               </button>
               <button 
                 onClick={exportToPDF}
                 className={`p-2 rounded-lg ${theme === 'dark'
                   ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                 } transition-colors`}
                 title={t('employees.export.pdf')}
               >
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
                              {t('technicians.info.availability')} {technician.availability}
                            </span>
                          )}
                          {technician.urgency && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'} hidden sm:inline`}>
                              {t('technicians.info.urgency')} {technician.urgency}
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
                        title={t('technicians.actions.view')}
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
                               skills: Array.isArray(technician.skills) ? technician.skills.join(', ') : (technician.skills || ''),
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
                           title={t('technicians.actions.edit')}
                           className={`p-2 rounded-lg ${theme === 'dark'
                               ? 'bg-blue-600 text-white hover:bg-blue-500'
                               : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                             } transition-colors`}>
                           <FaEdit className="text-sm" />
                         </button>
                      )}
                      {!isAgent && !isClient && (
                        <button
                          onClick={() => handleToggleStatus(technician)}
                          aria-label={`${technician.is_active ? 'Desativar' : 'Ativar'} técnico ${technician.name}`}
                          title={technician.is_active ? t('maintenance.toggleStatus.deactivate') : t('maintenance.toggleStatus.activate')}
                          disabled={actionLoadingId === technician.agentId}
                          className={`p-2 rounded-lg transition-colors ${
                            technician.is_active
                              ? theme === 'dark'
                                ? 'bg-orange-600 text-white hover:bg-orange-500'
                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              : theme === 'dark'
                                ? 'bg-green-600 text-white hover:bg-green-500'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                          } ${actionLoadingId === technician.agentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoadingId === technician.agentId ? (
                            '...'
                          ) : (
                            technician.is_active ? (
                              <FaTimes className="text-sm" />
                            ) : (
                              <FaCheck className="text-sm" />
                            )
                          )}
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
                          title={t('technicians.actions.delete')}
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
                           <strong>{t('technicians.info.experience')}</strong> {technician.experience}
                         </span>
                         <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                           <strong>{t('technicians.info.completed')}</strong> {Number(technician.completedJobs) || 0}
                         </span>
                         <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                           <strong>{t('technicians.info.active')}</strong> {technician.activeJobs}
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
                                                 title={t('technicians.actions.view')}
                      >
                        <FaEye className="text-sm" />
                      </button>
                      {!isAgent && !isClient && (
                        <>
                          <button
                            onClick={() => {
                              setCurrentTechnician(technician)
                              setEditModalOpen(true)
                            }}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                                                         title={t('technicians.actions.edit')}
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(technician)}
                            aria-label={`${technician.is_active ? 'Desativar' : 'Ativar'} técnico ${technician.name}`}
                            title={technician.is_active ? t('maintenance.toggleStatus.deactivate') : t('maintenance.toggleStatus.activate')}
                            disabled={actionLoadingId === technician.agentId}
                            className={`p-2 rounded-lg transition-colors ${
                              technician.is_active
                                ? theme === 'dark'
                                  ? 'bg-orange-600 text-white hover:bg-orange-500'
                                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                : theme === 'dark'
                                  ? 'bg-green-600 text-white hover:bg-green-500'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                            } ${actionLoadingId === technician.agentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoadingId === technician.agentId ? (
                              '...'
                            ) : (
                              technician.is_active ? (
                                <FaTimes className="text-sm" />
                              ) : (
                                <FaCheck className="text-sm" />
                              )
                            )}
                          </button>
                                                     <button
                             onClick={() => {
                               setCurrentTechnician(technician)
                               setDeleteConfirmText('')
                               setDeleteModalOpen(true)
                             }}
                             className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                 ? 'bg-red-600 text-white hover:bg-red-500'
                                 : 'bg-red-100 text-red-600 hover:bg-red-200'
                               }`}
                                                           title={t('technicians.actions.delete')}
                           >
                             <FaTrash className="text-sm" />
                           </button>
                        </>
                      )}
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
                                                 {Number(technician.completedJobs) || 0} {t('technicians.info.services')}
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
                             {t('maintenance.profile.categories')}:
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
                   {t('maintenance.profile.title')}
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
                       {t('maintenance.profile.categoriesAndSpecialty')}
                     </h3>
                     <div className="space-y-4">
                       <div>
                                                    <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.profile.categories')}</h4>
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
                               {t('maintenance.profile.noCategories')}
                             </span>
                           )}
                         </div>
                       </div>
                       <div>
                                                    <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.profile.specialty')}</h4>
                         <div className="space-y-2">
                           <div className="flex items-center space-x-2">
                             <FaStar className="text-yellow-500 text-sm" />
                             <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                               {selectedTechnician.primarySpecialty?.name || selectedTechnician.specialty || t('maintenance.defaultSpecialty')}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>

                  {/* Recent Work */}
                  <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                       <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                     {t('maintenance.profile.recentWork')}
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTicketStatusColor(work.status)}`}>
                              {translateTicketStatus(work.status)}
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
                                 <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.edit.title')}</h3>
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
                     {t('maintenance.edit.clickToChangePhoto')}
                   </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                                 <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.name')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                                     placeholder={t('maintenance.edit.namePlaceholder')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                                 <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.email')}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                                     placeholder={t('maintenance.edit.emailPlaceholder')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">

                <div>
                  <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Departamento</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.slice(1).map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                                     <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.category')}</label>
                  <select value={selectedCategoryId} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : ''; setSelectedCategoryId(id as any); if (id) { (window as any).__loadSubcategoriesForEdit?.(id) } else { setSubcategoryOptions([]); setSelectedSubcategoryIds([]) } }} className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                                         <option value="">{t('maintenance.edit.selectCategory')}</option>
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                                     <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.specialty')}</label>
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
                        <div className={`col-span-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{t('technicians.noSubcategories')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                                     <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.newPassword')}</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } transition-colors`}
                  >
                                         {showPasswordField ? t('maintenance.edit.cancel') : t('maintenance.edit.changePassword')}
                  </button>
                </div>
                {showPasswordField && (
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                                         placeholder={t('maintenance.edit.passwordPlaceholder')}
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
                                     <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('maintenance.edit.active')}</span>
                </label>
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                             <button onClick={() => setEditModalOpen(false)} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>{t('maintenance.edit.cancel')}</button>
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
                      const uploadErrorText = await uploadResp.text()
                      throw new Error(`${t('maintenance.errors.uploadFailed')}: ${uploadErrorText}`)
                    }
                    
                    const uploadResult = await uploadResp.json()
                    if (uploadResult.success && uploadResult.data && uploadResult.data.avatarUrl) {
                      avatarUrl = uploadResult.data.avatarUrl
                    } else {
                      throw new Error(t('maintenance.errors.invalidUploadResponse'))
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
                    const userErrorText = await userResp.text()
                    throw new Error(`${t('maintenance.errors.updateUserFailed')}: ${userErrorText}`)
                  }
                  
                  // Atualizar dados do técnico
                  const selectedNames = subcategoryOptions.filter(s => selectedSubcategoryIds.includes(s.id)).map(s => s.name)
                  const agentUpdates: any = {
                    department: editForm.department || undefined,
                    skills: selectedNames, // salva como array de nomes de subcategoria
                    categories: selectedCategoryId ? [Number(selectedCategoryId)] : [], // envia a categoria selecionada como array
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
                      const passwordErrorText = await passwordResp.text()
                      throw new Error(`${t('maintenance.errors.passwordChangeFailed')}: ${passwordErrorText}`)
                    }
                  }
                  
                  // Atualizar estado local
                  setTechnicians(prev => prev.map(tech => tech.agentId === currentTechnician.agentId ? {
                    ...tech,
                    name: editName.trim() || tech.name,
                    email: editEmail.trim() || tech.email,
                    avatar: avatarUrl || tech.avatar,
                    department: editForm.department || tech.department,
                    skills: selectedNames,
                    is_active: editForm.is_active,
                    categories: selectedCategoryId ? [{ id: Number(selectedCategoryId), name: allCategories.find(c => c.id === Number(selectedCategoryId))?.name || 'Categoria' }] : []
                  } : tech))
                  
                  setEditModalOpen(false)
                                  } catch (e) {
                    toast.error((e as any).message || t('maintenance.errors.saveTechnician'))
                  }
                             }} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg">{t('maintenance.edit.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && currentTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.delete.title')}</h3>
                             <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`} dangerouslySetInnerHTML={{ __html: t('maintenance.delete.confirmation') }} />
            </div>
            <div className="p-4 space-y-3">
                             <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                 {t('maintenance.delete.technician')}: <strong>{currentTechnician.name}</strong>
               </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('maintenance.delete.confirmLabel')}
                </label>
                                 <input 
                   value={deleteConfirmText} 
                   onChange={e => setDeleteConfirmText(e.target.value)} 
                   placeholder="EXCLUIR" 
                   className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                     deleteConfirmText.toUpperCase() === 'EXCLUIR'
                       ? 'border-green-500 dark:bg-green-900/20 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                       : theme === 'dark' 
                         ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                         : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                   }`} 
                 />
                {deleteConfirmText && (
                  <div className={`mt-2 text-sm ${
                    deleteConfirmText.toUpperCase() === 'EXCLUIR' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {deleteConfirmText.toUpperCase() === 'EXCLUIR' 
                      ? t('maintenance.delete.confirmValid')
                      : t('maintenance.delete.confirmInvalid')
                    }
                  </div>
                )}
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                                           <button onClick={() => {
                                setDeleteModalOpen(false)
                                setDeleteConfirmText('')
                              }} className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>{t('maintenance.delete.cancel')}</button>
                                                           <button disabled={deleteConfirmText.toUpperCase() !== 'EXCLUIR'} onClick={() => { 
                                handleDelete(currentTechnician.agentId)
                                setDeleteModalOpen(false)
                                setDeleteConfirmText('')
                              }} className={`px-4 py-2 rounded-lg ${deleteConfirmText.toUpperCase() !== 'EXCLUIR' ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}>{t('maintenance.delete.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Register Modal */}
      <TechnicianRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(newTechnician) => {
          // Recarregar a página para atualizar todos os dados
          window.location.reload()
        }}
      />
    </ResponsiveLayout>
  )
}
