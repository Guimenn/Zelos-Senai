'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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

  const readFromUrl = useCallback(() => {
    const value = searchParams?.get(param)
    if (!value) return null
    const internal = externalToInternal[value] ?? value
    return internal
  }, [searchParams, param, externalToInternal])

  const [activeTab, setActiveTabState] = useState<string>(defaultTab)

  useEffect(() => {
    const fromUrl = readFromUrl()
    let next = fromUrl ?? defaultTab
    if (isAllowed && !isAllowed(next)) {
      next = defaultTab
    }
    setActiveTabState(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, readFromUrl, isAllowed, defaultTab])

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    const external = internalToExternal[tab] ?? tab
    const params = new URLSearchParams(searchParams?.toString())
    params.set(param, external)
    router.replace(`${pathname}?${params.toString()}`)
  }, [internalToExternal, param, pathname, router, searchParams])

  return { activeTab, setActiveTab }
}


