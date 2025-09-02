import NodeCache from 'node-cache'

// Cache com TTL configurável e limpeza automática
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutos padrão
  checkperiod: 600, // Verificar expiração a cada 10 minutos
  useClones: false, // Melhor performance
  maxKeys: 1000 // Limite máximo de chaves
})

// Middleware de cache configurável
export const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Pular cache para métodos não-GET
    if (req.method !== 'GET') {
      return next()
    }
    
    // Gerar chave única para o cache
    const key = keyGenerator ? keyGenerator(req) : `__cache__${req.originalUrl}`
    
    // Verificar se existe no cache
    const cachedResponse = cache.get(key)
    if (cachedResponse) {
      console.log(`💾 Cache hit: ${key}`)
      return res.json({
        ...cachedResponse,
        _cached: true,
        _timestamp: new Date().toISOString()
      })
    }
    
    // Interceptar a resposta para salvar no cache
    const originalJson = res.json
    res.json = function(body) {
      // Salvar no cache apenas se for sucesso
      if (res.statusCode === 200) {
        cache.set(key, body, duration)
        console.log(`💾 Cache miss: ${key} (salvo por ${duration}s)`)
      }
      
      // Remover campos internos antes de enviar
      const { _cached, _timestamp, ...cleanBody } = body
      originalJson.call(this, cleanBody)
    }
    
    next()
  })
}

// Funções utilitárias de cache
export const cacheUtils = {
  // Limpar cache específico
  clear: (pattern) => {
    const keys = cache.keys()
    const matchingKeys = keys.filter(key => key.includes(pattern))
    matchingKeys.forEach(key => cache.del(key))
    console.log(`🗑️ Cache limpo: ${matchingKeys.length} chaves removidas`)
  },
  
  // Limpar todo o cache
  clearAll: () => {
    cache.flushAll()
    console.log('🗑️ Cache completamente limpo')
  },
  
  // Estatísticas do cache
  stats: () => {
    return cache.getStats()
  },
  
  // Verificar se chave existe
  has: (key) => {
    return cache.has(key)
  }
}

export default cache
