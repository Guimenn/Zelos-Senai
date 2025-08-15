'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useAuth'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useRequireAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const role = user.role || user.userRole

      if (role === 'Agent' || role === 'tecnico') {
        router.push('/pages/agent/home')
      } else {
        router.push('/pages/home')
      }
    }
  }, [router, user, isLoading, isAuthenticated])

  return null // Renderiza nada enquanto o redirecionamento ocorre
}

