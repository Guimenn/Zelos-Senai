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
    // Alinha com o defaultTheme do ThemeProvider (dark) para evitar mismatch na hidratação
    const initialTheme = typeof window !== 'undefined'
      ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      : 'dark'
    return {
      theme: initialTheme,
      setTheme,
      resolvedTheme: initialTheme,
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