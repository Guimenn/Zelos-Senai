'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../utils/cookies'

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

// Tempo de cache para autenticação (5 minutos - muito mais longo)
const AUTH_CACHE_DURATION = 300000 // 5 minutos

// Singleton para gerenciar autenticação globalmente
class AuthManager {
  private static instance: AuthManager
  private isInitialized = false

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
    this.checkAuth()
  }

  private checkAuth() {
    try {
      const now = Date.now()
      
      // Usar cache se a verificação foi feita recentemente
      if (now - authCache.lastCheck < AUTH_CACHE_DURATION && authCache.user !== null) {
        return
      }

      const token = authCookies.getToken()
      
      if (!token) {
        authCache.isAuthenticated = false
        authCache.user = null
        authCache.lastCheck = now
        return
      }

      // Decodificar e validar o token
      const decodedToken: DecodedToken = jwtDecode(token)
      
      // Verificar se o token não está expirado
      const currentTime = Date.now() / 1000
      if (decodedToken.exp < currentTime) {
        authCookies.removeToken()
        authCache.isAuthenticated = false
        authCache.user = null
        authCache.lastCheck = now
        return
      }

      // Token válido - atualizar cache
      authCache.isAuthenticated = true
      authCache.user = decodedToken
      authCache.lastCheck = now
      
    } catch (error) {
      console.error('Erro ao validar token:', error)
      authCookies.removeToken()
      authCache.isAuthenticated = false
      authCache.user = null
      authCache.lastCheck = Date.now()
    }
  }

  getAuthData() {
    return authCache
  }

  clearCache() {
    authCache.isAuthenticated = false
    authCache.user = null
    authCache.lastCheck = 0
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

  const checkAuth = useCallback(() => {
    // Inicializar o auth manager se necessário
    authManager.initialize()
    
    const authData = authManager.getAuthData()
    
    // Verificar roles permitidas se especificadas
    if (allowedRoles && allowedRoles.length > 0 && authData.user) {
      const userRole = authData.user.role || authData.user.userRole
      if (!userRole || !allowedRoles.includes(userRole)) {
        console.log(`Usuário com role '${userRole}' não tem permissão. Roles permitidas: ${allowedRoles.join(', ')}`)
        router.push('/pages/auth/unauthorized')
        return
      }
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

  const logout = useCallback(() => {
    authCookies.removeToken()
    authManager.clearCache()
    setIsAuthenticated(false)
    setUser(null)
    router.push('/pages/auth/login')
  }, [router])

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
    
    const authData = authManager.getAuthData()
    setIsAuthenticated(authData.isAuthenticated)
    setUser(authData.user)
    setIsLoading(false)
  }, [])

  return {
    isAuthenticated,
    user,
    isLoading
  }
}