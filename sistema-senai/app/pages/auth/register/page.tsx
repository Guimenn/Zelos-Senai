'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaLock, 
  FaEnvelope, 
  FaIdCard, 
  FaPhone, 
  FaMapMarkerAlt,
  FaArrowRight, 
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaGraduationCap, 
  FaWrench, 
  FaCog,
  FaUserTie
} from 'react-icons/fa'
import Logo from '../../../../components/logo'  
import Link from 'next/link'
import { PrimaryButton } from '../../../../components/ui/button'
import Input, { PasswordInput, EmailInput, PhoneInput } from '../../../../components/ui/input'


export default function Register() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    senha: '',
    confirmarSenha: '',
    tipoUsuario: 'profissional'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState('')

  const userTypes = [
    { value: 'profissional', label: 'Profissional', icon: <FaGraduationCap />, color: '#1976d2' },
    { value: 'tecnico', label: 'Técnico', icon: <FaWrench />, color: '#388e3c' },
    { value: 'admin', label: 'Administrador', icon: <FaCog />, color: '#d32f2f' }
  ]

  // Função para formatar CPF com máscara
  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    let formatted = ''
    
    for (let i = 0; i < cpf.length && i < 11; i++) {
      if (i === 3 || i === 6) {
        formatted += '.'
      } else if (i === 9) {
        formatted += '-'
      }
      formatted += cpf[i]
    }
    
    return formatted
  }

  // Função para formatar telefone com máscara
  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, '')
    let formatted = ''
    
    if (phone.length <= 10) {
      // Formato: (11) 9999-9999
      for (let i = 0; i < phone.length && i < 10; i++) {
        if (i === 0) {
          formatted += '('
        } else if (i === 2) {
          formatted += ') '
        } else if (i === 6) {
          formatted += '-'
        }
        formatted += phone[i]
      }
    } else {
      // Formato: (11) 99999-9999
      for (let i = 0; i < phone.length && i < 11; i++) {
        if (i === 0) {
          formatted += '('
        } else if (i === 2) {
          formatted += ') '
        } else if (i === 7) {
          formatted += '-'
        }
        formatted += phone[i]
      }
    }
    
    return formatted
  }

  // Função para validar CPF
  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    // Validar primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    // Validar segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }

  // Função para validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = event.target.value
    
    // Aplicar formatação específica
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'telefone') {
      value = formatPhone(value)
    }
    
    setFormData({
      ...formData,
      [field]: value
    })
    
    // Limpar erro quando o usuário começa a digitar
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    // Validação do nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    }

    // Validação do email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validação do CPF
    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    // Validação do telefone
    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório'
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone inválido'
    }

    // Validação do endereço
    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório'
    }

    // Validação da senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter letra maiúscula, minúscula e número'
    }

    // Validação da confirmação de senha
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha'
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setRegistrationError('')
    setIsLoading(true)

    console.log('Formulário submetido')
    const isValid = validateForm()
    console.log('Validação:', isValid, 'Erros:', errors)

    if (isValid) {
      // Simular registro - em produção, isso seria uma chamada para a API
      console.log('Tentativa de registro:', formData)
      
      // Simular delay de registro
      setTimeout(() => {
        // Simular sucesso no registro
        setRegistrationSuccess(true)
        setIsLoading(false)
      }, 2000)
    } else {
      setIsLoading(false)
      // Forçar re-render para mostrar os erros
      setTimeout(() => {
        console.log('Erros após timeout:', errors)
      }, 100)
    }
  }

  const handleTogglePasswordVisibility = (field: 'senha' | 'confirmarSenha') => {
    if (field === 'senha') {
    setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  if (registrationSuccess) {
    return (
      
      <div className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="max-w-md w-full relative z-10">
          <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 text-center ${
            theme === 'dark' 
              ? 'bg-gray-900/5 border-gray-700/10' 
              : 'bg-gray-50/5 border-white/10'
          }`}>
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaCheck className="text-white text-3xl" />
          </div>
            <h1 className={`text-2xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Registro Concluído!
          </h1>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Sua conta foi criada com sucesso. Você pode fazer login agora.
            </p>
            <Link href="/pages/auth/login">
              <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                <FaArrowRight className="text-sm" />
                Ir para Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      {/* Container principal */}
      <div className="max-w-2xl w-full relative z-10">
        {/* Card de registro */}
        <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 ${
          theme === 'dark' 
            ? 'bg-gray-900/5 border-gray-700/10' 
            : 'bg-gray-50/5 border-white/10'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
              <Logo />
            <h1 className={`text-2xl font-bold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Criar Conta
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Sistema de Chamados SENAI
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {registrationError && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm">
                {registrationError}
              </div>
            )}

            {/* Nome */}
            <Input
              value={formData.nome}
              onChange={handleInputChange('nome')}
              placeholder="Nome completo"
              disabled={isLoading}
              error={errors.nome}
              icon={<FaUser className="text-white/50 text-sm" />}
              required
            />

            {/* Email */}
            <EmailInput
                value={formData.email}
                onChange={handleInputChange('email')}
              placeholder="Email"
              disabled={isLoading}
              error={errors.email}
              icon={<FaEnvelope className="text-white/50 text-sm" />}
              required
            />

            {/* CPF e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={formData.cpf}
                onChange={handleInputChange('cpf')}
                placeholder="CPF 000.000.000-00"
                disabled={isLoading}
                error={errors.cpf}
                icon={<FaIdCard className="text-white/50 text-sm" />}
                maxLength={14}
                required
              />

              <PhoneInput
                value={formData.telefone}
                onChange={handleInputChange('telefone')}
                placeholder="Telefone (00) 00000-0000"
                disabled={isLoading}
                error={errors.telefone}
                icon={<FaPhone className="text-white/50 text-sm" />}
                maxLength={15}
                required  
              />
            </div>

            {/* Endereço */}
            <Input
              value={formData.endereco}
              onChange={handleInputChange('endereco')}
              placeholder="Endereço completo"
              disabled={isLoading}
              error={errors.endereco}
              icon={<FaMapMarkerAlt className="text-white/50 text-sm" />}
              required
            />

            {/* Tipo de Usuário */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserTie className="text-white/50 text-sm" />
              </div>
              <select
                value={formData.tipoUsuario}
                onChange={handleInputChange('tipoUsuario')}
                disabled={isLoading}
                className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none"
              >
                {userTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-gray-800 text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Senha */}
            <PasswordInput
              value={formData.senha}
              onChange={handleInputChange('senha')}
              placeholder="Senha"
              disabled={isLoading}
              error={errors.senha}
              icon={<FaLock className="text-white/50 text-sm" />}
              showPassword={showPassword}
              onTogglePassword={() => handleTogglePasswordVisibility('senha')}
              required
            />

            {/* Confirmar Senha */}
            <PasswordInput
              value={formData.confirmarSenha}
              onChange={handleInputChange('confirmarSenha')}
              placeholder="Confirmar senha"
              disabled={isLoading}
              error={errors.confirmarSenha}
              icon={<FaLock className="text-white/50 text-sm" />}
              showPassword={showConfirmPassword}
              onTogglePassword={() => handleTogglePasswordVisibility('confirmarSenha')}
              required
            />

            {/* Botão de Registro */}
            <PrimaryButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Criando conta..."
              icon={<FaCheck className="text-sm" />}
            >
              Criar Conta
            </PrimaryButton>

            {/* Link para Login */}
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Já tem uma conta?{' '}
                <Link href="/pages/auth/login" className="text-red-300 hover:text-red-200 transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
