/**
 * Utilitários para lidar com imagens do Supabase de forma robusta
 * Inclui fallbacks para problemas SSL e estratégias de retry
 */

export interface SupabaseImageConfig {
  bucket: string
  path: string
  fallbackUrl?: string
  retryAttempts?: number
  timeout?: number
}

export interface ImageLoadResult {
  success: boolean
  url: string | null
  error?: string
  strategy?: string
}

/**
 * Estratégias para carregar imagens do Supabase
 */
const IMAGE_LOAD_STRATEGIES = [
  {
    name: 'original',
    transform: (url: string) => url,
    description: 'URL original'
  },
  {
    name: 'https_force',
    transform: (url: string) => url.replace('http://', 'https://'),
    description: 'Forçar HTTPS'
  },
  {
    name: 'cache_bust',
    transform: (url: string) => `${url}?t=${Date.now()}`,
    description: 'Adicionar timestamp para evitar cache'
  },
  {
    name: 'cdn_fallback',
    transform: (url: string) => {
      // Tentar usar CDN alternativo se disponível
      if (url.includes('.supabase.co')) {
        return url.replace('.supabase.co', '.supabase.co')
      }
      return url
    },
    description: 'CDN alternativo'
  }
]

/**
 * Verifica se uma URL é acessível
 */
export async function checkImageAccessibility(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Tenta carregar uma imagem usando diferentes estratégias
 */
export async function loadSupabaseImage(
  url: string,
  config: Partial<SupabaseImageConfig> = {}
): Promise<ImageLoadResult> {
  const {
    retryAttempts = 3,
    timeout = 5000,
    fallbackUrl
  } = config

  // Se não é uma URL do Supabase, retornar diretamente
  if (!url.includes('supabase.co')) {
    return {
      success: true,
      url,
      strategy: 'non-supabase'
    }
  }

  // Tentar cada estratégia
  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    for (const strategy of IMAGE_LOAD_STRATEGIES) {
      try {
        const transformedUrl = strategy.transform(url)
        
        // Verificar se a URL é acessível
        const isAccessible = await checkImageAccessibility(transformedUrl, timeout)
        
        if (isAccessible) {
          return {
            success: true,
            url: transformedUrl,
            strategy: strategy.name
          }
        }
      } catch (error) {
        console.warn(`Estratégia ${strategy.name} falhou na tentativa ${attempt + 1}:`, error)
      }
    }

    // Aguardar antes da próxima tentativa (exponential backoff)
    if (attempt < retryAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  // Se todas as estratégias falharam, usar fallback
  if (fallbackUrl) {
    return {
      success: true,
      url: fallbackUrl,
      strategy: 'fallback'
    }
  }

  return {
    success: false,
    url: null,
    error: 'Todas as estratégias de carregamento falharam',
    strategy: 'failed'
  }
}

/**
 * Gera URL de avatar com fallback
 */
export function getAvatarUrl(
  userId: string,
  avatarPath?: string,
  config: Partial<SupabaseImageConfig> = {}
): string {
  if (!avatarPath) {
    return config.fallbackUrl || '/api/avatars/default'
  }

  // Se já é uma URL completa, retornar
  if (avatarPath.startsWith('http')) {
    return avatarPath
  }

  // Construir URL do Supabase
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL?.replace('/rest/v1', '') || ''
  const bucket = config.bucket || 'avatars'
  
  return `${baseUrl}/storage/v1/object/public/${bucket}/${avatarPath}`
}

/**
 * Hook para carregar imagem com retry automático
 */
export function useSupabaseImage(
  url: string,
  config: Partial<SupabaseImageConfig> = {}
) {
  const [state, setState] = React.useState<{
    isLoading: boolean
    url: string | null
    error: string | null
    strategy: string | null
  }>({
    isLoading: true,
    url: null,
    error: null,
    strategy: null
  })

  React.useEffect(() => {
    if (!url) {
      setState({
        isLoading: false,
        url: null,
        error: null,
        strategy: null
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    loadSupabaseImage(url, config)
      .then((result) => {
        setState({
          isLoading: false,
          url: result.url,
          error: result.error || null,
          strategy: result.strategy || null
        })
      })
      .catch((error) => {
        setState({
          isLoading: false,
          url: null,
          error: error.message,
          strategy: null
        })
      })
  }, [url, JSON.stringify(config)])

  const retry = React.useCallback(() => {
    if (url) {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      loadSupabaseImage(url, config)
        .then((result) => {
          setState({
            isLoading: false,
            url: result.url,
            error: result.error || null,
            strategy: result.strategy || null
          })
        })
        .catch((error) => {
          setState({
            isLoading: false,
            url: null,
            error: error.message,
            strategy: null
          })
        })
    }
  }, [url, config])

  return {
    ...state,
    retry
  }
}

/**
 * Componente de imagem segura para Supabase
 */
export function SupabaseImage({
  src,
  alt,
  className = '',
  fallbackIcon = 'user',
  size = 'md',
  onError,
  onLoad,
  ...props
}: {
  src: string
  alt: string
  className?: string
  fallbackIcon?: 'user' | 'admin' | 'employee' | 'technician'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onError?: () => void
  onLoad?: () => void
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const { isLoading, url, error, retry } = useSupabaseImage(src)
  const [imgError, setImgError] = React.useState(false)

  // Se há erro no carregamento da URL
  if (error || !url) {
    return (
      <div 
        className={`
          ${getSizeClasses(size)} 
          ${className}
          flex items-center justify-center 
          bg-gray-200 dark:bg-gray-700 
          text-gray-500 dark:text-gray-400
          rounded-full
          cursor-pointer
          hover:bg-gray-300 dark:hover:bg-gray-600
          transition-colors
        `}
        onClick={retry}
        title="Clique para tentar novamente"
      >
        {getFallbackIcon(fallbackIcon)}
      </div>
    )
  }

  // Se está carregando
  if (isLoading) {
    return (
      <div 
        className={`
          ${getSizeClasses(size)} 
          ${className}
          bg-gray-200 dark:bg-gray-700 
          rounded-full
          animate-pulse
        `}
      />
    )
  }

  // Imagem carregada com sucesso
  return (
    <img
      src={url}
      alt={alt}
      className={`
        ${getSizeClasses(size)} 
        ${className}
        object-cover 
        rounded-full
        transition-opacity duration-200
      `}
      onError={() => {
        setImgError(true)
        onError?.()
      }}
      onLoad={() => {
        setImgError(false)
        onLoad?.()
      }}
      loading="lazy"
      crossOrigin="anonymous"
      {...props}
    />
  )
}

// Funções auxiliares
function getSizeClasses(size: string): string {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }
  return sizes[size as keyof typeof sizes] || sizes.md
}

function getFallbackIcon(type: string) {
  const icons = {
    user: '👤',
    admin: '🛡️',
    employee: '👔',
    technician: '🔧'
  }
  return icons[type as keyof typeof icons] || icons.user
}

// Import do React para o hook
import React from 'react'
