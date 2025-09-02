import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

// Configuração do Redis para rate limiting distribuído
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
})

// Rate limiter para endpoints gerais
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
  message: {
    error: 'Muitas requisições',
    message: 'Tente novamente em 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store personalizado para melhor performance
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  // Headers personalizados
  headers: true,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false
})

// Rate limiter para autenticação (mais restritivo)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login',
    message: 'Tente novamente em 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  // Headers personalizados
  headers: true,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Skip failed requests
  skipFailedRequests: false
})

// Rate limiter para uploads (muito restritivo)
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 uploads por IP por hora
  message: {
    error: 'Limite de uploads excedido',
    message: 'Tente novamente em 1 hora',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  headers: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

// Rate limiter para endpoints de admin (moderado)
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 requisições por IP
  message: {
    error: 'Limite de requisições admin excedido',
    message: 'Tente novamente em 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  headers: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

// Rate limiter dinâmico baseado no tipo de usuário
export const dynamicRateLimiter = (req, res, next) => {
  const userRole = req.user?.role || 'anonymous'
  
  let maxRequests
  switch (userRole) {
    case 'admin':
      maxRequests = 500
      break
    case 'agent':
      maxRequests = 300
      break
    case 'client':
      maxRequests = 100
      break
    default:
      maxRequests = 50
  }
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: {
      error: 'Limite de requisições excedido',
      message: `Usuário ${userRole}: máximo ${maxRequests} req/15min`,
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args)
    }),
    headers: true
  })
  
  return limiter(req, res, next)
}

export default {
  general: generalRateLimiter,
  auth: authRateLimiter,
  upload: uploadRateLimiter,
  admin: adminRateLimiter,
  dynamic: dynamicRateLimiter
}
