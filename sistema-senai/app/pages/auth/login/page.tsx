'use client'

import { useState } from 'react'
import { Button, Checkbox, Card, CardBody, CardHeader, Chip } from "@heroui/react"
import { 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaLock, 
  FaArrowRight, 
  FaShieldAlt, 
  FaGraduationCap, 
  FaWrench, 
  FaCog 
} from 'react-icons/fa'
import Logo from '../../../../components/logo'
import Link from 'next/link'
import { PrimaryButton } from '../../../../components/ui/button'
import Input, { PasswordInput } from '../../../../components/ui/input'  

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
    { value: 'admin', label: 'Administrador', icon: <FaCog />, color: '#d32f2f' },
    { value: 'profissional', label: 'Profissional', icon: <FaGraduationCap />, color: '#1976d2' },
    { value: 'tecnico', label: 'Técnico', icon: <FaWrench />, color: '#388e3c' }
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
      <div className="flex items-center justify-center p-4">
      
        <div className="max-w-2xl w-full p-8 text-center animate-fade-in bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            {userTypeInfo?.icon || <FaCog className="text-white text-3xl" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Bem-vindo ao Sistema de Chamados SENAI!
          </h1>
          <p className="text-gray-600 mb-6">
            Você foi autenticado com sucesso como <strong>{userTypeInfo?.label}</strong>.
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full mb-6 shadow-lg">
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
            className="bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 transform hover:-translate-y-1 hover:shadow-lg"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      

      {/* Container principal minimalista */}
      <div className="max-w-sm w-full relative z-10">
        {/* Card de login minimalista */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          {/* Header minimalista */}
          <div className="text-center mb-8">
    
              <Logo />
        
            <h1 className="text-2xl font-bold text-white mb-1">
              Sistema de Chamados
            </h1>
            <p className="text-white/70 text-sm">
              SENAI Armando de Arruda Pereira
            </p>
          </div>

          {/* Formulário minimalista */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginError && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            {/* Campo Usuário */}
            <Input
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Usuário"
              disabled={isLoading}
              error={errors.email}
              icon={<FaUser className="text-white/50 text-sm" />}
              required
            />

            {/* Campo Senha */}
            <PasswordInput
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Senha"
              disabled={isLoading}
              error={errors.password}
              icon={<FaLock className="text-white/50 text-sm" />}
              showPassword={showPassword}
              onTogglePassword={handleTogglePasswordVisibility}
              required
            />

            {/* Opções de Login */}
            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center text-white/60">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3 h-3 text-red-500 border-white/20 rounded focus:ring-red-400 bg-white/5 mr-2"
                />
                Lembrar de mim
              </label>
              <button
                type="button"
                className="text-white/60 hover:text-red-300 transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão Principal */}
            <PrimaryButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Entrando..."
              icon={<FaArrowRight className="text-sm" />}
            >
              Entrar
            </PrimaryButton>

            {/* Link para Registro */}
            <div className="text-center mt-4">
              <p className="text-white/60 text-sm">
                Não tem uma conta?{' '}
                <Link href="/pages/auth/register" className="text-red-300 hover:text-red-200 transition-colors">
                  Criar conta
                </Link>
              </p>
            </div>
          </form>
           {/* Credenciais de teste minimalista */}
           <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <h3 className="text-white/80 font-medium mb-2 text-center text-xs">Credenciais de Teste</h3>
          <div className="space-y-1 text-white/60 text-xs">
            <p><span className="text-red-300">Admin:</span> admin@senai.com / 123456</p>
            <p><span className="text-blue-300">Profissional:</span> profissional@senai.com / 123456</p>
            <p><span className="text-green-300">Técnico:</span> tecnico@senai.com / 123456</p>
          </div>
        </div>
        </div>

       
      </div>

    </div>
  )
}
