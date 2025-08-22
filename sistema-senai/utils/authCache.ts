// Utilitário para gerenciar cache de autenticação

interface AuthCacheData {
  lastCheck: number
  user: any
  isAuthenticated: boolean
  isLoading: boolean
}

class AuthCacheManager {
  private static instance: AuthCacheManager
  private cache: AuthCacheData = {
    lastCheck: 0,
    user: null,
    isAuthenticated: false,
    isLoading: false
  }

  private constructor() {}

  static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager()
    }
    return AuthCacheManager.instance
  }

  getCache(): AuthCacheData {
    return this.cache
  }

  setCache(data: Partial<AuthCacheData>): void {
    this.cache = { ...this.cache, ...data }
  }

  clearCache(): void {
    this.cache = {
      lastCheck: 0,
      user: null,
      isAuthenticated: false,
      isLoading: false
    }
    console.log('🧹 Cache de autenticação limpo')
  }

  isCacheValid(duration: number = 5000): boolean {
    const now = Date.now()
    return (now - this.cache.lastCheck) < duration && this.cache.user !== null
  }

  updateLastCheck(): void {
    this.cache.lastCheck = Date.now()
  }
}

export const authCacheManager = AuthCacheManager.getInstance()

// Função para limpar cache quando necessário
export const clearAuthCache = () => {
  authCacheManager.clearCache()
}

// Função para verificar se o cache é válido
export const isAuthCacheValid = (duration?: number) => {
  return authCacheManager.isCacheValid(duration)
}

// Função para obter dados do cache
export const getAuthCache = () => {
  return authCacheManager.getCache()
}
