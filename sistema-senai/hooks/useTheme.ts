'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evita problemas de hidratação retornando um tema padrão até que o componente seja montado
  if (!mounted) {
    return {
      theme: 'dark',
      setTheme,
      resolvedTheme: 'dark',
      mounted: false
    }
  }

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted
  }
} 