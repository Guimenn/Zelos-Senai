'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
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
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) throw new Error('Não autenticado')

        const { start, end } = computeDateRange
        const startParam = encodeURIComponent(start.toISOString())
        const endParam = encodeURIComponent(end.toISOString())

        const [statusResp, catsResp, agentsResp, ticketsResp] = await Promise.all([
          fetch('/admin/status', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/admin/reports?report_type=categories&start_date=${startParam}&end_date=${endParam}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/admin/reports?report_type=agents&start_date=${startParam}&end_date=${endParam}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/admin/reports?report_type=tickets&start_date=${startParam}&end_date=${endParam}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        ])

        if (!statusResp.ok) throw new Error('Falha ao carregar status do sistema')
        if (!catsResp.ok) throw new Error('Falha ao carregar categorias')
        if (!agentsResp.ok) throw new Error('Falha ao carregar agentes')
        if (!ticketsResp.ok) throw new Error('Falha ao carregar tickets')

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
        const catCounts = sCats.map((c: any) => {
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
        const techs = (agents as any[]).map((a) => {
          const assignments = Array.isArray(a.ticket_assignments) ? a.ticket_assignments : []
          const tickets = assignments.map((ta: any) => ta.ticket).filter(Boolean)
          const chamados = tickets.length
          const avgRes = chamados ? tickets.reduce((acc: number, t: any) => acc + (t.resolution_time || 0), 0) / chamados : 0
          const avgSat = chamados ? tickets.reduce((acc: number, t: any) => acc + (t.satisfaction_rating || 0), 0) / chamados : 0
          const name = a?.user?.name || 'Técnico'
          const departamento = a?.department ?? null
          return { name, chamados, satisfacao: Number((avgSat || 0).toFixed(1)), tempoMedio: formatMinutesToHours(avgRes), departamento }
        })
        setTopTechnicians(techs.sort((a, b) => b.chamados - a.chamados).slice(0, 8))

        const ticketsArr = ticketsJson?.data || []
        const recent = (ticketsArr as any[])
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
        if (!controller.signal.aborted) setError(e?.message || 'Erro ao carregar dados')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [computeDateRange])

  // Função para exportar dados dos relatórios para CSV
  const handleExportCSV = () => {
    const headers = [
      'Departamento', 'Chamados', '% do Total', 'Tempo Médio de Resolução', 'Satisfação Média'
    ]
    const escape = (val: any) => {
      const s = String(val ?? '').replace(/\r|\n/g, ' ')
      if (s.includes('"') || s.includes(',') || s.includes(';')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = departmentsData.map(d => [
      d.name, d.chamados, d.percentual + '%', d.tempoMedio, d.satisfacao
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.href = url
    a.download = `relatorio-departamentos-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Função para exportar dados dos relatórios para PDF
  const handleExportPDF = () => {
    const htmlRows = departmentsData.map(d => `
      <tr>
        <td>${d.name ?? ''}</td>
        <td>${d.chamados ?? ''}</td>
        <td>${d.percentual ?? ''}%</td>
        <td>${d.tempoMedio ?? ''}</td>
        <td>${d.satisfacao ?? ''}</td>
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
          <meta charset=\"utf-8\" />
          ${style}
          <title>Relatório de Departamentos</title>
        </head>
        <body>
          <h1>Relatório de Departamentos</h1>
          <table>
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Chamados</th>
                <th>% do Total</th>
                <th>Tempo Médio de Resolução</th>
                <th>Satisfação Média</th>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios e Estatísticas</h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Análise detalhada de chamados, performance e métricas do sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
            } transition-colors flex items-center space-x-2`}
              onClick={handleExportCSV}
            >
              <FaDownload />
              <span>Exportar</span>
            </button>
            <button className={`px-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-50'
            } transition-colors flex items-center space-x-2`}
              onClick={handleExportPDF}
            >
              <FaPrint />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
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

            <div className="flex gap-2">
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaFilter />
              </button>
              <button className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}>
                <FaCog />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total de Chamados</p>
              <p className="text-3xl font-bold">{overview.totalChamados}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overview.totalChamados, overview.totalChamados)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sem variação</span>
              </div>
            </div>
            <FaClipboardList className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Taxa de Resolução</p>
              <p className="text-3xl font-bold text-green-500">{overview.percentualResolucao}%</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overview.percentualResolucao, overview.percentualResolucao)}
                <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sem variação</span>
              </div>
            </div>
            <FaCheckCircle className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tempo Médio</p>
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
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Satisfação</p>
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
          Carregando dados de relatórios...
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
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Distribuição por Departamento
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
          </div>
        </div>

        {/* Priority Distribution */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Distribuição por Prioridade
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
          </div>
        </div>
      </div>

      {/* Top Technicians */}
      <div className={`rounded-xl p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Melhores Técnicos
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

      {/* Recent Activity */}
      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Atividade Recente
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
    </ResponsiveLayout>
  )
}
