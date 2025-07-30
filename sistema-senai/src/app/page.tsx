'use client'

import { useState } from 'react'
import {
  Visibility,
  VisibilityOff,
  Build,
  Person,
  Lock,
  ArrowForward,
  Security
} from '@mui/icons-material'
import VantaBackground from '../components/VantaBackground'

export default function Home() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [detectedUserType, setDetectedUserType] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  const userTypes = [
    { value: 'admin', label: 'Administrador', icon: <Person />, color: '#d32f2f' },
    { value: 'profissional', label: 'Profissional', icon: <Person />, color: '#1976d2' },
    { value: 'tecnico', label: 'Técnico', icon: <Build />, color: '#388e3c' }
  ]

  // Função para detectar tipo de usuário baseado no email
  const detectUserType = (email: string) => {
    if (!email) return null
    
    const emailLower = email.toLowerCase()
    
    // Padrões para detectar tipo de usuário
    if (emailLower.includes('admin') || emailLower.includes('administrador') || emailLower.includes('gerente')) {
      return 'admin'
    } else if (emailLower.includes('prof') || emailLower.includes('profissional') || emailLower.includes('instrutor')) {
      return 'profissional'
    } else if (emailLower.includes('tec') || emailLower.includes('tecnico') || emailLower.includes('manutencao')) {
      return 'tecnico'
    }
    
    // Se não conseguir detectar, retorna null
    return null
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormData({
      ...formData,
      [field]: value
    })
    
    // Detectar tipo de usuário automaticamente quando email muda
    if (field === 'email') {
      const detectedType = detectUserType(value)
      setDetectedUserType(detectedType)
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.email) {
      newErrors.email = 'Usuário é obrigatório'
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setLoginError('')
    setIsLoading(true)

    if (validateForm()) {
      // Simular autenticação - em produção, isso seria uma chamada para a API
      console.log('Tentativa de login:', formData)
      
      // Simular delay de autenticação
      setTimeout(() => {
        // Aqui você faria a validação real com o backend
        // Simulando diferentes tipos de usuário
        const validCredentials = [
          { email: 'admin@senai.com', password: '123456', type: 'admin' },
          { email: 'profissional@senai.com', password: '123456', type: 'profissional' },
          { email: 'tecnico@senai.com', password: '123456', type: 'tecnico' },
          { email: 'admin.senai@senai.com', password: '123456', type: 'admin' },
          { email: 'prof.senai@senai.com', password: '123456', type: 'profissional' },
          { email: 'tec.senai@senai.com', password: '123456', type: 'tecnico' },
          { email: 'gerente@senai.com', password: '123456', type: 'admin' },
          { email: 'instrutor@senai.com', password: '123456', type: 'profissional' },
          { email: 'manutencao@senai.com', password: '123456', type: 'tecnico' }
        ]

        const isValid = validCredentials.some(cred => 
          cred.email === formData.email && 
          cred.password === formData.password
        )

        if (isValid) {
          // Encontrar o tipo de usuário correto
          const userCredential = validCredentials.find(cred => 
            cred.email === formData.email && 
            cred.password === formData.password
          )
          
          setDetectedUserType(userCredential?.type || null)
          setIsAuthenticated(true)
          setLoginError('')
        } else {
          setLoginError('Credenciais inválidas. Verifique usuário e senha.')
        }
        setIsLoading(false)
      }, 1500)
    } else {
      setIsLoading(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (isAuthenticated && detectedUserType) {
    const userTypeInfo = userTypes.find(type => type.value === detectedUserType)
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <VantaBackground />
        <div className="max-w-2xl w-full p-8 text-center animate-fade-in bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 relative z-10">
          <div className="w-20 h-20 bg-senai-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            {userTypeInfo?.icon || <Build className="text-white text-3xl" />}
          </div>
          <h1 className="text-3xl font-bold text-senai-red mb-4">
            Bem-vindo ao Sistema de Chamados SENAI!
          </h1>
          <p className="text-gray-600 mb-6">
            Você foi autenticado com sucesso como <strong>{userTypeInfo?.label}</strong>.
          </p>
          <div className="inline-flex items-center gap-2 bg-senai-red text-white px-4 py-2 rounded-full mb-6">
            {userTypeInfo?.icon}
            <span className="font-semibold">{userTypeInfo?.label}</span>
          </div>
          <p className="text-gray-500 mb-8">
            Usuário: {formData.email}
          </p>
          <button
            onClick={() => {
              setIsAuthenticated(false)
              setFormData({ email: '', password: '' })
              setDetectedUserType(null)
            }}
            className="bg-gradient-to-r from-senai-red to-senai-red-light text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:from-senai-red-dark hover:to-senai-red transform hover:-translate-y-1 hover:shadow-lg"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <VantaBackground />
      
      <div className="max-w-md w-full p-8 relative z-10 animate-fade-in bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-senai-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            <Build className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema de Chamados
          </h1>
          <p className="text-gray-600">
            SENAI Armando de Arruda Pereira
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {loginError}
            </div>
          )}

          {/* Campo Usuário */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Person className="text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Digite seu usuário"
              disabled={isLoading}
              className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-senai-red focus:border-transparent transition-all duration-300 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Digite sua senha"
              disabled={isLoading}
              className={`w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-senai-red focus:border-transparent transition-all duration-300 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={handleTogglePasswordVisibility}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Opções de Login */}
          <div className="flex justify-between items-center">
            <label className="flex items-center text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-senai-red border-gray-300 rounded focus:ring-senai-red"
              />
              <span className="ml-2 text-sm">Lembrar de mim</span>
            </label>
            <button
              type="button"
              className="text-senai-red text-sm hover:underline transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-senai-red to-senai-red-light text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:from-senai-red-dark hover:to-senai-red transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Entrando...
              </>
            ) : (
              <>
                <ArrowForward />
                Entrar no Sistema
              </>
            )}
          </button>
          
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Security className="text-sm" />
          <span className="text-sm">Sistema seguro e confiável</span>
        </div>
        <p className="text-xs opacity-80">
          © 2024 SENAI Armando de Arruda Pereira - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
