import { authCookies } from './cookies'

// Cache global para o token
let tokenCache: string | null = null
let tokenCacheTime: number = 0
const TOKEN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Utilitário para gerenciar tokens de autenticação com cache
 */
export class TokenManager {
  /**
   * Obtém o token com cache para evitar chamadas excessivas
   */
  static getToken(): string | null {
    const now = Date.now()
    
    // Se o cache ainda é válido, retorna o token em cache
    if (tokenCache && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
      return tokenCache
    }
    
    // Atualiza o cache
    const token = authCookies.getToken()
    tokenCache = token
    tokenCacheTime = now
    
    return token
  }

  /**
   * Limpa o cache do token
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

// Função de conveniência para uso direto
export const getToken = () => TokenManager.getToken()
export const hasToken = () => TokenManager.hasToken()
export const clearTokenCache = () => TokenManager.clearCache()
export const refreshToken = () => TokenManager.refreshToken()
