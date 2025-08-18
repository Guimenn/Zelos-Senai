'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa'
import { useTheme } from '@/hooks/useTheme'
import Logo from '@/components/logo'
import { authCookies } from '@/utils/cookies'
import { jwtDecode } from 'jwt-decode'

export default function Unauthorized() {
  const router = useRouter()
  const { theme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Detectar o tipo de usuário baseado no token
  useEffect(() => {
    try {
      const token = authCookies.getToken()
      if (token) {
        const decoded: any = jwtDecode(token)
        const role = decoded.role || decoded.userRole
        setUserRole(role)
      }
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
    }
  }, [])

  // Função para redirecionar para a página inicial do usuário
  const handleGoToUserHome = () => {
    if (!userRole) {
      // Se não conseguir detectar o role, vai para login
      router.push('/pages/auth/login')
      return
    }

    const role = userRole.toLowerCase()
    
    if (role === 'agent' || role === 'tecnico') {
      router.push('/pages/agent/home')
    } else if (role === 'admin') {
      router.push('/pages/home')
    } else if (role === 'client' || role === 'profissional') {
      router.push('/pages/client/home')
    } else {
      // Fallback para login se role não for reconhecido
      router.push('/pages/auth/login')
    }
  }

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 text-center ${
          theme === 'dark' 
            ? 'bg-gray-900/5 border-gray-700/10' 
            : 'bg-gray-50/5 border-white/10'
        }`}>
          <Logo showBackground={true} className="mx-auto mb-6" />
          
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaExclamationTriangle className="text-white text-3xl" />
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Acesso Negado
          </h1>
          
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-white/70' : 'text-gray-600'
          }`}>
            Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isso é um erro.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleGoToUserHome}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:from-gray-600 hover:to-gray-700 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <FaArrowLeft className="text-sm" />
              Voltar ao Início
            </button>
            
            <button
              onClick={() => router.push('/pages/auth/login')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02]"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}