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
    tempoMedioResolucao: string
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
}

// Função para exportar dados em Excel com formatação bonita
export const exportToExcel = (data: ReportData, period: string) => {
  // Criar um novo workbook
  const workbook = XLSX.utils.book_new()
  
  // Dados de visão geral
  const overviewData = [
    ['RELATÓRIO DE DESEMPENHO - SENAI'],
    [''],
    ['PERÍODO:', period],
    ['DATA DE GERAÇÃO:', new Date().toLocaleDateString('pt-BR')],
    [''],
    ['VISÃO GERAL'],
    ['Total de Chamados', data.overview.totalChamados],
    ['Chamados Abertos', data.overview.chamadosAbertos],
    ['Chamados Concluídos', data.overview.chamadosConcluidos],
    ['Taxa de Resolução', `${data.overview.percentualResolucao}%`],
    ['Tempo Médio de Resolução', data.overview.tempoMedioResolucao],
    ['Satisfação Média', `${data.overview.satisfacaoMedia}/5`],
    [''],
    ['DISTRIBUIÇÃO POR DEPARTAMENTO'],
    ['Departamento', 'Chamados', '% do Total', 'Tempo Médio', 'Satisfação'],
    ...data.departments.map(dept => [
      dept.name,
      dept.chamados,
      `${dept.percentual}%`,
      dept.tempoMedio,
      `${dept.satisfacao}/5`
    ]),
    [''],
    ['DISTRIBUIÇÃO POR PRIORIDADE'],
    ['Prioridade', 'Quantidade', '% do Total'],
    ...data.priorities.map(priority => [
      priority.name,
      priority.count,
      `${priority.percentual}%`
    ]),
    [''],
    ['TOP TÉCNICOS'],
    ['Nome', 'Chamados Atendidos', 'Satisfação Média', 'Tempo Médio', 'Departamento'],
    ...data.technicians.map(tech => [
      tech.name,
      tech.chamados,
      `${tech.satisfacao}/5`,
      tech.tempoMedio,
      tech.departamento || '—'
    ]),
    [''],
    ['ATIVIDADE RECENTE'],
    ['ID', 'Título', 'Status', 'Técnico', 'Tempo', 'Avaliação'],
    ...data.recentActivity.map(activity => [
      activity.id,
      activity.title,
      activity.status,
      activity.technician,
      activity.time,
      activity.rating ? `${activity.rating}/5` : '—'
    ])
  ]

  // Criar worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(overviewData)

  // Aplicar estilos e formatação
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Estilo para cabeçalhos principais
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, size: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center' }
      }
    }
  }

  // Estilo para subtítulos
  const subtitleRows = [5, 13, 21, 28, 35]
  subtitleRows.forEach(row => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, size: 12, color: { rgb: '2E75B6' } },
        fill: { fgColor: { rgb: 'D9E1F2' } }
      }
    }
  })

  // Estilo para cabeçalhos de tabela
  const tableHeaders = [15, 23, 30, 37]
  tableHeaders.forEach(row => {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 11 },
          fill: { fgColor: { rgb: 'E7E6E6' } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }
  })

  // Estilo para dados
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellAddress] && !worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }
  }

  // Ajustar largura das colunas
  const colWidths = [30, 15, 15, 20, 15, 15]
  worksheet['!cols'] = colWidths.map(width => ({ width }))

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')

  // Gerar arquivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  const fileName = `relatorio-senai-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`
  saveAs(blob, fileName)
}

// Função para exportar dados em PDF com formatação bonita
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
    ['Tempo Médio de Resolução', data.overview.tempoMedioResolucao],
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
