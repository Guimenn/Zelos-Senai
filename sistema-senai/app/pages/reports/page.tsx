'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useRequireRole } from '../../../hooks/useAuth'
import { useI18n } from '../../../contexts/I18nContext'
import { authCookies } from '../../../utils/cookies'
import { exportToExcel, exportToPDF, exportHTMLToPDF, type ReportData } from '../../../utils/exportUtils'
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaPrint,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUsers,
  FaTools,
  FaBuilding,
  FaMapMarkerAlt,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFilter,
  FaSearch,
  FaCalendar,
  FaTachometerAlt,
  FaClipboardList,
  FaWrench,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaGraduationCap,
  FaShieldAlt,
  FaBriefcase,
  FaHeart,
  FaThumbsUp,
  FaComments,
  FaBell,
  FaFileAlt,
  FaFileExport,
  FaFileImport,
  FaCog,
  FaHistory,
  FaEquals
} from 'react-icons/fa'

export default function ReportsPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin', 'Agent'], '/pages/auth/unauthorized')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [isAgent, setIsAgent] = useState(false)
  const [agentId, setAgentId] = useState<number | null>(null)
  const [userName, setUserName] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [overview, setOverview] = useState({
    totalChamados: 0,
    chamadosAbertos: 0,
    chamadosConcluidos: 0,
    tempoMedioResolucao: '0h',
    satisfacaoMedia: 0,
    percentualResolucao: 0,
  })
  const [departmentsData, setDepartmentsData] = useState<Array<{ name: string; chamados: number; percentual: number; tempoMedio: string; satisfacao: number }>>([])
  const [prioritiesData, setPrioritiesData] = useState<Array<{ name: string; count: number; percentual: number; color: 'red' | 'yellow' | 'green' | 'blue' }>>([])
  const [topTechnicians, setTopTechnicians] = useState<Array<{ name: string; chamados: number; satisfacao: number; tempoMedio: string; departamento?: string | null }>>([])
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; title: string; status: string; technician: string; time: string; rating: number | null }>>([])
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const [activeTickets, setActiveTickets] = useState<Array<{ id: number; title: string; priority: string; status: string; created_at: string }>>([])

  const computeDateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    switch (selectedPeriod) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setMonth(end.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(end.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(end.getFullYear() - 1)
        break
      default:
        break
    }
    return { start, end }
  }, [selectedPeriod])

  const formatMinutesToHours = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return '0h'
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  // Verificar se o usuário é um técnico ao carregar a página
  useEffect(() => {
    if (authLoading || !user) return
    
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (token && user) {
        const role = (user?.role ?? user?.userRole ?? '').toString().toLowerCase()
        const isAgentUser = role === 'agent'
        setIsAgent(isAgentUser)
        setUserName(user?.name || '')
        
        console.log('Usuário autenticado:', { 
          role, 
          isAgentUser, 
          name: user?.name, 
          userId: user?.userId 
        })
        
        // Se for um técnico, usar o userId como agentId diretamente
        const userId = user?.userId
        if (isAgentUser && userId) {
          console.log('Usando userId como agentId para técnico:', userId)
          setAgentId(userId)
        }
      } else {
        setError('Você precisa estar autenticado para acessar esta página.')
      }
    } catch (err) {
      console.warn('Erro ao decodificar token:', err)
      setError('Erro ao verificar autenticação. Por favor, faça login novamente.')
    }
  }, [authLoading, user])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) throw new Error('Não autenticado')

        // Se o usuário for um técnico e ainda não temos o agentId, aguardar
        if (isAgent && !agentId) {
          console.log('Aguardando ID do agente para carregar relatórios...')
          setLoading(false)
          return
        }

        const { start, end } = computeDateRange
        const startParam = encodeURIComponent(start.toISOString())
        const endParam = encodeURIComponent(end.toISOString())

        // Adicionar parâmetro de agente se o usuário for um técnico
        const agentParam = isAgent && agentId ? `&agent_id=${agentId}` : ''

        // Definir as URLs base para as requisições
        let statusUrl = '/admin/status';
        let reportsBaseUrl = '/admin/reports';
        
        // Se for um técnico, ajustar as URLs para usar as rotas específicas de agente
         if (isAgent && agentId) {
           statusUrl = '/helpdesk/agents/my-statistics';
           // Verificar se a API tem endpoint específico para relatórios de agentes
           // Se não tiver, continuar usando a rota admin com filtro de agente
           reportsBaseUrl = '/helpdesk/agents/my-history'; // Usar rota do helpdesk
           console.log('Usando rotas para técnico:', { statusUrl, reportsBaseUrl, agentParam });
         } else {
           console.log('Usando rotas para admin:', { statusUrl, reportsBaseUrl });
         }
        
        // Para técnicos, usar apenas as rotas do helpdesk
        if (isAgent && agentId) {
          const [statusResp, historyResp, activeResp] = await Promise.all([
            // Estatísticas do agente
            fetch(statusUrl, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal
            }),
            // Histórico recente do agente
            fetch(`/helpdesk/agents/my-history?limit=10`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal
            }),
            // Tickets ativos do agente
            fetch(`/helpdesk/agents/my-tickets?limit=5`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal
            })
          ])

          if (!statusResp.ok) {
            console.error(`Erro ao carregar estatísticas: ${statusResp.status} ${statusResp.statusText}`)
            throw new Error(`Falha ao carregar estatísticas (${statusResp.status}: ${statusResp.statusText})`)
          }

          const statusJson = await statusResp.json()
          const historyJson = historyResp.ok ? await historyResp.json() : { tickets: [] }
          const activeJson = activeResp.ok ? await activeResp.json() : { tickets: [] }

          if (!isMounted) return

          // Processar dados das estatísticas do agente usando os campos do backend
          const stats: any = statusJson || {}
          const ticketsByStatus = stats.ticketsByStatus || {}
          const totalAssigned = Number(
            stats.totalAssignedTickets ??
            Object.values(ticketsByStatus).reduce((acc: number, v: any) => acc + Number(v || 0), 0)
          )
          const openCount = Number(ticketsByStatus.Open || 0)
          const inProgressCount = Number(ticketsByStatus.InProgress || 0)
          const waitingClient = Number(ticketsByStatus.WaitingForClient || 0)
          const waitingThird = Number(ticketsByStatus.WaitingForThirdParty || 0)
          const resolvedCount = Number(ticketsByStatus.Resolved || stats.resolvedTickets || 0)
          const closedCount = Number(ticketsByStatus.Closed || 0)
          const cancelledCount = Number(ticketsByStatus.Cancelled || 0)
          const concluded = resolvedCount + closedCount + cancelledCount

          setOverview({
            totalChamados: totalAssigned,
            chamadosAbertos: openCount + inProgressCount + waitingClient + waitingThird,
            chamadosConcluidos: concluded,
            tempoMedioResolucao: formatMinutesToHours(Number(stats.avgResolutionTime || 0)),
            satisfacaoMedia: Number((stats.avgSatisfaction || 0)),
            percentualResolucao: totalAssigned > 0 ? Number(((concluded / totalAssigned) * 100).toFixed(1)) : 0,
          })

          // Guardar breakdown de status para painel compacto
          setStatusBreakdown(ticketsByStatus)

          // Construir distribuição por prioridade a partir das estatísticas
          const priorities = stats.ticketsByPriority || {}
          const prioritiesTotal = ['High', 'Medium', 'Low', 'Critical']
            .map(k => Number(priorities[k] || 0))
            .reduce((a, b) => a + b, 0)
          const agentPData = [
            { key: 'High', name: 'Alta', color: 'red' as const },
            { key: 'Medium', name: 'Média', color: 'yellow' as const },
            { key: 'Low', name: 'Baixa', color: 'green' as const },
            { key: 'Critical', name: 'Crítica', color: 'blue' as const },
          ].map(p => {
            const count = Number(priorities[p.key as keyof typeof priorities] || 0)
            return {
              name: p.name,
              count,
              percentual: prioritiesTotal > 0 ? Number(((count / prioritiesTotal) * 100).toFixed(1)) : 0,
              color: p.color
            }
          }).filter(x => x.count > 0)
          setPrioritiesData(agentPData)

          // Atividades recentes a partir do histórico do agente
          const histTickets = Array.isArray(historyJson?.tickets) ? historyJson.tickets : []
          const recent = histTickets.slice(0, 10).map((t: any) => ({
            id: `#${t.id}`,
            title: t.title,
            status: t.status,
            technician: userName || 'Você',
            time: typeof t.resolution_time === 'number' ? formatMinutesToHours(t.resolution_time) : '—',
            rating: t.satisfaction_rating ?? null,
          }))
          setRecentActivity(recent)

          // Tickets ativos para preencher espaço com conteúdo útil
          const active = Array.isArray(activeJson?.tickets) ? activeJson.tickets : []
          setActiveTickets(active.map((t: any) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            created_at: t.created_at
          })))

          // Para técnicos, não mostrar dados de departamentos e ranking de técnicos
          setDepartmentsData([])
          setTopTechnicians([])

          return
        }
        
        // Para admins, usar as rotas completas
        const [statusResp, catsResp, agentsResp, ticketsResp] = await Promise.all([
          // Status do sistema ou do agente
          fetch(statusUrl, { 
            headers: { Authorization: `Bearer ${token}` }, 
            signal: controller.signal 
          }),
          // Categorias
          fetch(`${reportsBaseUrl}?report_type=categories&start_date=${startParam}&end_date=${endParam}${agentParam}`, { 
            headers: { Authorization: `Bearer ${token}` }, 
            signal: controller.signal 
          }),
          // Agentes
          fetch(`${reportsBaseUrl}?report_type=agents&start_date=${startParam}&end_date=${endParam}${agentParam}`, { 
            headers: { Authorization: `Bearer ${token}` }, 
            signal: controller.signal 
          }),
          // Tickets
          fetch(`${reportsBaseUrl}?report_type=tickets&start_date=${startParam}&end_date=${endParam}${agentParam}`, { 
            headers: { Authorization: `Bearer ${token}` }, 
            signal: controller.signal 
          })
        ])

        // Verificar respostas e fornecer mensagens de erro mais detalhadas
        if (!statusResp.ok) {
          console.error(`Erro ao carregar status: ${statusResp.status} ${statusResp.statusText}`);
          throw new Error(`Falha ao carregar status do sistema (${statusResp.status}: ${statusResp.statusText})`);
        }
        if (!catsResp.ok) {
          console.error(`Erro ao carregar categorias: ${catsResp.status} ${catsResp.statusText}`);
          throw new Error(`Falha ao carregar categorias (${catsResp.status}: ${catsResp.statusText})`);
        }
        if (!agentsResp.ok) {
          console.error(`Erro ao carregar agentes: ${agentsResp.status} ${agentsResp.statusText}`);
          throw new Error(`Falha ao carregar agentes (${agentsResp.status}: ${agentsResp.statusText})`);
        }
        if (!ticketsResp.ok) {
          console.error(`Erro ao carregar tickets: ${ticketsResp.status} ${ticketsResp.statusText}`);
          throw new Error(`Falha ao carregar tickets (${ticketsResp.status}: ${ticketsResp.statusText})`);
        }

        const statusJson = await statusResp.json()
        const catsJson = await catsResp.json()
        const agentsJson = await agentsResp.json()
        const ticketsJson = await ticketsResp.json()

        if (!isMounted) return

        const tickets = statusJson?.tickets || {}
        const total = Number(tickets.total || 0)
        const open = Number(tickets.open || 0)
        const inProgress = Number(tickets.in_progress || 0)
        const waiting = Number(tickets.waiting_for_client || 0)
        const resolved = Number(tickets.resolved || 0)
        const closed = Number(tickets.closed || 0)
        const resolvedLike = resolved + closed
        const avgResolution = Number(tickets.avg_resolution_time || 0)
        const avgSatisfaction = Number(tickets.avg_satisfaction || 0)

        setOverview({
          totalChamados: total,
          chamadosAbertos: open + inProgress + waiting,
          chamadosConcluidos: resolvedLike,
          tempoMedioResolucao: formatMinutesToHours(avgResolution),
          satisfacaoMedia: Number(avgSatisfaction?.toFixed?.(1) ?? avgSatisfaction),
          percentualResolucao: total > 0 ? Number(((resolvedLike / total) * 100).toFixed(1)) : 0,
        })

        const pr = tickets.priorities || {}
        const totalPriorities = ['low', 'medium', 'high', 'critical']
          .map((k) => Number(pr[k] || 0))
          .reduce((a, b) => a + b, 0)
        const pData = [
          { key: 'high', name: 'Alta', color: 'red' as const },
          { key: 'medium', name: 'Média', color: 'yellow' as const },
          { key: 'low', name: 'Baixa', color: 'green' as const },
          { key: 'critical', name: 'Crítica', color: 'blue' as const },
        ].map((p) => {
          const count = Number(pr[p.key as keyof typeof pr] || 0)
          return { name: p.name, count, percentual: totalPriorities > 0 ? Number(((count / totalPriorities) * 100).toFixed(1)) : 0, color: p.color }
        })
        setPrioritiesData(pData.filter((x) => x.count > 0))

        const sCats = catsJson?.data || []
        let catCounts = sCats.map((c: any) => {
          const chamados = Array.isArray(c.tickets) ? c.tickets.length : 0
          const avgResMin = Array.isArray(c.tickets) && c.tickets.length
            ? c.tickets.reduce((acc: number, t: any) => acc + (t.resolution_time || 0), 0) / c.tickets.length
            : 0
          const avgSat = Array.isArray(c.tickets) && c.tickets.length
            ? c.tickets.reduce((acc: number, t: any) => acc + (t.satisfaction_rating || 0), 0) / c.tickets.length
            : 0
          return { name: c.name, chamados, avgResMin, avgSat }
        })
        
        // Se for um técnico, filtrar apenas categorias com chamados atribuídos a ele
        if (isAgent && agentId) {
          // A API já deve ter filtrado, mas garantimos aqui também
          catCounts = catCounts.filter((c: { chamados: number }) => c.chamados > 0)
        }
        
        const catsTotal = catCounts.reduce((a: number, b: any) => a + b.chamados, 0)
        setDepartmentsData(catCounts
          .filter((c: any) => c.chamados > 0)
          .map((c: any) => ({
            name: c.name,
            chamados: c.chamados,
            percentual: catsTotal > 0 ? Number(((c.chamados / catsTotal) * 100).toFixed(1)) : 0,
            tempoMedio: formatMinutesToHours(c.avgResMin),
            satisfacao: Number((c.avgSat || 0).toFixed(1)),
          })))

        const agents = agentsJson?.data || []
        let techs = (agents as any[]).map((a) => {
          const assignments = Array.isArray(a.ticket_assignments) ? a.ticket_assignments : []
          const tickets = assignments.map((ta: any) => ta.ticket).filter(Boolean)
          const chamados = tickets.length
          const avgRes = chamados ? tickets.reduce((acc: number, t: any) => acc + (t.resolution_time || 0), 0) / chamados : 0
          const avgSat = chamados ? tickets.reduce((acc: number, t: any) => acc + (t.satisfaction_rating || 0), 0) / chamados : 0
          const name = a?.user?.name || 'Técnico'
          const departamento = a?.department ?? null
          return { name, chamados, satisfacao: Number((avgSat || 0).toFixed(1)), tempoMedio: formatMinutesToHours(avgRes), departamento, id: a.id }
        })
        
        // Se for um técnico, filtrar apenas seus próprios dados
        if (isAgent && agentId) {
          techs = techs.filter(tech => tech.id === agentId)
        }
        
        setTopTechnicians(techs.sort((a, b) => b.chamados - a.chamados).slice(0, 8))

        const ticketsArr = ticketsJson?.data || []
        let filteredTickets = ticketsArr as any[]
        
        // Se for um técnico, filtrar apenas os tickets atribuídos a ele
        if (isAgent && agentId) {
          filteredTickets = filteredTickets.filter(ticket => {
            if (!Array.isArray(ticket.ticket_assignments)) return false
            return ticket.ticket_assignments.some((assignment: { agent?: { id?: number } }) => assignment?.agent?.id === agentId)
          })
        }
        
        const recent = filteredTickets
          .sort((a, b) => new Date(b.modified_at || b.created_at).getTime() - new Date(a.modified_at || a.created_at).getTime())
          .slice(0, 10)
          .map((t) => {
            const lastAssignment = Array.isArray(t.ticket_assignments) && t.ticket_assignments.length
              ? t.ticket_assignments[t.ticket_assignments.length - 1]
              : null
            const technician = lastAssignment?.agent?.user?.name || '—'
            const rating = t.satisfaction_rating ?? null
            const time = typeof t.resolution_time === 'number' ? formatMinutesToHours(t.resolution_time) : '—'
            return { id: `#${t.id}`, title: t.title, status: t.status, technician, time, rating }
          })
        setRecentActivity(recent)

      } catch (e: any) {
        if (!controller.signal.aborted) {
          // Verificar se é um erro de permissão (403 Forbidden)
          if (e?.message?.includes('403')) {
            setError('Você não tem permissão para acessar estes relatórios. Por favor, contate o administrador do sistema.')
          } else {
            setError(e?.message || 'Erro ao carregar dados')
          }
          console.error('Erro detalhado:', e)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [computeDateRange, agentId, isAgent])

  // Função para exportar dados dos relatórios para Excel
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const reportData: ReportData = {
        departments: departmentsData,
        priorities: prioritiesData,
        technicians: topTechnicians,
        overview,
        recentActivity
      }
      
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod
      exportToExcel(reportData, periodLabel)
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
    } finally {
      setExporting(false)
    }
  }

  // Função para exportar dados dos relatórios para PDF
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const reportData: ReportData = {
        departments: departmentsData,
        priorities: prioritiesData,
        technicians: topTechnicians,
        overview,
        recentActivity
      }
      
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod
      await exportToPDF(reportData, periodLabel)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  // Função para exportar HTML como PDF (visualização exata da tela)
  const handleExportHTMLToPDF = async () => {
    setExporting(true)
    try {
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod
      const fileName = `relatorio-senai-html-${periodLabel}-${new Date().toISOString().slice(0, 10)}.pdf`
      await exportHTMLToPDF('reports-container', fileName)
    } catch (error) {
      console.error('Erro ao exportar HTML para PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  const periods = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mês' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'year', label: 'Último Ano' }
  ]

  const departments = [
    { value: 'all', label: 'Todos os Departamentos' },
    { value: 'equipamentos', label: 'Equipamentos' },
    { value: 'climatizacao', label: 'Climatização' },
    { value: 'iluminacao', label: 'Iluminação' },
    { value: 'informatica', label: 'Informática' },
    { value: 'hidraulica', label: 'Hidráulica' },
    { value: 'audiovisual', label: 'Audiovisual' }
  ]

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500'
      case 'yellow': return 'text-yellow-500'
      case 'green': return 'text-green-500'
      case 'blue': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getBgColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500/20'
      case 'yellow': return 'bg-yellow-500/20'
      case 'green': return 'bg-green-500/20'
      case 'blue': return 'bg-blue-500/20'
      default: return 'bg-gray-500/20'
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className="text-green-500" />
    if (current < previous) return <FaArrowDown className="text-red-500" />
    return <FaEquals className="text-gray-500" />
  }

  // Determinar o tipo de usuário para o layout
  const userType = isAgent ? 'agent' : 'admin';
  
  return (
    <ResponsiveLayout
      userType={isAgent ? 'tecnico' : 'admin'}
      userName={userName || 'Usuário SENAI'}
      userEmail=""
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div id="reports-container">
      {/* Header */}
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isAgent ? `${t('reports.title.agent')} - ${userName}` : t('reports.title.admin')}
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAgent 
                  ? t('reports.subtitle.agent')
                  : t('reports.subtitle.admin')}
              </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
              } transition-colors flex items-center space-x-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleExportExcel}
              disabled={exporting}
            >
              <FaFileExport />
              <span>{exporting ? 'Exportando...' : 'Exportar Excel'}</span>
            </button>
            <button 
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
              } transition-colors flex items-center space-x-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleExportPDF}
              disabled={exporting}
            >
              <FaPrint />
              <span>{exporting ? 'Exportando...' : 'Exportar PDF'}</span>
            </button>
            <button 
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
              } transition-colors flex items-center space-x-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleExportHTMLToPDF}
              disabled={exporting}
            >
              <FaFileAlt />
              <span>{exporting ? 'Exportando...' : 'PDF da Tela'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.totalTickets')}</p>
              <p className="text-3xl font-bold">{overview.totalChamados}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overview.totalChamados, overview.totalChamados)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.noChange')}</span>
              </div>
            </div>
            <FaClipboardList className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.resolutionRate')}</p>
              <p className="text-3xl font-bold text-green-500">{overview.percentualResolucao}%</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overview.percentualResolucao, overview.percentualResolucao)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.noChange')}</span>
              </div>
            </div>
            <FaCheckCircle className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.avgTime')}</p>
              <p className="text-3xl font-bold text-yellow-500">{overview.tempoMedioResolucao}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(0, 0)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>—</span>
              </div>
            </div>
            <FaClock className="text-yellow-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('reports.overview.satisfaction')}</p>
              <p className="text-3xl font-bold text-purple-500">{overview.satisfacaoMedia}/5</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overview.satisfacaoMedia, overview.satisfacaoMedia)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sem variação</span>
              </div>
            </div>
            <FaStar className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {isAgent && !agentId ? 'Carregando informações do técnico...' : 'Carregando dados de relatórios...'}
        </div>
      )}
      {!loading && error && (
        <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-700'} border ${theme === 'dark' ? 'border-red-800' : 'border-red-200'}`}>
          {error}
         
        </div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution */}
        {(!isAgent || departmentsData.length > 0) && (
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('reports.departmentDistribution')}
          </h3>
          <div className="space-y-4">
            {departmentsData.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getBgColorClass(dept.name.toLowerCase().includes('equip') ? 'blue' : 'green')}`}></div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {dept.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dept.chamados} chamados
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {dept.percentual}%
                  </span>
                </div>
              </div>
            ))}
            {departmentsData.length === 0 && (
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Sem dados para o período selecionado.</p>
            )}
          </div>
        </div>
        )}

        {/* Priority Distribution */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('reports.priorityDistribution')}
          </h3>
          <div className="space-y-4">
            {prioritiesData.map((priority, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getBgColorClass(priority.color)}`}></div>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {priority.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {priority.count} chamados
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {priority.percentual}%
                  </span>
                </div>
              </div>
            ))}
            {prioritiesData.length === 0 && (
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Sem dados para o período selecionado.</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown e Tickets Ativos (somente técnico) */}
      {isAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tickets por Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusBreakdown).map(([k, v]) => (
                <div key={k} className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{k}</p>
                  <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{v as number}</p>
                </div>
              ))}
              {Object.keys(statusBreakdown).length === 0 && (
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Sem dados de status.</p>
              )}
            </div>
          </div>

          <div className={`rounded-xl p-6 lg:col-span-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tickets Ativos</h3>
            </div>
            <div className="space-y-3">
              {activeTickets.map((t) => (
                <div key={t.id} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 mr-4">
                      <p className={`truncate font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>#{t.id} — {t.title}</p>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Aberto em {new Date(t.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${t.priority === 'High' || t.priority === 'Critical' ? 'bg-red-500/20 text-red-600 border-red-500/30' : t.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : 'bg-green-500/20 text-green-600 border-green-500/30'}`}>{t.priority}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${t.status === 'InProgress' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' : t.status === 'WaitingForClient' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : 'bg-gray-500/20 text-gray-700 border-gray-500/30'}`}>{t.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              {activeTickets.length === 0 && (
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Sem tickets ativos no momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Technicians - Visível apenas para administradores */}
      {!isAgent && (
        <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.topTechnicians')}
            </h3>
            <button className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              Ver Todos
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topTechnicians.map((technician, index) => (
            <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold`}>
                  {technician.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.name}
                  </h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {technician.departamento}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Chamados:</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.chamados}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Satisfação:</span>
                  <span className="font-medium text-green-500">{technician.satisfacao}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Tempo Médio:</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {technician.tempoMedio}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Recent Activity */}
      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('reports.recentActivity')}
          </h3>
          <button className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            Ver Histórico Completo
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {activity.id}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'Concluído' 
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {activity.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      <FaUser className="inline mr-1" />
                      {activity.technician}
                    </span>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      <FaClock className="inline mr-1" />
                      {activity.time}
                    </span>
                    {activity.rating && (
                      <span className="text-green-500">
                        <FaStar className="inline mr-1" />
                        {activity.rating}/5
                      </span>
                    )}
                  </div>
                </div>
                <button className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}>
                  <FaEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </ResponsiveLayout>
  )
}
