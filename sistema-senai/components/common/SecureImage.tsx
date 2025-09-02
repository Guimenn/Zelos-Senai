'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FaUser, FaUserShield, FaUserTie, FaUserCog } from 'react-icons/fa'

interface SecureImageProps {
  src: string
  alt: string
  className?: string
  fallbackIcon?: 'user' | 'admin' | 'employee' | 'technician'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onError?: () => void
  onLoad?: () => void
}

export default function SecureImage({
  src,
  alt,
  className = '',
  fallbackIcon = 'user',
  size = 'md',
  onError,
  onLoad
}: SecureImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Configurações de tamanho
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  // Ícones de fallback
  const fallbackIcons = {
    user: FaUser,
    admin: FaUserShield,
    employee: FaUserTie,
    technician: FaUserCog
  }

  const FallbackIcon = fallbackIcons[fallbackIcon]

  // Função para tentar carregar a imagem com diferentes estratégias
  const tryLoadImage = async (imageSrc: string) => {
    if (!imageSrc) {
      setImageError(true)
      setIsLoading(false)
      return
    }

    try {
      // Verificar se a URL é do Supabase
      if (imageSrc.includes('supabase.co')) {
        // Tentar carregar com diferentes estratégias
        const strategies = [
          // Estratégia 1: URL original
          imageSrc,
          // Estratégia 2: Forçar HTTPS
          imageSrc.replace('http://', 'https://'),
          // Estratégia 3: Adicionar timestamp para evitar cache
          `${imageSrc}?t=${Date.now()}`,
          // Estratégia 4: Usar URL alternativa (se disponível)
          imageSrc.replace('.supabase.co', '.supabase.co')
        ]

        for (let i = 0; i < strategies.length && retryCountRef.current < maxRetries; i++) {
          try {
            const testImg = new Image()
            testImg.crossOrigin = 'anonymous'
            
            await new Promise((resolve, reject) => {
              testImg.onload = resolve
              testImg.onerror = reject
              testImg.src = strategies[i]
              
              // Timeout de 5 segundos
              setTimeout(() => reject(new Error('Timeout')), 5000)
            })

            // Se chegou aqui, a imagem carregou com sucesso
            setCurrentSrc(strategies[i])
            setImageError(false)
            setIsLoading(false)
            onLoad?.()
            return
          } catch (strategyError) {
            console.warn(`Estratégia ${i + 1} falhou para:`, strategies[i], strategyError)
            retryCountRef.current++
          }
        }
      } else {
        // Para URLs não-Supabase, tentar carregar normalmente
        setCurrentSrc(imageSrc)
        setImageError(false)
        setIsLoading(false)
        onLoad?.()
        return
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error)
    }

    // Se todas as estratégias falharam
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  // Efeito para carregar a imagem quando src mudar
  useEffect(() => {
    if (src && src !== currentSrc) {
      setImageError(false)
      setIsLoading(true)
      retryCountRef.current = 0
      tryLoadImage(src)
    }
  }, [src])

  // Função para retry manual
  const handleRetry = () => {
    setImageError(false)
    setIsLoading(true)
    retryCountRef.current = 0
    tryLoadImage(src)
  }

  // Se há erro na imagem, mostrar ícone de fallback
  if (imageError) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          ${className}
          flex items-center justify-center 
          bg-gray-200 dark:bg-gray-700 
          text-gray-500 dark:text-gray-400
          rounded-full
          cursor-pointer
          hover:bg-gray-300 dark:hover:bg-gray-600
          transition-colors
        `}
        onClick={handleRetry}
        title="Clique para tentar novamente"
      >
        <FallbackIcon className="text-lg" />
      </div>
    )
  }

  // Se está carregando, mostrar skeleton
  if (isLoading) {
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          ${className}
          bg-gray-200 dark:bg-gray-700 
          rounded-full
          animate-pulse
        `}
      />
    )
  }

  // Se a imagem carregou com sucesso
  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`
        ${sizeClasses[size]} 
        ${className}
        object-cover 
        rounded-full
        transition-opacity duration-200
      `}
      onError={() => {
        console.warn('Erro ao carregar imagem:', currentSrc)
        setImageError(true)
        onError?.()
      }}
      onLoad={() => {
        setIsLoading(false)
        onLoad?.()
      }}
      loading="lazy"
      crossOrigin="anonymous"
    />
  )
}

// Hook para usar o SecureImage com estado
export function useSecureImage(src: string) {
  const [imageState, setImageState] = useState<{
    isLoading: boolean
    hasError: boolean
    currentSrc: string | null
  }>({
    isLoading: true,
    hasError: false,
    currentSrc: null
  })

  useEffect(() => {
    if (src) {
      setImageState(prev => ({ ...prev, isLoading: true, hasError: false }))
      
      // Tentar carregar a imagem
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        setImageState({
          isLoading: false,
          hasError: false,
          currentSrc: src
        })
      }
      
      img.onerror = () => {
        setImageState({
          isLoading: false,
          hasError: true,
          currentSrc: null
        })
      }
      
      img.src = src
    }
  }, [src])

  return imageState
}
