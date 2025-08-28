// Função para formatar o prazo do ticket (cópia da função do frontend)
const formatDeadline = (dueDate) => {
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

// Testar a função
console.log('🔍 Testando função formatDeadline...\n')

// Teste 1: Valor null
console.log('Teste 1 - Valor null:')
console.log('Input:', null)
console.log('Output:', formatDeadline(null))
console.log('')

// Teste 2: Valor undefined
console.log('Teste 2 - Valor undefined:')
console.log('Input:', undefined)
console.log('Output:', formatDeadline(undefined))
console.log('')

// Teste 3: Data futura (7 dias)
console.log('Teste 3 - Data futura (7 dias):')
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
console.log('Input:', futureDate.toISOString())
console.log('Output:', formatDeadline(futureDate))
console.log('')

// Teste 4: Data futura (2 horas)
console.log('Teste 4 - Data futura (2 horas):')
const futureHours = new Date(Date.now() + 2 * 60 * 60 * 1000)
console.log('Input:', futureHours.toISOString())
console.log('Output:', formatDeadline(futureHours))
console.log('')

// Teste 5: Data passada
console.log('Teste 5 - Data passada:')
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
console.log('Input:', pastDate.toISOString())
console.log('Output:', formatDeadline(pastDate))
console.log('')

// Teste 6: String de data
console.log('Teste 6 - String de data:')
const dateString = '2025-09-05T10:00:00.000Z'
console.log('Input:', dateString)
console.log('Output:', formatDeadline(dateString))
console.log('')

console.log('✅ Testes concluídos!')
