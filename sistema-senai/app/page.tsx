'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  userId: number
  userRole: string
  iat: number
  exp: number
}

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token)
        const userRole = decodedToken.userRole

        router.push('/pages/home')
      } catch (error) {
        // Se o token for inválido, redirecionar para o login
        console.error('Token inválido:', error)
        router.push('/pages/auth/login')
      }
    } else {
      // Se não houver token, redirecionar para o login
      router.push('/pages/auth/login')
    }
  }, [router])

  return null // Renderiza nada enquanto o redirecionamento ocorre
}

