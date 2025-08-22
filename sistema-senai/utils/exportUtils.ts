import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

// Tipos para os dados de relatório
export interface ReportData {
  departments: Array<{
    name: string
    chamados: number
    percentual: number
    tempoMedio: string
    satisfacao: number
  }>
  priorities: Array<{
    name: string
    count: number
    percentual: number
    color: string
  }>
  technicians: Array<{
    name: string
    chamados: number
    satisfacao: number
    tempoMedio: string
    departamento?: string | null
  }>
  overview: {
    totalChamados: number
    chamadosAbertos: number
    chamadosConcluidos: number
    tempoTotalResolucao: string
    satisfacaoMedia: number
    percentualResolucao: number
  }
  recentActivity: Array<{
    id: string
    title: string
    status: string
    technician: string
    time: string
    rating: number | null
  }>
  statusBreakdown: Record<string, number>
  ticketsOverTime?: Array<{
    date: string
    abertos: number
    concluidos: number
    total: number
  }>
  satisfactionDistribution?: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

// Função para exportar dados em Excel com formatação bonita e múltiplas abas
export const exportToExcel = (data: ReportData, period: string) => {
  console.log('🔍 DEBUG - Iniciando exportação Excel:', {
    isTechnician: data.technicians && data.technicians.length === 0 && data.departments && data.departments.length === 0,
    departmentsLength: data.departments?.length || 0,
    prioritiesLength: data.priorities?.length || 0,
    techniciansLength: data.technicians?.length || 0
  })

  // Criar um novo workbook
  const workbook = XLSX.utils.book_new()
  
  // === ABA 1: RESUMO EXECUTIVO ===
  const isTechnician = data.technicians && data.technicians.length === 0 && data.departments && data.departments.length === 0
  
  const summaryData = [
    ['RELATÓRIO DE DESEMPENHO - SENAI'],
    [''],
    ['PERÍODO:', period],
    ['DATA DE GERAÇÃO:', new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })],
    [''],
    [isTechnician ? '📊 SEU RESUMO EXECUTIVO' : '📊 RESUMO EXECUTIVO'],
    [''],
    ['INDICADORES PRINCIPAIS'],
    ['Métrica', 'Valor', 'Descrição'],
    ['Total de Chamados', data.overview.totalChamados, isTechnician ? 'Seus tickets no período' : 'Número total de tickets no período'],
    ['Chamados Abertos', data.overview.chamadosAbertos, isTechnician ? 'Seus tickets em andamento' : 'Tickets em andamento ou aguardando'],
    ['Chamados Concluídos', data.overview.chamadosConcluidos, isTechnician ? 'Seus tickets resolvidos' : 'Tickets resolvidos e fechados'],
    ['Taxa de Resolução', `${data.overview.percentualResolucao}%`, 'Percentual de tickets resolvidos'],
    ['Tempo Médio Resolução', data.overview.tempoTotalResolucao, 'Tempo médio para resolver tickets'],
    ['Satisfação Média', `${data.overview.satisfacaoMedia}/5 ⭐`, isTechnician ? 'Sua avaliação média' : 'Avaliação média dos clientes'],
    [''],
    ['🎯 METAS E INDICADORES'],
    ['Indicador', 'Atual', 'Meta', 'Status'],
    ['Taxa de Resolução', `${data.overview.percentualResolucao}%`, '85%', data.overview.percentualResolucao >= 85 ? '✅ Atingida' : '⚠️ Abaixo da meta'],
    ['Satisfação', `${data.overview.satisfacaoMedia}/5`, '4.0/5', data.overview.satisfacaoMedia >= 4.0 ? '✅ Atingida' : '⚠️ Abaixo da meta'],
    ['Tickets Ativos', data.overview.chamadosAbertos, '< 20', data.overview.chamadosAbertos < 20 ? '✅ Dentro do limite' : '⚠️ Acima do limite'],
  ]

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Formatação da aba Resumo
  formatWorksheet(summaryWs, {
    titleRow: 0,
    subtitleRows: [5, 16],
    headerRows: [8, 17],
    titleColor: 'DC143C', // Vermelho SENAI
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // === ABA 2: DEPARTAMENTOS ===
  
  const deptData = [
    ['📍 ANÁLISE DE CHAMADOS'],
    [''],
    ['DISTRIBUIÇÃO DE CHAMADOS POR DEPARTAMENTO'],
    ['Departamento', 'Chamados', '% do Total', 'Tempo Médio', 'Satisfação', 'Performance'],
    ...(data.departments && data.departments.length > 0 ? data.departments.map(dept => [
      dept.name,
      dept.chamados,
      `${dept.percentual}%`,
      dept.tempoMedio,
      `${dept.satisfacao}/5`,
      dept.satisfacao >= 4.0 ? '🟢 Excelente' : dept.satisfacao >= 3.0 ? '🟡 Bom' : '🔴 Precisa melhorar'
    ]) : [['Nenhum departamento encontrado', '—', '—', '—', '—', '—']]),
    [''],
    ['📈 RANKING DOS DEPARTAMENTOS'],
    ['Posição', 'Departamento', 'Total de Chamados', 'Satisfação'],
    ...(data.departments && data.departments.length > 0 ? data.departments
      .sort((a, b) => b.chamados - a.chamados)
      .map((dept, index) => [
        `${index + 1}º`,
        dept.name,
        dept.chamados,
        `${dept.satisfacao}/5 ${dept.satisfacao >= 4.0 ? '⭐' : ''}`
      ]) : [['—', 'Nenhum departamento encontrado', '—', '—']])
  ]

  const deptWs = XLSX.utils.aoa_to_sheet(deptData)
  formatWorksheet(deptWs, {
    titleRow: 0,
    subtitleRows: [6],
    headerRows: [3, 8],
    titleColor: 'DC143C',
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // === ABA 3: TÉCNICOS ===
  
  const techData = [
    ['👤 SEU DESEMPENHO'],
    [''],
    ['SEU DESEMPENHO'],
    ['Posição', 'Nome', 'Chamados', 'Satisfação', 'Tempo Médio', 'Departamento', 'Avaliação'],
    ...(data.technicians && data.technicians.length > 0 ? data.technicians.map((tech, index) => [
      `${index + 1}º`,
      tech.name,
      tech.chamados,
      `${tech.satisfacao}/5`,
      tech.tempoMedio,
      tech.departamento || '—',
      tech.satisfacao >= 4.5 ? '🏆 Excelente' : 
      tech.satisfacao >= 4.0 ? '🥇 Muito Bom' :
      tech.satisfacao >= 3.5 ? '🥈 Bom' :
      tech.satisfacao >= 3.0 ? '🥉 Regular' : '❌ Precisa melhorar'
    ]) : [['—', 'Nenhum técnico encontrado', '—', '—', '—', '—', '—']]),
    [''],
    ['📊 SUAS ESTATÍSTICAS'],
    ['Métrica', 'Valor'],
    ['Total de Chamados Atendidos', (data.technicians || []).length > 0 ? (data.technicians || []).reduce((acc, t) => acc + t.chamados, 0) : 0],
    ['Satisfação Média', (data.technicians || []).length > 0 ? `${((data.technicians || []).reduce((acc, t) => acc + t.satisfacao, 0) / (data.technicians || []).length).toFixed(1)}/5` : '—'],
    ['Tempo Médio de Resolução', (data.technicians || []).length > 0 ? (data.technicians || []).reduce((acc, t) => acc + parseFloat(t.tempoMedio.split('h')[0]), 0) / (data.technicians || []).length + 'h' : '—'],
    ['Performance', (data.technicians || []).length > 0 ? ((data.technicians || []).reduce((acc, t) => acc + t.satisfacao, 0) / (data.technicians || []).length >= 4.0 ? '🟢 Excelente' : '🟡 Bom') : '—'],
  ]

  const techWs = XLSX.utils.aoa_to_sheet(techData)
  formatWorksheet(techWs, {
    titleRow: 0,
    subtitleRows: [6],
    headerRows: [3, 7],
    titleColor: 'DC143C',
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // === ABA 4: TICKETS E STATUS ===
  let ticketsData = [
    [isTechnician ? '🎫 SEUS TICKETS' : '🎫 ANÁLISE DE TICKETS'],
    [''],
    ['DISTRIBUIÇÃO POR PRIORIDADE'],
    ['Prioridade', 'Quantidade', '% do Total', 'Criticidade'],
    ...data.priorities.map(priority => [
      priority.name,
      priority.count,
      `${priority.percentual}%`,
      priority.name === 'Crítica' ? '🔴 Urgente' :
      priority.name === 'Alta' ? '🟠 Alta' :
      priority.name === 'Média' ? '🟡 Normal' : '🟢 Baixa'
    ]),
    [''],
    ['DISTRIBUIÇÃO POR STATUS'],
    ['Status', 'Quantidade', '% do Total'],
    ...Object.entries(data.statusBreakdown).map(([status, count]) => {
      const total = Object.values(data.statusBreakdown).reduce((acc, val) => acc + val, 0)
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      return [
        status === 'Open' ? '📂 Aberto' :
        status === 'InProgress' ? '⚙️ Em Andamento' :
        status === 'WaitingForClient' ? '⏳ Aguardando Cliente' :
        status === 'WaitingForThirdParty' ? '🔄 Aguardando Terceiros' :
        status === 'Resolved' ? '✅ Resolvido' :
        status === 'Closed' ? '📋 Fechado' :
        status === 'Cancelled' ? '❌ Cancelado' : status,
        count,
        `${percentage}%`
      ]
    }),
  ]

  // Adicionar evolução de tickets se disponível
  if (data.ticketsOverTime && data.ticketsOverTime.length > 0) {
    ticketsData.push(
      [''],
      ['📈 EVOLUÇÃO TEMPORAL (ÚLTIMOS 30 DIAS)'],
      ['Data', 'Total', 'Abertos', 'Concluídos', 'Taxa Conclusão'],
      ...data.ticketsOverTime.map(item => [
        item.date,
        item.total,
        item.abertos,
        item.concluidos,
        item.total > 0 ? `${((item.concluidos / item.total) * 100).toFixed(1)}%` : '0%'
      ])
    )
  }

  const ticketsWs = XLSX.utils.aoa_to_sheet(ticketsData)
  formatWorksheet(ticketsWs, {
    titleRow: 0,
    subtitleRows: data.ticketsOverTime ? [6, 13] : [6],
    headerRows: data.ticketsOverTime ? [3, 7, 14] : [3, 7],
    titleColor: 'DC143C',
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // === ABA 5: SATISFAÇÃO ===
  let satisfactionData = [
    [isTechnician ? '⭐ SUA SATISFAÇÃO' : '⭐ ANÁLISE DE SATISFAÇÃO'],
    [''],
    ['RESUMO DE SATISFAÇÃO'],
    ['Métrica', 'Valor', 'Comentário'],
    ['Satisfação Média Geral', `${data.overview.satisfacaoMedia}/5`, data.overview.satisfacaoMedia >= 4.0 ? '🟢 Excelente' : data.overview.satisfacaoMedia >= 3.0 ? '🟡 Bom' : '🔴 Precisa melhorar'],
    ['Total de Avaliações', data.satisfactionDistribution?.reduce((acc, item) => acc + item.count, 0) || 0, 'Número de tickets avaliados'],
  ]

  if (data.satisfactionDistribution && data.satisfactionDistribution.length > 0) {
    satisfactionData.push(
      [''],
      ['DISTRIBUIÇÃO DAS AVALIAÇÕES'],
      ['Avaliação', 'Quantidade', 'Percentual', 'Emoji'],
      ...data.satisfactionDistribution.map(item => [
        `${item.rating} estrela${item.rating > 1 ? 's' : ''}`,
        item.count,
        `${item.percentage}%`,
        item.rating >= 5 ? '⭐⭐⭐⭐⭐' :
        item.rating >= 4 ? '⭐⭐⭐⭐' :
        item.rating >= 3 ? '⭐⭐⭐' :
        item.rating >= 2 ? '⭐⭐' : '⭐'
      ])
    )
  }

  const satisfactionWs = XLSX.utils.aoa_to_sheet(satisfactionData)
  formatWorksheet(satisfactionWs, {
    titleRow: 0,
    subtitleRows: data.satisfactionDistribution ? [6] : [],
    headerRows: data.satisfactionDistribution ? [3, 7] : [3],
    titleColor: 'DC143C',
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // === ABA 6: ATIVIDADE RECENTE ===
  const activityData = [
    [isTechnician ? '🕒 SUA ATIVIDADE RECENTE' : '🕒 ATIVIDADE RECENTE'],
    [''],
    [isTechnician ? 'SEUS ÚLTIMOS TICKETS' : 'ÚLTIMOS TICKETS PROCESSADOS'],
    ['ID', 'Título', 'Status', 'Técnico', 'Tempo Resolução', 'Avaliação', 'Indicador'],
    ...data.recentActivity.map(activity => [
      activity.id,
      activity.title,
      activity.status,
      activity.technician,
      activity.time,
      activity.rating ? `${activity.rating}/5` : '—',
      activity.rating ? 
        (activity.rating >= 4 ? '🟢 Satisfeito' : activity.rating >= 3 ? '🟡 Regular' : '🔴 Insatisfeito') 
        : '⚪ Não avaliado'
    ])
  ]

  const activityWs = XLSX.utils.aoa_to_sheet(activityData)
  formatWorksheet(activityWs, {
    titleRow: 0,
    headerRows: [3],
    titleColor: 'DC143C',
    subtitleColor: '4472C4',
    headerColor: 'E7E6E6'
  })

  // Adicionar abas ao workbook (diferentes para admin e técnico)
  XLSX.utils.book_append_sheet(workbook, summaryWs, '📊 Resumo Executivo')
  
  // Abas específicas para admin
  if (data.departments && data.departments.length > 0 && data.departments[0].name !== 'Seus Chamados') {
    XLSX.utils.book_append_sheet(workbook, deptWs, '📍 Departamentos')
  }
  
  if (data.technicians && data.technicians.length > 0 && data.technicians[0].name !== 'Você') {
    XLSX.utils.book_append_sheet(workbook, techWs, '👥 Técnicos')
  }
  
  XLSX.utils.book_append_sheet(workbook, ticketsWs, '🎫 Tickets & Status')
  XLSX.utils.book_append_sheet(workbook, satisfactionWs, '⭐ Satisfação')
  XLSX.utils.book_append_sheet(workbook, activityWs, '🕒 Atividade Recente')

  // Gerar arquivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  const fileName = `relatorio-senai-${isTechnician ? 'tecnico' : 'completo'}-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`
  saveAs(blob, fileName)
}

// Função auxiliar para formatação de worksheets
function formatWorksheet(worksheet: any, options: {
  titleRow?: number
  subtitleRows?: number[]
  headerRows?: number[]
  titleColor?: string
  subtitleColor?: string
  headerColor?: string
}) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Formatação do título principal
  if (options.titleRow !== undefined) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: options.titleRow, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 16, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: options.titleColor || 'DC143C' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }
    }
  }

  // Formatação dos subtítulos
  options.subtitleRows?.forEach(row => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, size: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: options.subtitleColor || '4472C4' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      }
    }
  })

  // Formatação dos cabeçalhos de tabela
  options.headerRows?.forEach(row => {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 12 },
          fill: { fgColor: { rgb: options.headerColor || 'E7E6E6' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        }
      }
    }
  })

  // Bordas para todas as células com dados
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellAddress] && !worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          },
          alignment: { vertical: 'center' }
        }
      }
    }
  }

  // Ajustar largura das colunas automaticamente
  const colWidths = []
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 10
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellAddress] && worksheet[cellAddress].v) {
        const cellLength = worksheet[cellAddress].v.toString().length
        maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50))
      }
    }
    colWidths.push({ width: maxWidth })
  }
  worksheet['!cols'] = colWidths
}

// Função para capturar gráfico como imagem
const captureChartAsImage = async (chartId: string): Promise<string | null> => {
  try {
    const chartElement = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement
    if (!chartElement) {
      console.warn(`Gráfico ${chartId} não encontrado`)
      return null
    }

    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: chartElement.offsetWidth,
      height: chartElement.offsetHeight
    })

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error(`Erro ao capturar gráfico ${chartId}:`, error)
    return null
  }
}

// Função para exportar dados em PDF com formatação bonita e gráficos
export const exportToPDF = async (data: ReportData, period: string) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Configurações de fonte
  const titleFontSize = 18
  const subtitleFontSize = 14
  const normalFontSize = 10
  const smallFontSize = 8

  // Cabeçalho
  pdf.setFontSize(titleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196) // Azul SENAI
  pdf.text('RELATÓRIO DE DESEMPENHO - SENAI', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 15
  
  // Informações do período
  pdf.setFontSize(normalFontSize)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Período: ${period}`, margin, yPosition)
  yPosition += 8
  pdf.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition)
  yPosition += 20

  // Visão Geral
  pdf.setFontSize(subtitleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('VISÃO GERAL', margin, yPosition)
  yPosition += 10

  // Criar tabela de visão geral
  const overviewTable = [
    ['Total de Chamados', data.overview.totalChamados.toString()],
    ['Chamados Abertos', data.overview.chamadosAbertos.toString()],
    ['Chamados Concluídos', data.overview.chamadosConcluidos.toString()],
    ['Taxa de Resolução', `${data.overview.percentualResolucao}%`],
    ['Tempo Total de Resolução', data.overview.tempoTotalResolucao],
    ['Satisfação Média', `${data.overview.satisfacaoMedia}/5`]
  ]

  yPosition = drawTable(pdf, overviewTable, margin, yPosition, pageWidth - 2 * margin)
  yPosition += 15

  // Verificar se precisa de nova página
  if (yPosition > pageHeight - 100) {
    pdf.addPage()
    yPosition = margin
  }

  // Distribuição por Departamento
  pdf.setFontSize(subtitleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('DISTRIBUIÇÃO POR DEPARTAMENTO', margin, yPosition)
  yPosition += 10

  const deptTable = [
    ['Departamento', 'Chamados', '% do Total', 'Tempo Médio', 'Satisfação'],
    ...data.departments.map(dept => [
      dept.name,
      dept.chamados.toString(),
      `${dept.percentual}%`,
      dept.tempoMedio,
      `${dept.satisfacao}/5`
    ])
  ]

  yPosition = drawTable(pdf, deptTable, margin, yPosition, pageWidth - 2 * margin)
  yPosition += 15

  // Verificar se precisa de nova página
  if (yPosition > pageHeight - 100) {
    pdf.addPage()
    yPosition = margin
  }

  // Top Técnicos
  pdf.setFontSize(subtitleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('TOP TÉCNICOS', margin, yPosition)
  yPosition += 10

  const techTable = [
    ['Nome', 'Chamados', 'Satisfação', 'Tempo Médio', 'Departamento'],
    ...data.technicians.map(tech => [
      tech.name,
      tech.chamados.toString(),
      `${tech.satisfacao}/5`,
      tech.tempoMedio,
      tech.departamento || '—'
    ])
  ]

  yPosition = drawTable(pdf, techTable, margin, yPosition, pageWidth - 2 * margin)
  yPosition += 15

  // Adicionar gráficos como imagens
  pdf.addPage()
  yPosition = margin

  pdf.setFontSize(titleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('GRÁFICOS E ANÁLISES VISUAIS', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Capturar e adicionar gráficos
  try {
    // Gráfico de Prioridades
    const prioritiesChart = await captureChartAsImage('priorities-chart')
    if (prioritiesChart) {
      pdf.setFontSize(subtitleFontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 114, 196)
      pdf.text('Distribuição por Prioridade', margin, yPosition)
      yPosition += 10

      const imgWidth = pageWidth - 2 * margin
      const imgHeight = 80
      pdf.addImage(prioritiesChart, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 15
    }

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    // Gráfico de Status
    const statusChart = await captureChartAsImage('status-chart')
    if (statusChart) {
      pdf.setFontSize(subtitleFontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 114, 196)
      pdf.text('Distribuição por Status', margin, yPosition)
      yPosition += 10

      const imgWidth = pageWidth - 2 * margin
      const imgHeight = 80
      pdf.addImage(statusChart, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 15
    }

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    // Gráfico de Evolução (se disponível)
    const evolutionChart = await captureChartAsImage('evolution-chart')
    if (evolutionChart) {
      pdf.setFontSize(subtitleFontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 114, 196)
      pdf.text('Evolução de Tickets ao Longo do Tempo', margin, yPosition)
      yPosition += 10

      const imgWidth = pageWidth - 2 * margin
      const imgHeight = 80
      pdf.addImage(evolutionChart, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 15
    }

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    // Gráfico de Departamentos (se disponível)
    const departmentsChart = await captureChartAsImage('departments-chart')
    if (departmentsChart) {
      pdf.setFontSize(subtitleFontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 114, 196)
      pdf.text('Distribuição por Departamento', margin, yPosition)
      yPosition += 10

      const imgWidth = pageWidth - 2 * margin
      const imgHeight = 80
      pdf.addImage(departmentsChart, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 15
    }

  } catch (error) {
    console.error('Erro ao capturar gráficos:', error)
  }

  // Nova página para dados tabulares
  pdf.addPage()
  yPosition = margin

  pdf.setFontSize(titleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('DADOS DETALHADOS', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Distribuição por Status
  pdf.setFontSize(subtitleFontSize)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(68, 114, 196)
  pdf.text('DISTRIBUIÇÃO POR STATUS', margin, yPosition)
  yPosition += 10

  const statusTable = [
    ['Status', 'Quantidade'],
    ...Object.entries(data.statusBreakdown).map(([status, count]) => [
      status === 'Open' ? 'Aberto' :
      status === 'InProgress' ? 'Em Andamento' :
      status === 'WaitingForClient' ? 'Aguardando Cliente' :
      status === 'WaitingForThirdParty' ? 'Aguardando Terceiros' :
      status === 'Resolved' ? 'Resolvido' :
      status === 'Closed' ? 'Fechado' :
      status === 'Cancelled' ? 'Cancelado' : status,
      count.toString()
    ])
  ]

  yPosition = drawTable(pdf, statusTable, margin, yPosition, pageWidth - 2 * margin)
  yPosition += 15

  // Evolução de Tickets (se disponível)
  if (data.ticketsOverTime && data.ticketsOverTime.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(subtitleFontSize)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(68, 114, 196)
    pdf.text('EVOLUÇÃO DE TICKETS (ÚLTIMOS 30 DIAS)', margin, yPosition)
    yPosition += 10

    const timelineTable = [
      ['Data', 'Total', 'Abertos', 'Concluídos'],
      ...data.ticketsOverTime.map(item => [  // Mostrar todos os 30 dias
        item.date,
        item.total.toString(),
        item.abertos.toString(),
        item.concluidos.toString()
      ])
    ]

    yPosition = drawTable(pdf, timelineTable, margin, yPosition, pageWidth - 2 * margin)
    yPosition += 15
  }

  // Distribuição de Satisfação (se disponível)
  if (data.satisfactionDistribution && data.satisfactionDistribution.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(subtitleFontSize)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(68, 114, 196)
    pdf.text('DISTRIBUIÇÃO DE SATISFAÇÃO', margin, yPosition)
    yPosition += 10

    const satisfactionTable = [
      ['Avaliação', 'Quantidade', 'Percentual'],
      ...data.satisfactionDistribution.map(item => [
        `${item.rating} estrela${item.rating > 1 ? 's' : ''}`,
        item.count.toString(),
        `${item.percentage}%`
      ])
    ]

    yPosition = drawTable(pdf, satisfactionTable, margin, yPosition, pageWidth - 2 * margin)
  }

  // Salvar PDF
  const fileName = `relatorio-senai-${period}-${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
}

// Função auxiliar para desenhar tabelas no PDF
const drawTable = (pdf: jsPDF, data: string[][], x: number, y: number, width: number) => {
  const rowHeight = 8
  const colWidth = width / data[0].length

  data.forEach((row, rowIndex) => {
    // Verificar se precisa de nova página
    if (y + rowHeight > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage()
      y = 20
    }

    row.forEach((cell, colIndex) => {
      const cellX = x + colIndex * colWidth
      
      // Desenhar borda
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(cellX, y, colWidth, rowHeight)
      
      // Configurar texto
      if (rowIndex === 0) {
        // Cabeçalho
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.setTextColor(68, 114, 196)
        pdf.setFillColor(240, 240, 240)
        pdf.rect(cellX, y, colWidth, rowHeight, 'F')
      } else {
        // Dados
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)
      }
      
      // Centralizar texto
      pdf.text(cell, cellX + colWidth / 2, y + rowHeight / 2 + 2, { align: 'center' })
    })
    
    y += rowHeight
  })

  return y
}

// Função para exportar HTML como PDF (alternativa)
export const exportHTMLToPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const imgWidth = 210
  const pageHeight = 295
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight

  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(fileName)
}
