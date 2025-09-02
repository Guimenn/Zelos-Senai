/**
 * Gerenciador de Tokens com Renovação Automática
 * Resolve problemas de tokens expirados e inválidos
 */

import { authCookies } from './cookies'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  userId: number
  userRole?: string
  role?: string
  name?: string
  email?: string
  iat: number
  exp: number
}

interface TokenRefreshResponse {
  success: boolean
  token?: string
  error?: string
}

class TokenManager {
  private static instance: TokenManager
  private refreshPromise: Promise<TokenRefreshResponse> | null = null
  private lastRefreshAttempt = 0
  private readonly REFRESH_COOLDOWN = 5000 // 5 segundos entre tentativas

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  /**
   * Obtém o token atual, renovando se necessário
   */
  async getValidToken(): Promise<string | null> {
    try {
      const token = authCookies.getToken()
      
      if (!token) {
        console.log('🔍 Nenhum token encontrado')
        return null
      }

      // Verificar se o token está próximo de expirar (5 minutos antes)
      const decoded = this.decodeToken(token)
      if (!decoded) {
        console.log('❌ Token inválido, removendo...')
        authCookies.removeToken()
        return null
      }

      const now = Date.now() / 1000
      const timeUntilExpiry = decoded.exp - now
      const shouldRefresh = timeUntilExpiry < 300 // 5 minutos

      if (shouldRefresh) {
        console.log(`🔄 Token expira em ${Math.round(timeUntilExpiry)}s, renovando...`)
        const refreshResult = await this.refreshToken(token)
        
        if (refreshResult.success && refreshResult.token) {
          console.log('✅ Token renovado com sucesso')
          return refreshResult.token
        } else {
          console.log('❌ Falha ao renovar token:', refreshResult.error)
          // Se falhar ao renovar, tentar usar o token atual
          if (timeUntilExpiry > 0) {
            console.log('⚠️ Usando token atual (ainda válido)')
            return token
          } else {
            console.log('❌ Token expirado, removendo...')
            authCookies.removeToken()
            return null
          }
        }
      }

      console.log(`✅ Token válido por mais ${Math.round(timeUntilExpiry)}s`)
      return token
    } catch (error) {
      console.error('❌ Erro ao obter token válido:', error)
      return null
    }
  }

  /**
   * Renova o token atual
   */
  private async refreshToken(currentToken: string): Promise<TokenRefreshResponse> {
    // Evitar múltiplas tentativas simultâneas
    if (this.refreshPromise) {
      console.log('🔄 Refresh já em andamento, aguardando...')
      return this.refreshPromise
    }

    // Verificar cooldown
    const now = Date.now()
    if (now - this.lastRefreshAttempt < this.REFRESH_COOLDOWN) {
      console.log('⏳ Aguardando cooldown para nova tentativa de refresh...')
      return { success: false, error: 'Cooldown ativo' }
    }

    this.lastRefreshAttempt = now

    this.refreshPromise = this.performTokenRefresh(currentToken)
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.refreshPromise = null
    }
  }

  /**
   * Executa a renovação do token
   */
  private async performTokenRefresh(currentToken: string): Promise<TokenRefreshResponse> {
    try {
      console.log('🔄 Iniciando renovação de token...')
      
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          token: currentToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na renovação:', response.status, errorData)
        
        if (response.status === 401) {
          // Token completamente inválido, remover
          authCookies.removeToken()
          return { success: false, error: 'Token inválido' }
        }
        
        return { 
          success: false, 
          error: errorData.message || `Erro ${response.status}` 
        }
      }

      const data = await response.json()
      
      if (data.token) {
        // Salvar novo token
        authCookies.setToken(data.token, true) // Lembrar usuário
        console.log('✅ Novo token salvo')
        return { success: true, token: data.token }
      } else {
        return { success: false, error: 'Token não recebido' }
      }
    } catch (error) {
      console.error('❌ Erro na renovação:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Decodifica um token JWT
   */
  private decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode(token)
    } catch (error) {
      console.error('❌ Erro ao decodificar token:', error)
      return null
    }
  }

  /**
   * Verifica se um token está válido
   */
  isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded) return false

      const now = Date.now() / 1000
      return decoded.exp > now
    } catch {
      return false
    }
  }

  /**
   * Obtém informações do token
   */
  getTokenInfo(token: string): DecodedToken | null {
    return this.decodeToken(token)
  }

  /**
   * Força renovação do token
   */
  async forceRefresh(): Promise<TokenRefreshResponse> {
    const token = authCookies.getToken()
    if (!token) {
      return { success: false, error: 'Nenhum token para renovar' }
    }

    this.lastRefreshAttempt = 0 // Reset cooldown
    return this.refreshToken(token)
  }

  /**
   * Limpa o estado do gerenciador
   */
  static clearCache(): void {
    tokenCache = null
    tokenCacheTime = 0
  }

  /**
   * Força a atualização do cache do token
   */
  static refreshToken(): string | null {
    this.clearCache()
    return this.getToken()
  }

  /**
   * Verifica se existe um token válido
   */
  static hasToken(): boolean {
    return !!this.getToken()
  }

  /**
   * Remove o token e limpa o cache
   */
  static removeToken(): void {
    authCookies.removeToken()
    this.clearCache()
    
    // Disparar evento para notificar componentes sobre a remoção do token
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-updated', { 
        detail: { user: null, isAuthenticated: false } 
      }))
    }
  }

  /**
   * Define um novo token e atualiza o cache
   */
  static setToken(token: string, rememberMe: boolean = false): void {
    authCookies.setToken(token, rememberMe)
    this.clearCache() // Limpa o cache para forçar atualização
    
    // Disparar evento para notificar componentes sobre o novo token
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-updated', { 
        detail: { token, isAuthenticated: true } 
      }))
    }
  }
}

// Instância singleton
export const tokenManager = TokenManager.getInstance()

// Funções de conveniência
export const getValidToken = () => tokenManager.getValidToken()
export const isTokenValid = (token: string) => tokenManager.isTokenValid(token)
export const getTokenInfo = (token: string) => tokenManager.getTokenInfo(token)
export const forceRefreshToken = () => tokenManager.forceRefresh()

export default tokenManager
