import { getPerformanceStats } from './performance.js'

// Mapa de códigos de erro do Prisma para mensagens amigáveis
const PRISMA_ERROR_MESSAGES = {
  P1001: 'Serviço temporariamente indisponível - Problema de conectividade',
  P1002: 'Conexão com banco perdida - Tentando reconectar',
  P1008: 'Operação expirou - Tente novamente',
  P1017: 'Conexão fechada pelo servidor - Reconectando',
  P2024: 'Timeout da conexão - Operação demorou muito',
  P2025: 'Registro não encontrado',
  P2034: 'Conflito de transação - Tente novamente',
  P2037: 'Muitas conexões simultâneas - Aguarde um momento',
  P2002: 'Dado duplicado - Verifique as informações',
  P2003: 'Referência inválida - Dados inconsistentes',
  P2004: 'Valor inválido para o campo',
  P2005: 'Valor muito longo para o campo',
  P2006: 'Valor inválido para o campo',
  P2007: 'Erro de validação dos dados',
  P2008: 'Falha na consulta - Verifique os parâmetros',
  P2009: 'Falha na consulta - Sintaxe inválida',
  P2010: 'Valor muito grande para o campo',
  P2011: 'Valor nulo não permitido',
  P2012: 'Valor muito pequeno para o campo',
  P2013: 'Argumentos insuficientes para a consulta',
  P2014: 'Relacionamento inválido entre os dados',
  P2015: 'Registro relacionado não encontrado',
  P2016: 'Interpretação incorreta dos dados',
  P2017: 'Relacionamento entre registros não conectado',
  P2018: 'Registro conectado não encontrado',
  P2019: 'Input inválido',
  P2020: 'Valor fora do intervalo permitido',
  P2021: 'Tabela não existe no banco',
  P2022: 'Coluna não existe na tabela',
  P2023: 'Coluna inválida na consulta',
  P2026: 'Banco não suporta a funcionalidade',
  P2027: 'Múltiplos erros ocorreram durante a consulta'
}

// Função para obter mensagem amigável do erro
function getFriendlyErrorMessage(error) {
  // Erros do Prisma
  if (error.code && PRISMA_ERROR_MESSAGES[error.code]) {
    return PRISMA_ERROR_MESSAGES[error.code]
  }
  
  // Erros de validação
  if (error.name === 'ValidationError') {
    return 'Dados inválidos fornecidos'
  }
  
  // Erros de autenticação
  if (error.name === 'JsonWebTokenError') {
    return 'Token de autenticação inválido'
  }
  
  if (error.name === 'TokenExpiredError') {
    return 'Token de autenticação expirado'
  }
  
  // Erros de rede
  if (error.code === 'ECONNRESET') {
    return 'Conexão perdida - Tente novamente'
  }
  
  if (error.code === 'ETIMEDOUT') {
    return 'Tempo limite da conexão - Verifique sua internet'
  }
  
  // Erro genérico
  return 'Ocorreu um erro inesperado - Tente novamente'
}

// Função para determinar se o erro deve ser logado
function shouldLogError(error, statusCode) {
  // Sempre logar erros 5xx (erros do servidor)
  if (statusCode >= 500) {
    return true
  }
  
  // Logar erros de conectividade
  if (error.code && ['P1001', 'P1002', 'P1017', 'P2024'].includes(error.code)) {
    return true
  }
  
  // Logar erros de rede
  if (error.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(error.code)) {
    return true
  }
  
  // Logar erros de autenticação
  if (error.name && ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name)) {
    return true
  }
  
  return false
}

// Função para determinar se o erro deve ser reportado
function shouldReportError(error, statusCode) {
  // Reportar erros críticos
  if (statusCode >= 500) {
    return true
  }
  
  // Reportar erros de conectividade persistentes
  if (error.code && ['P1001', 'P1002', 'P1017'].includes(error.code)) {
    return true
  }
  
  return false
}

// Middleware principal de tratamento de erros
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const errorCode = err.code || 'UNKNOWN_ERROR'
  const requestId = req.requestId || 'unknown'
  
  // Obter mensagem amigável
  const friendlyMessage = getFriendlyErrorMessage(err)
  
  // Determinar se deve logar/reportar
  const shouldLog = shouldLogError(err, statusCode)
  const shouldReport = shouldReportError(err, statusCode)
  
  // Log do erro
  if (shouldLog) {
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      errorCode,
      message: err.message,
      stack: err.stack,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    }
    
    if (shouldReport) {
      console.error('🚨 ERRO CRÍTICO:', logData)
    } else {
      console.warn('⚠️ Erro detectado:', logData)
    }
  }
  
  // Resposta para o cliente
  const errorResponse = {
    error: true,
    message: friendlyMessage,
    code: errorCode,
    requestId,
    timestamp: new Date().toISOString()
  }
  
  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      originalMessage: err.message,
      stack: err.stack,
      details: err
    }
  }
  
  // Headers de erro
  res.setHeader('X-Error-Code', errorCode)
  res.setHeader('X-Request-ID', requestId)
  
  // Resposta baseada no tipo de erro
  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1017') {
    // Erros de conectividade - retornar 503 (Service Unavailable)
    res.status(503).json({
      ...errorResponse,
      retryAfter: 30, // Tentar novamente em 30 segundos
      message: 'Serviço temporariamente indisponível - Tente novamente em alguns instantes'
    })
  } else if (err.code === 'P2024') {
    // Timeout - retornar 408 (Request Timeout)
    res.status(408).json({
      ...errorResponse,
      message: 'Operação demorou muito - Tente novamente'
    })
  } else if (err.name === 'ValidationError') {
    // Erros de validação - retornar 400 (Bad Request)
    res.status(400).json({
      ...errorResponse,
      message: 'Dados inválidos fornecidos',
      validationErrors: err.errors
    })
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // Erros de autenticação - retornar 401 (Unauthorized)
    res.status(401).json({
      ...errorResponse,
      message: 'Autenticação necessária'
    })
  } else if (statusCode >= 500) {
    // Erros internos do servidor
    res.status(statusCode).json({
      ...errorResponse,
      message: 'Erro interno do servidor - Nossa equipe foi notificada'
    })
  } else {
    // Outros erros
    res.status(statusCode).json(errorResponse)
  }
  
  // Reportar erro crítico (implementar conforme necessário)
  if (shouldReport) {
    reportCriticalError(err, req, statusCode)
  }
}

// Função para reportar erros críticos
function reportCriticalError(error, req, statusCode) {
  // Aqui você pode implementar:
  // - Envio para serviços de monitoramento (Sentry, LogRocket, etc.)
  // - Notificação para equipe via Slack/Email
  // - Log em arquivo separado
  // - Métricas para dashboards
  
  const reportData = {
    level: 'critical',
    error: {
      code: error.code,
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      id: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    },
    performance: getPerformanceStats(),
    timestamp: new Date().toISOString()
  }
  
  console.error('🚨 RELATÓRIO DE ERRO CRÍTICO:', JSON.stringify(reportData, null, 2))
}

// Middleware para capturar erros não tratados
export const unhandledErrorHandler = (err, req, res, next) => {
  // Se o erro já foi tratado, passar para o próximo
  if (res.headersSent) {
    return next(err)
  }
  
  // Tratar erro não capturado
  err.statusCode = err.statusCode || 500
  errorHandler(err, req, res, next)
}

// Middleware para capturar erros de promises rejeitadas
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Middleware para capturar erros de sintaxe JSON
export const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: true,
      message: 'JSON inválido fornecido',
      code: 'INVALID_JSON',
      requestId: req.requestId || 'unknown',
      timestamp: new Date().toISOString()
    })
  }
  next(err)
}

export default {
  errorHandler,
  unhandledErrorHandler,
  asyncErrorHandler,
  jsonErrorHandler
}
