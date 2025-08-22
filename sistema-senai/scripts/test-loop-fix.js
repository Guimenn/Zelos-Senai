// Script para testar se o loop infinito foi corrigido
// Execute no console do navegador

(function() {
  console.log('🔍 Testando correção do loop infinito...')
  
  let requestCount = 0
  let lastRequestTime = Date.now()
  const requestLog = []
  let isMonitoring = true
  
  // Interceptar todas as requisições fetch
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    if (!isMonitoring) return originalFetch.apply(this, args)
    
    const url = args[0]
    const timestamp = Date.now()
    
    requestCount++
    requestLog.push({
      url: typeof url === 'string' ? url : url.url,
      timestamp,
      timeSinceLast: timestamp - lastRequestTime
    })
    
    lastRequestTime = timestamp
    
    // Se houver muitas requisições em pouco tempo, alertar
    const recentRequests = requestLog.filter(req => timestamp - req.timestamp < 5000) // 5 segundos
    if (recentRequests.length > 10) {
      console.error('🚨 ALERTA: Muitas requisições em pouco tempo! Possível loop infinito.')
      console.error(`Requisições nos últimos 5s: ${recentRequests.length}`)
      console.error('Últimas requisições:', recentRequests.slice(-5).map(r => r.url))
    }
    
    return originalFetch.apply(this, args)
  }
  
  // Função para verificar se há loop infinito
  window.checkForInfiniteLoop = function() {
    const now = Date.now()
    const timeWindow = 10000 // 10 segundos
    const recentRequests = requestLog.filter(req => now - req.timestamp < timeWindow)
    
    console.log('🔍 VERIFICAÇÃO DE LOOP INFINITO:')
    console.log(`Total de requisições: ${requestCount}`)
    console.log(`Requisições nos últimos 10s: ${recentRequests.length}`)
    
    if (recentRequests.length > 20) {
      console.error('❌ LOOP INFINITO DETECTADO! Muitas requisições em pouco tempo')
      return false
    } else if (recentRequests.length > 10) {
      console.warn('⚠️ Possível loop infinito. Muitas requisições em pouco tempo')
      return false
    } else {
      console.log('✅ Nenhum loop infinito detectado')
      return true
    }
  }
  
  // Função para parar monitoramento
  window.stopMonitoring = function() {
    isMonitoring = false
    console.log('🛑 Monitoramento parado')
  }
  
  // Função para reiniciar monitoramento
  window.startMonitoring = function() {
    isMonitoring = true
    console.log('▶️ Monitoramento reiniciado')
  }
  
  // Auto-verificação a cada 10 segundos
  const intervalId = setInterval(() => {
    if (isMonitoring) {
      window.checkForInfiniteLoop()
    }
  }, 10000)
  
  console.log('✅ Monitoramento de loop infinito ativo!')
  console.log('Comandos disponíveis:')
  console.log('- checkForInfiniteLoop() - Verificar manualmente')
  console.log('- stopMonitoring() - Parar monitoramento')
  console.log('- startMonitoring() - Reiniciar monitoramento')
  
  // Limpar intervalo quando a página for fechada
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId)
  })
})()
