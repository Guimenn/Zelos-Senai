'use client'

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useAuthCache } from '../../../hooks/useAuth'
import { useI18n } from '../../../contexts/I18nContext'
import { authCookies } from '../../../utils/cookies'
import { jwtDecode } from 'jwt-decode'
import { exportToExcel, exportToPDF, exportHTMLToPDF, type ReportData } from '../../../utils/exportUtils'
import { BarChart, PieChart, LineChart } from '../../../components/charts'
import { useRouter } from 'next/navigation'
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
  const { user, isLoading: authLoading } = useAuthCache()
  const router = useRouter()
  const [isAgent, setIsAgent] = useState(false)
  const [agentId, setAgentId] = useState<number | null>(null)
  const [userName, setUserName] = useState('')



  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Cache para evitar requisições desnecessárias
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const isUpdatingRef = useRef<boolean>(false)
  const lastUpdateRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [overview, setOverview] = useState({
    totalChamados: 0,
    chamadosAbertos: 0,
    chamadosConcluidos: 0,
    tempoTotalResolucao: '0h',
    satisfacaoMedia: 0,
    percentualResolucao: 0,
  })
  const [departmentsData, setDepartmentsData] = useState<Array<{ name: string; chamados: number; percentual: number; tempoMedio: string; satisfacao: number }>>([])
  const [prioritiesData, setPrioritiesData] = useState<Array<{ name: string; count: number; percentual: number; color: 'red' | 'yellow' | 'green' | 'blue' }>>([])
  const [topTechnicians, setTopTechnicians] = useState<Array<{ name: string; chamados: number; satisfacao: number; tempoMedio: string; departamento?: string | null }>>([])
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; title: string; status: string; technician: string; time: string; rating: number | null }>>([])


  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const [activeTickets, setActiveTickets] = useState<Array<{ id: number; title: string; priority: string; status: string; created_at: string }>>([])
  const [satisfactionDistribution, setSatisfactionDistribution] = useState<Array<{ rating: number; count: number; percentage: number }>>([])
  const [satisfactionTimeline, setSatisfactionTimeline] = useState<Array<{ date: string; avgRating: number; count: number }>>([])
  const [allSatisfactionRatings, setAllSatisfactionRatings] = useState<Array<{ id: number; ticket_number: string; satisfaction_rating: number; closed_at: string; title: string }>>([])
  const [ticketsOverTime, setTicketsOverTime] = useState<Array<{ date: string; abertos: number; concluidos: number; total: number }>>([])



  // Período fixo de 1 mês para todos os relatórios
  const computeDateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 1)
    return { start, end }
  }, [])

  const formatMinutesToHours = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return '0h'
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }



  // Função para gerar chave de cache
  const getCacheKey = useCallback((url: string, params: string) => {
    return `${url}?${params}`
  }, [])

  // Função para verificar se os dados estão em cache e ainda são válidos (5 minutos)
  const getCachedData = useCallback((cacheKey: string) => {
    const cached = cacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos (300000ms)
      console.log('📦 Cache válido encontrado para:', cacheKey)
      return cached.data
    }
    if (cached) {
      console.log('⏰ Cache expirado para:', cacheKey)
    }
    return null
  }, [])

  // Função para salvar dados no cache
  const setCachedData = useCallback((cacheKey: string, data: any) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }, [])

  // Função para fazer requisição com cache
  const fetchWithCache = useCallback(async (url: string, params: string, options: RequestInit = {}) => {
    const cacheKey = getCacheKey(url, params)
    const cachedData = getCachedData(cacheKey)

    if (cachedData) {
      console.log('📦 Usando dados do cache para:', url)
      return cachedData
    }

    console.log('🌐 Fazendo requisição para:', url)
    console.log('🌐 URL completa:', `${url}?${params}`)
    console.log('🌐 Headers:', options.headers)

    try {
      const response = await fetch(`${url}?${params}`, options)
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error text:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Dados recebidos para:', url, data)
      console.log('💾 Salvando dados no cache para:', url)
      setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('❌ Erro na requisição para:', url, error)
      throw error
    }
  }, [getCacheKey, getCachedData, setCachedData])

  // Verificar se o usuário é um técnico ao carregar a página
  useEffect(() => {
    if (authLoading || !user) return

    try {
      const role = (user?.role ?? user?.userRole ?? '').toString().toLowerCase()
      const isAgentUser = role === 'agent'

      console.log('🔍 User role check:', { user, role, isAgentUser })

      setIsAgent(isAgentUser)
      setUserName(user?.name || '')

      // Definir agentId baseado no tipo de usuário
      const userId = user?.userId
      if (isAgentUser && userId) {
        setAgentId(userId)
      } else {
        setAgentId(0)
      }

      console.log('🔍 Final user config:', { isAgent: isAgentUser, agentId: userId || 0, userName: user?.name })
    } catch (err) {
      console.warn('Erro ao verificar usuário:', err)
      setError('Erro ao verificar autenticação. Por favor, faça login novamente.')
    }
  }, [authLoading, user, userName])

  // Função otimizada para carregar dados
  const loadData = useCallback(async (force: boolean = false) => {
    
    // Verificar se o usuário está autenticado
    if (!user || authLoading) {
      return
    }

    // Verificar se o usuário tem role adequada
    const userRole = user.role || user.userRole
    if (!userRole || !['Admin', 'Agent', 'admin', 'agent'].includes(userRole)) {
      return
    }

    // Evitar múltiplas requisições simultâneas
    if (isUpdatingRef.current && !force) {
      return
    }

    // Cache de 2 minutos para evitar requisições muito frequentes
    const now = Date.now()
    if (!force && now - lastUpdateRef.current < 120000) { // 2 minutos
      return
    }

    try {
      isUpdatingRef.current = true
      setLoading(true)
      setError(null)

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) throw new Error('Não autenticado')

      // Se o usuário for um técnico e ainda não temos o agentId, aguardar
      if (isAgent && !agentId) {
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
        reportsBaseUrl = '/helpdesk/agents/my-history';
      }

      const options = {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal
      }

      // Para técnicos, usar apenas as rotas do helpdesk
      if (isAgent && agentId) {
        console.log('🚀 Loading data for AGENT in loadData:', { isAgent, agentId, statusUrl })
        const [statusJson, historyJson, activeJson] = await Promise.all([
          fetchWithCache(statusUrl, '', options),
          fetchWithCache('/helpdesk/agents/my-history', 'limit=10', options),
          fetchWithCache('/helpdesk/agents/my-tickets', 'limit=5', options)
        ])

        console.log('📊 Agent data received in loadData:', { statusJson, historyJson, activeJson })
        console.log('🔍 DEBUG - Status JSON for agent:', JSON.stringify(statusJson, null, 2))
        console.log('🔍 DEBUG - History JSON for agent:', JSON.stringify(historyJson, null, 2))
        console.log('🔍 DEBUG - Active JSON for agent:', JSON.stringify(activeJson, null, 2))
        console.log('🔍 DEBUG - allSatisfactionRatings from API:', statusJson?.allSatisfactionRatings)
        console.log('🔍 DEBUG - allSatisfactionRatings length:', statusJson?.allSatisfactionRatings?.length)

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
          tempoTotalResolucao: formatMinutesToHours(Number(stats.totalResolutionTime || 0)),
          satisfacaoMedia: Number((stats.avgSatisfaction || 0).toFixed(1)),
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

        const recent = histTickets.slice(0, 10).map((t: any) => {
          // Mapear status para português
          let statusDisplay = t.status
          switch (t.status) {
            case 'Resolved':
              statusDisplay = 'Concluído'
              break
            case 'Closed':
              statusDisplay = 'Fechado'
              break
            case 'Cancelled':
              statusDisplay = 'Cancelado'
              break
            default:
              statusDisplay = t.status
          }

          return {
            id: `#${t.id}`,
            title: t.title,
            status: statusDisplay,
            technician: userName || 'Você',
            time: typeof t.resolution_time === 'number' ? formatMinutesToHours(t.resolution_time) : '—',
            rating: t.satisfaction_rating ?? null,
          }
        })

        setRecentActivity(recent)

        // Para técnicos, não mostrar dados de departamentos e ranking de técnicos
        setDepartmentsData([])
        setTopTechnicians([])

        // Calcular distribuição de satisfação para técnicos
        console.log('🔍 DEBUG - histTickets length:', histTickets.length)
        console.log('🔍 DEBUG - histTickets sample:', histTickets.slice(0, 3))
        
        const ticketsWithSatisfaction = histTickets.filter((t: any) => t.satisfaction_rating !== null && t.satisfaction_rating > 0)
        console.log('🔍 DEBUG - ticketsWithSatisfaction length:', ticketsWithSatisfaction.length)
        console.log('🔍 DEBUG - ticketsWithSatisfaction sample:', ticketsWithSatisfaction.slice(0, 3))
        
        const satisfactionCounts = [0, 0, 0, 0, 0] // [1, 2, 3, 4, 5]

        ticketsWithSatisfaction.forEach((ticket: any) => {
          const rating = ticket.satisfaction_rating
          if (rating >= 1 && rating <= 5) {
            satisfactionCounts[rating - 1]++
          }
        })

        const totalRatings = satisfactionCounts.reduce((a, b) => a + b, 0)
        const satisfactionDist = satisfactionCounts.map((count, index) => ({
          rating: index + 1,
          count,
          percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
        })).filter(item => item.count > 0)

        setSatisfactionDistribution(satisfactionDist)

        // Calcular timeline de satisfação para técnicos
        const ticketsWithSatisfactionAndDate = histTickets.filter((t: any) =>
          t.satisfaction_rating !== null &&
          t.satisfaction_rating > 0 &&
          t.closed_at
        )

        // Agrupar por mês
        const monthlySatisfaction = new Map<string, { totalRating: number; count: number }>()

        ticketsWithSatisfactionAndDate.forEach((ticket: any) => {
          const closedDate = new Date(ticket.closed_at)
          const monthKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, '0')}`

          if (!monthlySatisfaction.has(monthKey)) {
            monthlySatisfaction.set(monthKey, { totalRating: 0, count: 0 })
          }

          const current = monthlySatisfaction.get(monthKey)!
          current.totalRating += ticket.satisfaction_rating
          current.count += 1
        })

        // Converter para array e ordenar por data
        const timelineData = Array.from(monthlySatisfaction.entries())
          .map(([date, data]) => ({
            date,
            avgRating: data.count > 0 ? Number((data.totalRating / data.count).toFixed(1)) : 0,
            count: data.count
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setSatisfactionTimeline(timelineData)

        // Processar todas as avaliações individuais para técnicos
        // Usar os dados da API de estatísticas se disponíveis, senão usar o histórico
        let allRatings = []
        
        if (stats.allSatisfactionRatings && Array.isArray(stats.allSatisfactionRatings) && stats.allSatisfactionRatings.length > 0) {
          // Usar dados da API de estatísticas - incluir todos os tickets resolvidos
          allRatings = stats.allSatisfactionRatings.map((t: any) => ({
            id: t.id,
            ticket_number: t.ticket_number || `#${t.id}`,
            satisfaction_rating: t.satisfaction_rating || 0, // Usar 0 se não tiver avaliação
            closed_at: t.closed_at || t.updated_at || t.created_at,
            title: t.title,
            hasRating: t.satisfaction_rating !== null && t.satisfaction_rating > 0
          }))
        } else {
          // Fallback para dados do histórico - incluir todos os tickets resolvidos
          const allResolvedTickets = histTickets.filter((t: any) => 
            t.status === 'Resolved' || t.status === 'Closed'
          )
          allRatings = allResolvedTickets.map((t: any) => ({
            id: t.id,
            ticket_number: `#${t.id}`,
            satisfaction_rating: t.satisfaction_rating || 0, // Usar 0 se não tiver avaliação
            closed_at: t.closed_at || t.updated_at || t.created_at,
            title: t.title,
            hasRating: t.satisfaction_rating !== null && t.satisfaction_rating > 0
          }))
        }
        
        console.log('🔍 DEBUG - allRatings length:', allRatings.length)
        console.log('🔍 DEBUG - allRatings sample:', allRatings.slice(0, 3))
        console.log('🔍 DEBUG - stats.allSatisfactionRatings:', stats.allSatisfactionRatings)
        setAllSatisfactionRatings(allRatings)

        // Processar tickets ativos para técnicos
        const activeTicketsData = Array.isArray(activeJson?.tickets) ? activeJson.tickets : []

        const processedActiveTickets = activeTicketsData.slice(0, 5).map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          created_at: t.created_at || new Date().toISOString()
        }))
        setActiveTickets(processedActiveTickets)

        return
      }

      // Para admins, usar as rotas completas
      console.log('🚀 Loading data for ADMIN in loadData:', { isAgent, agentId, statusUrl, reportsBaseUrl })
      const [statusJson, catsJson, agentsJson, ticketsJson] = await Promise.all([
        fetchWithCache(statusUrl, '', options),
        fetchWithCache(reportsBaseUrl, `report_type=categories&start_date=${startParam}&end_date=${endParam}${agentParam}`, options),
        fetchWithCache(reportsBaseUrl, `report_type=agents&start_date=${startParam}&end_date=${endParam}${agentParam}`, options),
        fetchWithCache(reportsBaseUrl, `report_type=tickets&start_date=${startParam}&end_date=${endParam}${agentParam}`, options)
      ])

      console.log('📊 Admin data received in loadData:', { statusJson, catsJson, agentsJson, ticketsJson })

      // Debug dos dados recebidos
      console.log('🔍 Status JSON details:', {
        users: statusJson?.users,
        tickets: statusJson?.tickets,
        categories: statusJson?.categories,
        system: statusJson?.system
      })
      console.log('🔍 Categories JSON details:', catsJson?.data)
      console.log('🔍 Agents JSON details:', agentsJson?.data)
      console.log('🔍 Tickets JSON details:', ticketsJson?.data)

      // Debug mais detalhado dos dados
      console.log('🔍 RAW Status JSON:', JSON.stringify(statusJson, null, 2))
      console.log('🔍 RAW Categories JSON:', JSON.stringify(catsJson, null, 2))
      console.log('🔍 RAW Agents JSON:', JSON.stringify(agentsJson, null, 2))
      console.log('🔍 RAW Tickets JSON:', JSON.stringify(ticketsJson, null, 2))

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

      console.log('📊 Processed ticket stats:', {
        total, open, inProgress, waiting, resolved, closed, resolvedLike, avgResolution, avgSatisfaction
      })

      const newOverview = {
        totalChamados: total,
        chamadosAbertos: open + inProgress + waiting,
        chamadosConcluidos: resolvedLike,
        tempoTotalResolucao: formatMinutesToHours(avgResolution),
        satisfacaoMedia: Number(avgSatisfaction?.toFixed?.(1) ?? avgSatisfaction),
        percentualResolucao: total > 0 ? Number(((resolvedLike / total) * 100).toFixed(1)) : 0,
      }

      console.log('📊 Setting overview:', newOverview)
      setOverview(newOverview)

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
      console.log('📊 Processing categories:', sCats)

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

      console.log('📊 Category counts processed:', catCounts)

      // Se for um técnico, filtrar apenas categorias com chamados atribuídos a ele
      if (isAgent && agentId) {
        catCounts = catCounts.filter((c: { chamados: number }) => c.chamados > 0)
      }

      const catsTotal = catCounts.reduce((a: number, b: any) => a + b.chamados, 0)
      const finalDepartmentData = catCounts
        .filter((c: any) => c.chamados > 0)
        .map((c: any) => ({
          name: c.name,
          chamados: c.chamados,
          percentual: catsTotal > 0 ? Number(((c.chamados / catsTotal) * 100).toFixed(1)) : 0,
          tempoMedio: formatMinutesToHours(c.avgResMin),
          satisfacao: Number((c.avgSat || 0).toFixed(1)),
        }))

      console.log('📊 Final department data:', finalDepartmentData)
      console.log('📊 Setting departmentsData with length:', finalDepartmentData.length)
      setDepartmentsData(finalDepartmentData)
      // Os dados de técnicos e atividades serão definidos mais abaixo no código

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

      lastUpdateRef.current = now

    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Requisição cancelada')
        return
      }

      // Verificar se é um erro de permissão (403 Forbidden)
      if (e?.message?.includes('403')) {
        setError('Você não tem permissão para acessar estes relatórios. Por favor, contate o administrador do sistema.')
      } else {
        setError(e?.message || 'Erro ao carregar dados')
      }
      console.error('Erro detalhado:', e)
    } finally {
      isUpdatingRef.current = false
      setLoading(false)
    }
  }, [computeDateRange, agentId, isAgent, userName, fetchWithCache, formatMinutesToHours, user, authLoading])

  // SOLUÇÃO DEFINITIVA: Carregamento manual apenas quando necessário
  // Removido useEffect problemático que causava loop infinito

  // Função para carregar dados inicialmente
  const loadInitialData = useCallback(async () => {

    // Verificar se o usuário está autenticado e tem permissão
    if (!user || authLoading) {
      return
    }

    // Verificar se o usuário tem role adequada
    const userRole = user.role || user.userRole
    if (!userRole || !['Admin', 'Agent'].includes(userRole)) {
      setError('Você não tem permissão para acessar esta página.')
      return
    }

    // Evitar carregamento múltiplo
    if (isUpdatingRef.current) {
      return
    }

    // Verificar se já temos dados recentes (cache de 2 minutos)
    const now = Date.now()
    if (lastUpdateRef.current && now - lastUpdateRef.current < 120000) { // 2 minutos
      return
    }

    try {
      isUpdatingRef.current = true
      setLoading(true)
      setError(null)

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) {
        throw new Error('Não autenticado')
      }

      // Verificar se o token é válido
      try {
        jwtDecode(token)
      } catch (error) {
        throw new Error('Token inválido')
      }

      // Se o usuário for um técnico e ainda não temos o agentId, aguardar
      if (isAgent && !agentId) {
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
        reportsBaseUrl = '/helpdesk/agents/my-history';
      }

      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      }

      // Para técnicos, usar apenas as rotas do helpdesk
      if (isAgent && agentId) {
        const [statusJson, historyJson, activeJson] = await Promise.all([
          fetchWithCache(statusUrl, '', options),
          fetchWithCache('/helpdesk/agents/my-history', 'limit=10', options),
          fetchWithCache('/helpdesk/agents/my-tickets', 'limit=5', options)
        ])

        // Processar dados das estatísticas do agente
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
          tempoTotalResolucao: formatMinutesToHours(Number(stats.totalResolutionTime || 0)),
          satisfacaoMedia: Number((stats.avgSatisfaction || 0).toFixed(1)),
          percentualResolucao: totalAssigned > 0 ? Number(((concluded / totalAssigned) * 100).toFixed(1)) : 0,
        })

        setStatusBreakdown(ticketsByStatus)

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

        const histTickets = Array.isArray(historyJson?.tickets) ? historyJson.tickets : []
        const recent = histTickets.slice(0, 10).map((t: any) => {
          let statusDisplay = t.status
          switch (t.status) {
            case 'Resolved':
              statusDisplay = 'Concluído'
              break
            case 'Closed':
              statusDisplay = 'Fechado'
              break
            case 'Cancelled':
              statusDisplay = 'Cancelado'
              break
            default:
              statusDisplay = t.status
          }

          return {
            id: `#${t.id}`,
            title: t.title,
            status: statusDisplay,
            technician: userName || 'Você',
            time: typeof t.resolution_time === 'number' ? formatMinutesToHours(t.resolution_time) : '—',
            rating: t.satisfaction_rating ?? null,
          }
        })

        setRecentActivity(recent)
        
        // Para técnicos, não precisamos de dados de departamentos e técnicos
        setTopTechnicians([])
        setDepartmentsData([])

      } else {
        // Para admins, usar as rotas completas
        const [statusJson, catsJson, agentsJson, ticketsJson] = await Promise.all([
          fetchWithCache(statusUrl, '', options),
          fetchWithCache(reportsBaseUrl, `report_type=categories&start_date=${startParam}&end_date=${endParam}${agentParam}`, options),
          fetchWithCache(reportsBaseUrl, `report_type=agents&start_date=${startParam}&end_date=${endParam}${agentParam}`, options),
          fetchWithCache(reportsBaseUrl, `report_type=tickets&start_date=${startParam}&end_date=${endParam}${agentParam}`, options)
        ])

        // Processar dados para admin
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
          tempoTotalResolucao: formatMinutesToHours(avgResolution),
          satisfacaoMedia: Number(avgSatisfaction?.toFixed?.(1) ?? avgSatisfaction),
          percentualResolucao: total > 0 ? Number(((resolvedLike / total) * 100).toFixed(1)) : 0,
        })

        // Processar dados de prioridades
        const pr = tickets.priorities || {}
        
        // Fallback: calcular prioridades a partir dos tickets se não estiver no status
        let priorityData = pr
        if (Object.keys(pr).length === 0 && ticketsJson?.data) {
          const ticketsArray = ticketsJson.data
          priorityData = ticketsArray.reduce((acc: any, ticket: any) => {
            const priority = (ticket.priority || 'medium').toLowerCase()
            acc[priority] = (acc[priority] || 0) + 1
            return acc
          }, {})
        }
        
        const totalPriorities = ['low', 'medium', 'high', 'critical']
          .map((k) => Number(priorityData[k] || 0))
          .reduce((a, b) => a + b, 0)
        const pData = [
          { key: 'high', name: 'Alta', color: 'red' as const },
          { key: 'medium', name: 'Média', color: 'yellow' as const },
          { key: 'low', name: 'Baixa', color: 'green' as const },
          { key: 'critical', name: 'Crítica', color: 'blue' as const },
        ].map((p) => {
          const count = Number(priorityData[p.key as keyof typeof priorityData] || 0)
          return { name: p.name, count, percentual: totalPriorities > 0 ? Number(((count / totalPriorities) * 100).toFixed(1)) : 0, color: p.color }
        })
        const filteredPriorities = pData.filter((x) => x.count > 0)
        setPrioritiesData(filteredPriorities)

        // Processar dados de departamentos
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

        const catsTotal = catCounts.reduce((a: number, b: any) => a + b.chamados, 0)
        
        const filteredDepartments = catCounts
          .map((c: any) => {
            return {
              name: c.name,
              chamados: c.chamados,
              percentual: catsTotal > 0 ? Number(((c.chamados / catsTotal) * 100).toFixed(1)) : 0,
              tempoMedio: formatMinutesToHours(c.avgResMin),
              satisfacao: Number((c.avgSat || 0).toFixed(1)),
            }
          })
        
        setDepartmentsData(filteredDepartments)

        // Processar dados de técnicos
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

        const sortedTechs = techs.sort((a, b) => b.chamados - a.chamados).slice(0, 8)
        setTopTechnicians(sortedTechs)

        // Processar atividades recentes
        const ticketsArr = ticketsJson?.data || []
        const recent = ticketsArr
          .sort((a: any, b: any) => new Date(b.modified_at || b.created_at).getTime() - new Date(a.modified_at || a.created_at).getTime())
          .slice(0, 3)
          .map((t: any) => {
            const lastAssignment = Array.isArray(t.ticket_assignments) && t.ticket_assignments.length
              ? t.ticket_assignments[t.ticket_assignments.length - 1]
              : null
            const technician = lastAssignment?.agent?.user?.name || '—'
            const rating = t.satisfaction_rating ?? null
            const time = typeof t.resolution_time === 'number' ? formatMinutesToHours(t.resolution_time) : '—'
            return { id: `#${t.id}`, title: t.title, status: t.status, technician, time, rating }
          })
        setRecentActivity(recent)

        // Processar breakdown de status
        const statusBreakdown = {
          Open: open,
          InProgress: inProgress,
          WaitingForClient: waiting,
          Resolved: resolved,
          Closed: closed
        }
        setStatusBreakdown(statusBreakdown)

        // Processar dados de satisfação
        const ticketsWithSatisfaction = ticketsArr.filter((t: any) => t.satisfaction_rating !== null && t.satisfaction_rating > 0)
        const satisfactionCounts = [0, 0, 0, 0, 0] // [1, 2, 3, 4, 5]

        ticketsWithSatisfaction.forEach((ticket: any) => {
          const rating = ticket.satisfaction_rating
          if (rating >= 1 && rating <= 5) {
            satisfactionCounts[rating - 1]++
          }
        })

        const totalRatings = satisfactionCounts.reduce((a, b) => a + b, 0)
        const satisfactionDist = satisfactionCounts.map((count, index) => ({
          rating: index + 1,
          count,
          percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
        })).filter(item => item.count > 0)

        setSatisfactionDistribution(satisfactionDist)

        // Processar timeline de satisfação
        const ticketsWithSatisfactionAndDate = ticketsArr.filter((t: any) =>
          t.satisfaction_rating !== null &&
          t.satisfaction_rating > 0 &&
          t.closed_at
        )

        const monthlySatisfaction = new Map<string, { totalRating: number; count: number }>()

        ticketsWithSatisfactionAndDate.forEach((ticket: any) => {
          const closedDate = new Date(ticket.closed_at)
          const monthKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, '0')}`

          if (!monthlySatisfaction.has(monthKey)) {
            monthlySatisfaction.set(monthKey, { totalRating: 0, count: 0 })
          }

          const current = monthlySatisfaction.get(monthKey)!
          current.totalRating += ticket.satisfaction_rating
          current.count += 1
        })

        const timelineData = Array.from(monthlySatisfaction.entries())
          .map(([date, data]) => ({
            date,
            avgRating: data.count > 0 ? Number((data.totalRating / data.count).toFixed(1)) : 0,
            count: data.count
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setSatisfactionTimeline(timelineData)

        // Processar todas as avaliações individuais
        const allRatings = ticketsWithSatisfaction.map((t: any) => ({
          id: t.id,
          ticket_number: t.ticket_number,
          satisfaction_rating: t.satisfaction_rating,
          closed_at: t.closed_at,
          title: t.title
        }))
        setAllSatisfactionRatings(allRatings)

        // Processar tickets ativos
        const activeTicketsData = ticketsArr
          .filter((t: any) => ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'].includes(t.status))
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            priority: t.priority || 'Medium',
            status: t.status || 'Open',
            created_at: t.created_at || new Date().toISOString()
          }))
        setActiveTickets(activeTicketsData)

        // Processar evolução de tickets ao longo do tempo
        const ticketsWithDates = ticketsArr.filter((t: any) => t.created_at)
        const dailyTickets = new Map<string, { abertos: number; concluidos: number; total: number }>()

        // Inicializar com os últimos 30 dias
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateKey = date.toISOString().split('T')[0]
          dailyTickets.set(dateKey, { abertos: 0, concluidos: 0, total: 0 })
        }

        ticketsWithDates.forEach((ticket: any) => {
          const createdDate = new Date(ticket.created_at).toISOString().split('T')[0]
          if (dailyTickets.has(createdDate)) {
            const current = dailyTickets.get(createdDate)!
            current.total += 1
            
            if (['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty'].includes(ticket.status)) {
              current.abertos += 1
            } else if (['Resolved', 'Closed'].includes(ticket.status)) {
              current.concluidos += 1
            }
          }
        })

        const ticketsTimelineData = Array.from(dailyTickets.entries())
          .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            abertos: data.abertos,
            concluidos: data.concluidos,
            total: data.total
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setTicketsOverTime(ticketsTimelineData)
      }

      lastUpdateRef.current = Date.now()

    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.log('Requisição cancelada')
        return
      }

      if (e?.message?.includes('403')) {
        setError('Você não tem permissão para acessar estes relatórios.')
      } else {
        setError(e?.message || 'Erro ao carregar dados')
      }
      console.error('Erro detalhado:', e)
    } finally {
      isUpdatingRef.current = false
      setLoading(false)
    }
  }, [user, authLoading, computeDateRange, agentId, isAgent, userName, fetchWithCache, formatMinutesToHours])

  // Carregar dados apenas quando o usuário estiver pronto e o tipo de usuário for determinado
  useEffect(() => {
    // Evitar execuções desnecessárias
    if (!user || authLoading) {
      return
    }

    // Verificar se já temos dados recentes
    const now = Date.now()
    if (lastUpdateRef.current && now - lastUpdateRef.current < 120000) { // 2 minutos
      return
    }

    // Usar setTimeout para evitar execução imediata e possíveis loops
    const timeoutId = setTimeout(() => {
      if (!isAgent && agentId !== null && agentId !== undefined) {
        // Para admin, carregar imediatamente
        loadInitialData()
      } else if (isAgent && agentId && agentId > 0) {
        // Para técnico, carregar apenas quando tivermos o agentId
        loadInitialData()
      }
    }, 100) // Pequeno delay para evitar execução imediata

    return () => clearTimeout(timeoutId)
  }, [user, authLoading, isAgent, agentId]) // Remover loadInitialData das dependências





  // Função para recarregar dados manualmente
  const handleRefresh = useCallback(() => {
    cacheRef.current.clear() // Limpa o cache
    lastUpdateRef.current = 0 // Reset do timestamp
    loadInitialData() // Usa a função otimizada
  }, [])

  // Função para exportar dados dos relatórios para Excel
  const handleExportExcel = async () => {
    setExporting(true)
    try {

      // Garantir que os dados não sejam undefined
      const safeDepartments = departmentsData || []
      const safePriorities = prioritiesData || []
      const safeTechnicians = topTechnicians || []
      const safeRecentActivity = recentActivity || []
      const safeStatusBreakdown = statusBreakdown || {}
      const safeOverview = overview || {
        totalChamados: 0,
        chamadosAbertos: 0,
        chamadosConcluidos: 0,
        tempoTotalResolucao: '0h',
        satisfacaoMedia: 0,
        percentualResolucao: 0
      }

      const reportData: ReportData = {
        departments: safeDepartments,
        priorities: safePriorities,
        technicians: safeTechnicians,
        overview: safeOverview,
        recentActivity: safeRecentActivity,
        statusBreakdown: safeStatusBreakdown,
        ticketsOverTime: !isAgent ? ticketsOverTime : undefined,
        satisfactionDistribution: satisfactionDistribution.length > 0 ? satisfactionDistribution : undefined
      }



      const periodLabel = 'Último mês'
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
      // Garantir que os dados não sejam undefined
      const safeDepartments = departmentsData || []
      const safePriorities = prioritiesData || []
      const safeTechnicians = topTechnicians || []
      const safeRecentActivity = recentActivity || []
      const safeStatusBreakdown = statusBreakdown || {}
      const safeOverview = overview || {
        totalChamados: 0,
        chamadosAbertos: 0,
        chamadosConcluidos: 0,
        tempoTotalResolucao: '0h',
        satisfacaoMedia: 0,
        percentualResolucao: 0
      }

      const reportData: ReportData = {
        departments: safeDepartments,
        priorities: safePriorities,
        technicians: safeTechnicians,
        overview: safeOverview,
        recentActivity: safeRecentActivity,
        statusBreakdown: safeStatusBreakdown,
        ticketsOverTime: !isAgent ? ticketsOverTime : undefined,
        satisfactionDistribution: satisfactionDistribution.length > 0 ? satisfactionDistribution : undefined
      }

      const periodLabel = 'Último mês'
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
      const periodLabel = 'Último mês'
      const fileName = `relatorio-senai-html-${periodLabel}-${new Date().toISOString().slice(0, 10)}.pdf`
      await exportHTMLToPDF('reports-container', fileName)
    } catch (error) {
      console.error('Erro ao exportar HTML para PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  // Função para navegar para os detalhes do ticket
  const handleViewTicketDetails = (ticketId: string) => {
    // Navegar para a página de chamados
    router.push('/pages/called')
  }

  // Função para ver histórico completo
  const handleViewCompleteHistory = () => {
    // Navegar para a página de tickets
    router.push('/pages/called')
  }



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

  // Verificar permissões
  const userRole = user?.role || user?.userRole
  const hasPermission = userRole && ['Admin', 'Agent', 'admin', 'agent'].includes(userRole)
  
  // Debug para identificar o problema
  console.log('🔍 Debug - Reports Page Auth:', {
    user,
    userRole,
    hasPermission,
    authLoading,
    isAgent,
    userName
  })
  



  // Determinar o tipo de usuário para o layout
  const userType = isAgent ? 'agent' : 'admin';

  // Mostrar loading enquanto verifica autenticação ou se o usuário ainda não foi carregado
  if (authLoading || !user) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Verificando permissões...</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  // Verificar se o usuário tem permissão
  if (!hasPermission) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
            <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
            <p className="text-sm text-gray-500">Contate o administrador do sistema se acredita que isso é um erro.</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout
      userType={isAgent ? 'tecnico' : 'admin'}
      userName={userName || 'Usuário SENAI'}
      userEmail=""
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >

      <div id="reports-container" className="w-full max-w-full overflow-x-hidden px-4">
        {/* Header */}
        <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 py-16 lg:py-4">
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
            <div className="flex flex-wrap gap-3 w-full md:w-auto max-w-full">

              <button
                className={`px-4 py-2 rounded-lg border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
                  } transition-colors flex items-center space-x-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleExportExcel}
                disabled={exporting}
              >
                <FaFileExport />
                <span>{exporting ? t('reports.export.exporting') : t('reports.export.excel')}</span>
              </button>
              <button
                className={`px-4 py-2 rounded-lg border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
                  } transition-colors flex items-center space-x-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleExportPDF}
                disabled={exporting}
              >
                <FaPrint />
                <span>{exporting ? t('reports.export.exporting') : t('reports.export.pdf')}</span>
              </button>

            </div>
          </div>


        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full max-w-full overflow-x-hidden">
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
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tempo Total</p>
                <p className="text-3xl font-bold text-yellow-500">{overview.tempoTotalResolucao}</p>
                <div className="flex items-center mt-2">
                  {getTrendIcon(0, 0)}
                  <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>—</span>
                </div>
              </div>
              <FaClock className="text-yellow-500 text-2xl" />
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
          {/* Priority Distribution - Pie Chart */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.priorityDistribution')}
            </h3>
            {prioritiesData.length > 0 ? (
              <div data-chart-id="priorities-chart" className="w-full max-w-full overflow-x-hidden">
              <PieChart
                data={{
                  labels: prioritiesData.map(p => p.name),
                  datasets: [{
                    data: prioritiesData.map(p => p.count),
                    backgroundColor: prioritiesData.map(p => {
                      switch (p.color) {
                        case 'red': return '#EF4444'
                        case 'yellow': return '#F59E0B'
                        case 'green': return '#10B981'
                        case 'blue': return '#3B82F6'
                        default: return '#6B7280'
                      }
                    }),
                    borderColor: prioritiesData.map(p => {
                      switch (p.color) {
                        case 'red': return '#DC2626'
                        case 'yellow': return '#D97706'
                        case 'green': return '#059669'
                        case 'blue': return '#2563EB'
                        default: return '#4B5563'
                      }
                    }),
                    borderWidth: 2
                  }]
                }}
                height={250}
                isDark={theme === 'dark'}
              />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {t('reports.noDataForPeriod')}
                </p>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.statusDistribution')}
            </h3>
            {Object.keys(statusBreakdown).length > 0 ? (
              <div data-chart-id="status-chart">
              <PieChart
                data={{
                  labels: Object.keys(statusBreakdown).map(status => {
                    switch (status) {
                      case 'Open': return t('reports.status.open')
                      case 'InProgress': return t('reports.status.inProgress')
                      case 'WaitingForClient': return t('reports.status.waitingForClient')
                      case 'WaitingForThirdParty': return t('reports.status.waitingForThirdParty')
                      case 'Resolved': return t('reports.status.resolved')
                      case 'Closed': return t('reports.status.closed')
                      case 'Cancelled': return t('reports.status.cancelled')
                      default: return status
                    }
                  }),
                  datasets: [{
                    data: Object.values(statusBreakdown),
                    backgroundColor: [
                      '#3B82F6', // Azul - Aberto
                      '#F59E0B', // Amarelo - Em Andamento
                      '#EF4444', // Vermelho - Aguardando Cliente
                      '#8B5CF6', // Roxo - Aguardando Terceiros
                      '#10B981', // Verde - Resolvido
                      '#6B7280', // Cinza - Fechado
                      '#DC2626'  // Vermelho escuro - Cancelado
                    ],
                    borderColor: [
                      '#2563EB',
                      '#D97706',
                      '#DC2626',
                      '#7C3AED',
                      '#059669',
                      '#4B5563',
                      '#B91C1C'
                    ],
                    borderWidth: 2
                  }]
                }}
                height={200}
                isDark={theme === 'dark'}
              />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {t('reports.noStatusData')}
                </p>
              </div>
            )}
          </div>

          {/* Department Distribution - Bar Chart */}
          {(!isAgent || departmentsData.length > 0) && (
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('reports.departmentDistribution')}
              </h3>
              {departmentsData.length > 0 ? (
                <div data-chart-id="departments-chart" className="w-full max-w-full overflow-x-hidden">
                <BarChart
                  data={{
                    labels: departmentsData.map(d => d.name),
                    datasets: [{
                      label: t('reports.tickets'),
                      data: departmentsData.map(d => d.chamados),
                      backgroundColor: departmentsData.map((_, index) => {
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
                        return colors[index % colors.length]
                      }),
                      borderColor: departmentsData.map((_, index) => {
                        const colors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2']
                        return colors[index % colors.length]
                      }),
                      borderWidth: 1
                    }]
                  }}
                  height={250}
                  isDark={theme === 'dark'}
                />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    {t('reports.noDataForPeriod')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Evolução de Tickets - Gráfico de Linha (apenas para admin) */}
          {!isAgent && (
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('reports.ticketEvolution')}
              </h3>
              {ticketsOverTime.length > 0 ? (
                <div data-chart-id="evolution-chart" className="w-full max-w-full overflow-x-hidden">
                  <LineChart
                    data={{
                      labels: ticketsOverTime.map(d => d.date),
                      datasets: [
                        {
                          label: t('reports.totalTickets'),
                          data: ticketsOverTime.map(d => d.total),
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4
                        },
                        {
                          label: t('reports.openTickets'),
                          data: ticketsOverTime.map(d => d.abertos),
                          borderColor: '#EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          tension: 0.4
                        },
                        {
                          label: t('reports.completedTickets'),
                          data: ticketsOverTime.map(d => d.concluidos),
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.4
                        }
                      ]
                    }}
                    height={250}
                    isDark={theme === 'dark'}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    {t('reports.noEvolutionData')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tendências de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 justify-items-center">
          {/* Card: Tickets por Status */}
          <div className={`rounded-xl p-6 h-full flex flex-col justify-between w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.performanceTrends')}
            </h3>
            {Object.keys(statusBreakdown).length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                <BarChart
                  data={{
                    labels: Object.keys(statusBreakdown).map(status => {
                      switch (status) {
                        case 'Open': return t('reports.status.open')
                        case 'InProgress': return t('reports.status.inProgress')
                        case 'WaitingForClient': return t('reports.status.waitingForClient')
                        case 'WaitingForThirdParty': return t('reports.status.waitingForThirdParty')
                        case 'Resolved': return t('reports.status.resolved')
                        case 'Closed': return t('reports.status.closed')
                        case 'Cancelled': return t('reports.status.cancelled')
                        default: return status
                      }
                    }),
                    datasets: [{
                      label: t('reports.quantity'),
                      data: Object.values(statusBreakdown),
                      backgroundColor: Object.keys(statusBreakdown).map((status, index) => {
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#DC2626']
                        return colors[index % colors.length]
                      }),
                      borderColor: Object.keys(statusBreakdown).map((status, index) => {
                        const colors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#B91C1C']
                        return colors[index % colors.length]
                      }),
                      borderWidth: 1
                    }]
                  }}
                  height={200}
                  isDark={theme === 'dark'}
                />
                {/* Informação adicional abaixo do gráfico */}
                <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('reports.totalTicketsLabel')} <span className="font-semibold">{Object.values(statusBreakdown).reduce((acc, val) => acc + val, 0)}</span>
                  <br />
                  {t('reports.statusWithMostTickets')} <span className="font-semibold">
                    {(() => {
                      const entries = Object.entries(statusBreakdown)
                      if (entries.length === 0) return '-'
                      const [statusMaior] = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max)
                      switch (statusMaior) {
                        case 'Open': return t('reports.status.open')
                        case 'InProgress': return t('reports.status.inProgress')
                        case 'WaitingForClient': return t('reports.status.waitingForClient')
                        case 'WaitingForThirdParty': return t('reports.status.waitingForThirdParty')
                        case 'Resolved': return t('reports.status.resolved')
                        case 'Closed': return t('reports.status.closed')
                        case 'Cancelled': return t('reports.status.cancelled')
                        default: return statusMaior
                      }
                    })()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {t('reports.noStatusData')}
                </p>
              </div>
            )}
          </div>

          {/* Card: Satisfação do Cliente */}
          <div className={`rounded-xl p-6 h-full flex flex-col justify-between w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.customerSatisfaction')}
            </h3>
            {allSatisfactionRatings.length > 0 ? (
              <div className="space-y-4 flex flex-col h-full">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {overview.satisfacaoMedia}/5
                  </div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`text-lg ${star <= Math.round(overview.satisfacaoMedia)
                            ? 'text-yellow-400'
                            : theme === 'dark'
                              ? 'text-gray-600'
                              : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                 
                </div>

                {/* Gráfico de Linha com Média Acumulada */}
                <LineChart
                  data={{
                    labels: allSatisfactionRatings.map((rating, index) => {
                      return `Ticket ${index + 1}`
                    }),
                    datasets: [{
                      label: 'Média Acumulada',
                      data: allSatisfactionRatings.map((rating, index) => {
                        // Calcular média acumulada até este ticket (apenas com avaliações válidas)
                        const ratingsUpToNow = allSatisfactionRatings.slice(0, index + 1)
                        const validRatings = ratingsUpToNow.filter((r: any) => (r as any).hasRating)
                        if (validRatings.length === 0) return 0
                        const sum = validRatings.reduce((acc, r) => acc + r.satisfaction_rating, 0)
                        return Number((sum / validRatings.length).toFixed(1))
                      }),
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4
                    }]
                  }}
                  height={150}
                  isDark={theme === 'dark'}
                />

                {/* Lista de todas as avaliações com média acumulada */}
                <div className="max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-500 space-y-1">
                    {allSatisfactionRatings.map((rating, index) => {
                      const date = new Date(rating.closed_at)
                      const formattedDate = date.toLocaleDateString('pt-BR')
                      // Calcular média acumulada até este ticket (apenas com avaliações válidas)
                      const ratingsUpToNow = allSatisfactionRatings.slice(0, index + 1)
                      const validRatings = ratingsUpToNow.filter((r: any) => r.hasRating)
                      let avgUpToNow = 0
                      if (validRatings.length > 0) {
                        const sum = validRatings.reduce((acc: number, r: any) => acc + r.satisfaction_rating, 0)
                        avgUpToNow = Number((sum / validRatings.length).toFixed(1))
                      }

                      return (
                        <div key={rating.id} className="flex justify-between items-center">
                          <span>
                            Ticket {index + 1}: 
                            {(rating as any).hasRating ? (
                              `${rating.satisfaction_rating}★`
                            ) : (
                              <span className="text-gray-400">Aguardando avaliação</span>
                            )}
                            {validRatings.length > 0 && ` (Média: ${avgUpToNow}★)`}
                          </span>
                          <span>{formattedDate}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Distribuição por Avaliação */}
                {satisfactionDistribution.length > 0 && (
                  <div className="mt-4">
                   
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {t('reports.noSatisfactionData')}
                </p>
              </div>
            )}
          </div>
        </div>



        {/* Top Technicians - Visível apenas para administradores */}
        {!isAgent && (
          <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('reports.topTechnicians')}
              </h3>
              <button
                onClick={handleViewCompleteHistory}
                className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:underline transition-colors`}
              >
                {t('reports.viewAll')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topTechnicians.map((technician, index) => (
                <div key={index} className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} max-w-full overflow-hidden`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {technician.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                        {technician.name}
                      </h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                        {technician.departamento}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('reports.technicians.tickets')}</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {technician.chamados}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('reports.technicians.satisfaction')}</span>
                      <span className="font-medium text-green-500">{technician.satisfacao}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('reports.technicians.avgTime')}</span>
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
              {t('reports.recentActivities')}
            </h3>
            <button
              onClick={handleViewCompleteHistory}
              className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:underline transition-colors`}
            >
                              {t('reports.viewCompleteHistory')}
            </button>
          </div>

          <div className="space-y-4 max-w-full">
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {t('reports.noRecentActivity')}
                </p>
              </div>
            )}
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} cursor-pointer hover:shadow-md transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} max-w-full overflow-hidden`}
                onClick={() => handleViewTicketDetails(activity.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap">
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex-shrink-0`}>
                        {activity.id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${activity.status === 'Concluído' || activity.status === 'Resolved'
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                        }`}>
                        {activity.status}
                      </span>
                    </div>
                    <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words overflow-hidden`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {activity.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm flex-wrap gap-y-1">
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center flex-shrink-0`}>
                        <FaUser className="inline mr-1" />
                        <span className="truncate max-w-32">{activity.technician}</span>
                      </span>
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center flex-shrink-0`}>
                        <FaClock className="inline mr-1" />
                        {activity.time}
                      </span>
                      {activity.rating && (
                        <span className="text-green-500 flex items-center flex-shrink-0">
                          <FaStar className="inline mr-1" />
                          {activity.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg flex-shrink-0 ${theme === 'dark'
                    ? 'bg-gray-600 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                    } transition-colors`}>
                    <FaEye />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
  