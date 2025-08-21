'use client'

/**
 * Utilitário para gerenciamento seguro de cookies
 * Substitui o localStorage para armazenamento de tokens de autenticação
 */

interface CookieOptions {
  expires?: Date | number // Data de expiração ou dias
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  httpOnly?: boolean // Nota: httpOnly só funciona no servidor
  maxAge?: number // Tempo de vida em segundos
}

class CookieManager {
  // Configurações padrão para cookies seguros
  private static defaultOptions: CookieOptions = {
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite: typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'strict' : 'lax',
    path: '/'
  }

  /**
   * Define um cookie
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') {
      console.warn('CookieManager: document não está disponível (SSR)')
      return
    }

    const opts = { ...CookieManager.defaultOptions, ...options }
    const {
      expires,
      maxAge,
      path,
      domain,
      secure,
      sameSite
    } = opts

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    // Configurar expiração
    if (expires) {
      let expirationDate: Date
      
      if (typeof expires === 'number') {
        // Se for número, trata como dias
        expirationDate = new Date()
        expirationDate.setTime(expirationDate.getTime() + (expires * 24 * 60 * 60 * 1000))
      } else {
        expirationDate = expires
      }
      
      cookieString += `; expires=${expirationDate.toUTCString()}`
    }
    
    if (maxAge) {
      cookieString += `; max-age=${maxAge}`
    }

    // Adicionar outras opções
    if (path) {
      cookieString += `; path=${path}`
    }
    
    if (domain) {
      cookieString += `; domain=${domain}`
    }
    
    if (secure) {
      cookieString += '; secure'
    }
    
    if (sameSite) {
      cookieString += `; samesite=${sameSite}`
    }

    // Log para debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🍪 Setting cookie: ${name}`, { secure, sameSite, httpOnly: opts.httpOnly })
    }

    document.cookie = cookieString
  }

  /**
   * Obtém o valor de um cookie
   */
  get(name: string): string | null {
    if (typeof document === 'undefined') {
      console.warn('CookieManager: document não está disponível (SSR)')
      return null
    }

    const nameEQ = encodeURIComponent(name) + '='
    const cookies = document.cookie.split(';')
    
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }
    
    return null
  }

  /**
   * Remove um cookie
   */
  remove(name: string, options: Omit<CookieOptions, 'expires'> = {}): void {
    this.set(name, '', {
      ...options,
      expires: new Date(0) // Define data no passado para remover
    })
  }

  /**
   * Verifica se um cookie existe
   */
  exists(name: string): boolean {
    return this.get(name) !== null
  }

  /**
   * Obtém todos os cookies como objeto
   */
  getAll(): Record<string, string> {
    if (typeof document === 'undefined') {
      console.warn('CookieManager: document não está disponível (SSR)')
      return {}
    }

    const cookies: Record<string, string> = {}
    const cookieArray = document.cookie.split(';')
    
    for (let cookie of cookieArray) {
      cookie = cookie.trim()
      const [name, value] = cookie.split('=')
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value)
      }
    }
    
    return cookies
  }

  /**
   * Remove todos os cookies (apenas os acessíveis via JavaScript)
   */
  clear(options: Omit<CookieOptions, 'expires'> = {}): void {
    const cookies = this.getAll()
    
    for (const name in cookies) {
      this.remove(name, options)
    }
  }
}

// Instância singleton
const cookieManager = new CookieManager()

// Funções de conveniência para tokens de autenticação
export const authCookies = {
  /**
   * Define o token de autenticação com configurações de segurança
   */
  setToken(token: string, rememberMe: boolean = false): void {
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 dias ou 1 dia em segundos
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    
    cookieManager.set('auth_token', token, {
      maxAge,
      secure: isSecure,
      sameSite: isSecure ? 'strict' : 'lax', // Use 'lax' em desenvolvimento
      path: '/'
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Token set with ${rememberMe ? '30 days' : '1 day'} expiration`)
    }
  },

  /**
   * Obtém o token de autenticação
   */
  getToken(): string | null {
    const token = cookieManager.get('auth_token')
    if (process.env.NODE_ENV === 'development') {
   
    }
    return token
  },

  /**
   * Remove o token de autenticação
   */
  removeToken(): void {
    cookieManager.remove('auth_token', {
      path: '/'
    })
  },

  /**
   * Verifica se existe um token
   */
  hasToken(): boolean {
    return cookieManager.exists('auth_token')
  }
}

// Exportar o gerenciador principal e as funções de conveniência
export default cookieManager
export { CookieManager, type CookieOptions }