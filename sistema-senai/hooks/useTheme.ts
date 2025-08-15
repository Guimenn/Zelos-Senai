'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Força o tema escuro sempre
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [])

  // Sempre retorna tema escuro
  return {
    theme: 'dark',
    setTheme: () => {}, // Função vazia - não permite alteração
    resolvedTheme: 'dark',
    mounted
  }
}