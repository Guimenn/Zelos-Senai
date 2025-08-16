'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('🔐 Checking authentication...')
        const token = authCookies.getToken()
        
        if (!token) {
          if (requireAuth) {
            console.log('Token não encontrado, redirecionando para login')
            router.push(redirectTo)
            return
          }
          setIsAuthenticated(false)
          setUser(null)
          setIsLoading(false)
          return
        }

        // Decodificar e validar o token
        const decodedToken: DecodedToken = jwtDecode(token)
        
        // Verificar se o token não está expirado
        const currentTime = Date.now() / 1000
        if (decodedToken.exp < currentTime) {
          console.log('Token expirado, removendo do localStorage e redirecionando')
          authCookies.removeToken()
          if (requireAuth) {
            router.push(redirectTo)
            return
          }
          setIsAuthenticated(false)
          setUser(null)
          setIsLoading(false)
          return
        }

        // Verificar roles permitidas se especificadas
        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = decodedToken.role || decodedToken.userRole
          if (!userRole || !allowedRoles.includes(userRole)) {
            console.log(`Usuário com role '${userRole}' não tem permissão. Roles permitidas: ${allowedRoles.join(', ')}`)
            router.push('/pages/auth/unauthorized')
            return
          }
        }

        // Token válido
        setIsAuthenticated(true)
        setUser(decodedToken)
        setIsLoading(false)
        
      } catch (error) {
        console.error('Erro ao validar token:', error)
        authCookies.removeToken()
        if (requireAuth) {
          router.push(redirectTo)
          return
        }
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, []) // Executar apenas uma vez na montagem

  const logout = () => {
    authCookies.removeToken()
    setIsAuthenticated(false)
    setUser(null)
    router.push('/pages/auth/login')
  }

  const getUserRole = () => {
    return user?.role || user?.userRole || null
  }

  const hasRole = (role: string) => {
    const userRole = getUserRole()
    return userRole === role
  }

  const hasAnyRole = (roles: string[]) => {
    const userRole = getUserRole()
    return userRole ? roles.includes(userRole) : false
  }

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