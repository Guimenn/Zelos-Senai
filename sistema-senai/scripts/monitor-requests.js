// Script para monitorar requisições e verificar otimizações
// Execute no console do navegador para monitorar requisições

(function() {
  console.log('🔍 Iniciando monitoramento de requisições...')
  
  let requestCount = 0
  let lastRequestTime = Date.now()
  const requestLog = []
  
  // Interceptar todas as requisições fetch
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const url = args[0]
    const timestamp = Date.now()
    
    requestCount++
    requestLog.push({
      url: typeof url === 'string' ? url : url.url,
      timestamp,
      timeSinceLast: timestamp - lastRequestTime
    })
    
    lastRequestTime = timestamp
    
    console.log(`🌐 Requisição #${requestCount}: ${url} (${timestamp - lastRequestTime}ms desde última)`)
    
    return originalFetch.apply(this, args)
  }
  
  // Função para gerar relatório
  window.getRequestReport = function() {
    const now = Date.now()
    const timeWindow = 60000 // 1 minuto
    const recentRequests = requestLog.filter(req => now - req.timestamp < timeWindow)
    
    console.log('📊 RELATÓRIO DE REQUISIÇÕES:')
    console.log(`Total de requisições: ${requestCount}`)
    console.log(`Requisições nos últimos 60s: ${recentRequests.length}`)
    console.log(`Média de requisições/minuto: ${(recentRequests.length / (timeWindow / 60000)).toFixed(2)}`)
    
    // Agrupar por URL
    const urlCounts = {}
    recentRequests.forEach(req => {
      const baseUrl = req.url.split('?')[0]
      urlCounts[baseUrl] = (urlCounts[baseUrl] || 0) + 1
    })
    
    console.log('📈 Requisições por endpoint:')
    Object.entries(urlCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([url, count]) => {
        console.log(`  ${url}: ${count} requisições`)
      })
    
    return {
      total: requestCount,
      recent: recentRequests.length,
      averagePerMinute: (recentRequests.length / (timeWindow / 60000)).toFixed(2),
      byUrl: urlCounts
    }
  }
  
  // Função para limpar log
  window.clearRequestLog = function() {
    requestCount = 0
    requestLog.length = 0
    lastRequestTime = Date.now()
    console.log('🧹 Log de requisições limpo')
  }
  
  // Auto-relatório a cada 5 minutos
  setInterval(() => {
    window.getRequestReport()
  }, 300000)
  
  console.log('✅ Monitoramento ativo! Use getRequestReport() para ver estatísticas')
})()
