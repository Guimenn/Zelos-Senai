'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useMemo } from 'react'

type UseTabStateOptions = {
  param?: string
  defaultTab: string
  externalToInternal?: Record<string, string>
  internalToExternal?: Record<string, string>
  isAllowed?: (tab: string) => boolean
}

export function useTabState(options: UseTabStateOptions) {
  const {
    param = 'tab',
    defaultTab,
    externalToInternal = {},
    internalToExternal = {},
    isAllowed,
  } = options

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoizar a função de leitura da URL para evitar recriações
  const readFromUrl = useCallback(() => {
    const value = searchParams?.get(param)
    if (!value) return null
    const internal = externalToInternal[value] ?? value
    return internal
  }, [searchParams, param, externalToInternal])

  const [activeTab, setActiveTabState] = useState<string>(defaultTab)

  // Memoizar a função setActiveTab para evitar recriações
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    const external = internalToExternal[tab] ?? tab
    const params = new URLSearchParams(searchParams?.toString())
    params.set(param, external)
    router.replace(`${pathname}?${params.toString()}`)
  }, [internalToExternal, param, pathname, router, searchParams])

  // Consolidar a lógica de inicialização em um único useEffect
  useEffect(() => {
    const fromUrl = readFromUrl()
    let next = fromUrl ?? defaultTab
    
    // Verificar se a aba é permitida
    if (isAllowed && !isAllowed(next)) {
      next = defaultTab
    }
    
    // Só atualizar se for diferente para evitar re-renderizações desnecessárias
    if (activeTab !== next) {
      setActiveTabState(next)
    }
  }, [pathname, readFromUrl, isAllowed, defaultTab, activeTab])

  // Memoizar o retorno para evitar recriações do objeto
  return useMemo(() => ({ 
    activeTab, 
    setActiveTab 
  }), [activeTab, setActiveTab])
}


