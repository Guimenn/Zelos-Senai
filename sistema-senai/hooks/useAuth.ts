'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../utils/cookies'
import { tokenManager, getValidToken } from '../utils/tokenManager'

interface DecodedToken {
  userId: number
  userRole?: string
  role?: string
  name?: string
  email?: string
  iat: number
  exp: number
}

interface UseAuthOptions {
  redirectTo?: string
  requireAuth?: boolean
  allowedRoles?: string[]
}

// Cache global para evitar verificações repetidas
const authCache = {
  lastCheck: 0,
  user: null as DecodedToken | null,
  isAuthenticated: false,
  isLoading: false
}

// Tempo de cache para autenticação (2 minutos - reduzido para maior precisão)
const AUTH_CACHE_DURATION = 120000 // 2 minutos

// Singleton para gerenciar autenticação globalmente
class AuthManager {
  private static instance: AuthManager
  private isInitialized = false
  private refreshInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  initialize() {
    if (this.isInitialized) return
    this.isInitialized = true
    
    // Verificação inicial
    this.checkAuth()
    
    // Configurar verificação automática a cada 2 minutos
    this.refreshInterval = setInterval(() => {
      this.checkAuth()
    }, AUTH_CACHE_DURATION)
  }

  private async checkAuth() {
    try {
      const now = Date.now()
      
      // Usar cache se a verificação foi feita recentemente
      if (now - authCache.lastCheck < AUTH_CACHE_DURATION && authCache.user !== null) {
        return
      }

      // Usar o novo gerenciador de tokens
      const token = await getValidToken()
      
      if (!token) {
        this.updateCache(false, null, now)
        return
      }

      // Decodificar e validar o token
      const decodedToken: DecodedToken = jwtDecode(token)
      
      console.log('🔍 DEBUG - AuthManager decoded token:', {
        userId: decodedToken.userId,
        userRole: decodedToken.userRole,
        role: decodedToken.role,
        name: decodedToken.name,
        email: decodedToken.email,
        exp: decodedToken.exp,
        currentTime: Date.now() / 1000
      })
      
      // Verificar se o token não está expirado
      const currentTime = Date.now() / 1000
      if (decodedToken.exp < currentTime) {
        console.log('❌ Token expirado')
        authCookies.removeToken()
        this.updateCache(false, null, now)
        return
      }

      // Token válido - atualizar cache
      this.updateCache(true, decodedToken, now)
      console.log('✅ Token válido, cache atualizado')
      
      // Disparar evento para notificar outros componentes sobre a atualização
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-updated', { 
          detail: { user: decodedToken, isAuthenticated: true } 
        }))
      }
      
    } catch (error) {
      console.error('Erro ao validar token:', error)
      authCookies.removeToken()
      this.updateCache(false, null, Date.now())
    }
  }

  private updateCache(isAuthenticated: boolean, user: DecodedToken | null, timestamp: number) {
    authCache.isAuthenticated = isAuthenticated
    authCache.user = user
    authCache.lastCheck = timestamp
  }

  getAuthData() {
    return authCache
  }

  clearCache() {
    authCache.isAuthenticated = false
    authCache.user = null
    authCache.lastCheck = 0
  }

  // Forçar verificação de autenticação
  async forceCheck() {
    authCache.lastCheck = 0 // Reset cache
    await this.checkAuth()
  }

  // Limpar intervalo de verificação
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }
}

const authManager = AuthManager.getInstance()

export function useAuth(options: UseAuthOptions = {}) {
  const {
    redirectTo = '/pages/auth/login',
    requireAuth = true,
    allowedRoles
  } = options
  
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasCheckedRef = useRef(false)

  const checkAuth = useCallback(async () => {
    // Inicializar o auth manager se necessário
    authManager.initialize()
    
    // Forçar verificação se necessário
    if (hasCheckedRef.current) {
      await authManager.forceCheck()
    }
    
    const authData = authManager.getAuthData()
    
    // Verificar roles permitidas se especificadas
    if (allowedRoles && allowedRoles.length > 0 && authData.user) {
      const userRole = authData.user.role || authData.user.userRole
      console.log('🔍 DEBUG - Verificando permissões:', {
        userRole,
        allowedRoles,
        user: authData.user,
        hasRole: !!userRole,
        isAllowed: userRole ? allowedRoles.includes(userRole) : false
      })
      if (!userRole || !allowedRoles.includes(userRole)) {
        console.log(`❌ Usuário com role '${userRole}' não tem permissão. Roles permitidas: ${allowedRoles.join(', ')}`)
        router.push('/pages/auth/unauthorized')
        return
      }
      console.log(`✅ Usuário com role '${userRole}' tem permissão para acessar`)
    }

    // Se não autenticado e requer autenticação, redirecionar
    if (!authData.isAuthenticated && requireAuth) {
      console.log('Usuário não autenticado, redirecionando para login')
      router.push(redirectTo)
      return
    }

    setIsAuthenticated(authData.isAuthenticated)
    setUser(authData.user)
    setIsLoading(false)
  }, [requireAuth, redirectTo, allowedRoles, router])

  useEffect(() => {
    // Evitar verificações múltiplas no mesmo componente
    if (hasCheckedRef.current) {
      return
    }
    
    hasCheckedRef.current = true
    checkAuth()
  }, [checkAuth])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      authManager.cleanup()
    }
  }, [])

  const logout = useCallback(() => {
    authCookies.removeToken()
    authManager.clearCache()
    setIsAuthenticated(false)
    setUser(null)
    router.push('/pages/auth/login')
  }, [router])

  const refreshAuth = useCallback(async () => {
    console.log('🔄 Forçando refresh da autenticação...')
    await authManager.forceCheck()
    await checkAuth()
  }, [checkAuth])

  const getUserRole = useCallback(() => {
    return user?.role || user?.userRole || null
  }, [user])

  const hasRole = useCallback((role: string) => {
    const userRole = getUserRole()
    return userRole === role
  }, [getUserRole])

  const hasAnyRole = useCallback((roles: string[]) => {
    const userRole = getUserRole()
    return userRole ? roles.includes(userRole) : false
  }, [getUserRole])

  return {
    isAuthenticated,
    user,
    isLoading,
    logout,
    refreshAuth,
    getUserRole,
    hasRole,
    hasAnyRole
  }
}

// Hook específico para verificação simples de autenticação
export function useRequireAuth(redirectTo?: string) {
  return useAuth({ requireAuth: true, redirectTo })
}

// Hook para verificação de roles específicas
export function useRequireRole(allowedRoles: string[], redirectTo?: string) {
  return useAuth({ requireAuth: true, allowedRoles, redirectTo })
}

// Hook otimizado que usa apenas o cache (sem verificações adicionais)
export function useAuthCache() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Inicializar o auth manager
    authManager.initialize()
    
    // Função para verificar autenticação
    const checkAuth = () => {
      const authData = authManager.getAuthData()
      
      // Só considerar carregado se tivermos dados válidos ou certeza de que não há usuário
      if (authData.user || authData.isAuthenticated === false) {
        setIsAuthenticated(authData.isAuthenticated)
        setUser(authData.user)
        setIsLoading(false)
      } else {
        // Se ainda não temos dados, aguardar um pouco mais
        setTimeout(checkAuth, 100)
      }
    }
    
    checkAuth()
    
    // Verificar novamente após um tempo para garantir que os dados foram carregados
    const timeout = setTimeout(() => {
      const authData = authManager.getAuthData()
      setIsAuthenticated(authData.isAuthenticated)
      setUser(authData.user)
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timeout)
  }, [])

  return {
    isAuthenticated,
    user,
    isLoading
  }
}

// Hook para gerenciar tokens especificamente
export function useTokenManager() {
  const [token, setToken] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkToken = async () => {
      try {
        setIsLoading(true)
        const validToken = await getValidToken()
        setToken(validToken)
        setIsValid(!!validToken)
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setToken(null)
        setIsValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkToken()
    
    // Verificar token a cada minuto
    const interval = setInterval(checkToken, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const refreshToken = async () => {
    try {
      setIsLoading(true)
      const newToken = await getValidToken()
      setToken(newToken)
      setIsValid(!!newToken)
      return newToken
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    token,
    isValid,
    isLoading,
    refreshToken
  }
}