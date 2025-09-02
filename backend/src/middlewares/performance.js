import { performance } from 'perf_hooks'

// Métricas de performance
const performanceMetrics = {
  requests: 0,
  slowRequests: 0,
  errors: 0,
  totalResponseTime: 0,
  startTime: Date.now()
}

// Middleware de monitoramento de performance
export const performanceMonitor = (req, res, next) => {
  const start = performance.now()
  const requestId = Math.random().toString(36).substring(7)
  
  // Adicionar ID único à requisição
  req.requestId = requestId
  
  // Log de início da requisição
  console.log(`🚀 [${requestId}] ${req.method} ${req.path} iniciada`)
  
  // Interceptar resposta para calcular métricas
  const originalSend = res.send
  const originalJson = res.json
  
  res.send = function(data) {
    const duration = performance.now() - start
    logRequestMetrics(req, res, duration, requestId)
    originalSend.call(this, data)
  }
  
  res.json = function(data) {
    const duration = performance.now() - start
    logRequestMetrics(req, res, duration, requestId)
    originalJson.call(this, data)
  }
  
  next()
}

// Função para logar métricas da requisição
function logRequestMetrics(req, res, duration, requestId) {
  const durationMs = Math.round(duration)
  
  // Atualizar métricas globais
  performanceMetrics.requests++
  performanceMetrics.totalResponseTime += durationMs
  
  // Detectar requisições lentas
  if (durationMs > 3000) {
    performanceMetrics.slowRequests++
    console.warn(`⚠️ [${requestId}] Resposta lenta detectada: ${req.method} ${req.path} levou ${durationMs}ms`)
  }
  
  // Detectar erros
  if (res.statusCode >= 400) {
    performanceMetrics.errors++
    console.error(`❌ [${requestId}] Erro ${res.statusCode}: ${req.method} ${req.path} em ${durationMs}ms`)
  }
  
  // Log de conclusão
  console.log(`✅ [${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${durationMs}ms`)
}

// Middleware para monitorar uso de memória
export const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  }
  
  // Alertar sobre uso alto de memória
  if (memUsageMB.heapUsed > 500) { // 500MB
    console.warn(`⚠️ Uso alto de memória: ${memUsageMB.heapUsed}MB`)
  }
  
  // Adicionar headers de métricas
  res.setHeader('X-Memory-Usage', JSON.stringify(memUsageMB))
  
  next()
}

// Middleware para monitorar queries do banco
export const databaseMonitor = (req, res, next) => {
  const start = Date.now()
  
  // Interceptar próxima função para medir tempo de banco
  const originalNext = next
  next = function() {
    const dbTime = Date.now() - start
    if (dbTime > 1000) {
      console.warn(`🐌 [${req.requestId}] Tempo de banco alto: ${dbTime}ms`)
    }
    originalNext.apply(this, arguments)
  }
  
  next()
}

// Função para obter estatísticas de performance
export const getPerformanceStats = () => {
  const uptime = Date.now() - performanceMetrics.startTime
  const avgResponseTime = performanceMetrics.requests > 0 
    ? Math.round(performanceMetrics.totalResponseTime / performanceMetrics.requests)
    : 0
  
  return {
    uptime: Math.round(uptime / 1000), // segundos
    totalRequests: performanceMetrics.requests,
    slowRequests: performanceMetrics.slowRequests,
    errors: performanceMetrics.errors,
    averageResponseTime: avgResponseTime,
    errorRate: performanceMetrics.requests > 0 
      ? Math.round((performanceMetrics.errors / performanceMetrics.requests) * 100)
      : 0,
    slowRequestRate: performanceMetrics.requests > 0
      ? Math.round((performanceMetrics.slowRequests / performanceMetrics.requests) * 100)
      : 0
  }
}

// Função para limpar métricas
export const clearPerformanceMetrics = () => {
  performanceMetrics.requests = 0
  performanceMetrics.slowRequests = 0
  performanceMetrics.errors = 0
  performanceMetrics.totalResponseTime = 0
  performanceMetrics.startTime = Date.now()
  console.log('📊 Métricas de performance limpas')
}

export default {
  monitor: performanceMonitor,
  memory: memoryMonitor,
  database: databaseMonitor,
  getStats: getPerformanceStats,
  clear: clearPerformanceMetrics
}
