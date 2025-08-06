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
  FaUserTie,
  FaCertificate,
  FaBriefcase,
  FaTools,
  FaCalendarAlt,
  FaStar,
  FaAward,
  FaShieldAlt,
  FaClipboardList,
  FaFileAlt,
  FaPlus,
  FaTrash
} from 'react-icons/fa'
import Logo from '../../../../components/logo'  
import Link from 'next/link'
import { PrimaryButton } from '../../../../components/ui/button'
import Input, { PasswordInput, EmailInput, PhoneInput } from '../../../../components/ui/input'
import VantaBackground from '../../../../components/VantaBackground'

export default function TechnicianRegister() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    // Informações Pessoais
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    
    // Informações Profissionais
    especialidade: '',
    anosExperiencia: '',
    certificacoes: [] as string[],
    areasAtuacao: [] as string[],
    
    // Informações de Acesso
    senha: '',
    confirmarSenha: '',
    
    // Informações Adicionais
    disponibilidade: 'integral',
    nivelUrgencia: 'medio',
    observacoes: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [newCertificacao, setNewCertificacao] = useState('')
  const [newAreaAtuacao, setNewAreaAtuacao] = useState('')

  const especialidades = [
    'Equipamentos Industriais',
    'Climatização e Refrigeração',
    'Sistemas Elétricos',
    'Sistemas Hidráulicos',
    'Informática e Redes',
    'Sistemas de Segurança',
    'Iluminação',
    'Automação Industrial',
    'Manutenção Preventiva',
    'Manutenção Corretiva',
    'Outros'
  ]

  const areasAtuacao = [
    'Equipamentos de Solda',
    'Máquinas CNC',
    'Ar Condicionado',
    'Sistemas de Ventilação',
    'Painéis Elétricos',
    'Motores Elétricos',
    'Sistemas de Bombeamento',
    'Computadores e Periféricos',
    'Redes de Computadores',
    'Câmeras de Segurança',
    'Sistemas de Alarme',
    'Iluminação LED',
    'Sistemas de Controle',
    'Instrumentação',
    'Caldeiras',
    'Compressores',
    'Geradores',
    'Transformadores',
    'Subestações',
    'Outros'
  ]

  const niveisUrgencia = [
    { value: 'baixo', label: 'Baixo', description: 'Disponível para manutenções programadas' },
    { value: 'medio', label: 'Médio', description: 'Disponível para emergências durante horário comercial' },
    { value: 'alto', label: 'Alto', description: 'Disponível 24/7 para emergências críticas' }
  ]

  const disponibilidades = [
    { value: 'integral', label: 'Tempo Integral', description: 'Disponível 8h por dia' },
    { value: 'parcial', label: 'Tempo Parcial', description: 'Disponível 4h por dia' },
    { value: 'flexivel', label: 'Flexível', description: 'Disponível conforme demanda' },
    { value: 'plantao', label: 'Plantão', description: 'Disponível em regime de plantão' }
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

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const addCertificacao = () => {
    if (newCertificacao.trim() && !formData.certificacoes.includes(newCertificacao.trim())) {
      setFormData(prev => ({
        ...prev,
        certificacoes: [...prev.certificacoes, newCertificacao.trim()]
      }))
      setNewCertificacao('')
    }
  }

  const removeCertificacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificacoes: prev.certificacoes.filter((_, i) => i !== index)
    }))
  }

  const addAreaAtuacao = () => {
    if (newAreaAtuacao.trim() && !formData.areasAtuacao.includes(newAreaAtuacao.trim())) {
      setFormData(prev => ({
        ...prev,
        areasAtuacao: [...prev.areasAtuacao, newAreaAtuacao.trim()]
      }))
      setNewAreaAtuacao('')
    }
  }

  const removeAreaAtuacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areasAtuacao: prev.areasAtuacao.filter((_, i) => i !== index)
    }))
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

    // Validação da data de nascimento
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória'
    } else {
      const idade = new Date().getFullYear() - new Date(formData.dataNascimento).getFullYear()
      if (idade < 18) {
        newErrors.dataNascimento = 'Técnico deve ter pelo menos 18 anos'
      }
    }

    // Validação da especialidade
    if (!formData.especialidade) {
      newErrors.especialidade = 'Especialidade é obrigatória'
    }

    // Validação dos anos de experiência
    if (!formData.anosExperiencia) {
      newErrors.anosExperiencia = 'Anos de experiência é obrigatório'
    } else if (parseInt(formData.anosExperiencia) < 0) {
      newErrors.anosExperiencia = 'Anos de experiência deve ser um número positivo'
    }

    // Validação das áreas de atuação
    if (formData.areasAtuacao.length === 0) {
      newErrors.areasAtuacao = 'Pelo menos uma área de atuação é obrigatória'
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
              Cadastro Concluído!
          </h1>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Seu cadastro como técnico foi realizado com sucesso. Aguarde a aprovação da administração.
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
    <VantaBackground />
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
      {/* Container principal */}
      <div className="max-w-4xl w-full relative z-10">
        {/* Card de registro */}
        <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 ${
          theme === 'dark' 
            ? 'bg-gray-900/5 border-gray-700/10' 
            : 'bg-gray-50/5 border-white/10'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
              <Logo />
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Cadastro de Técnico
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Sistema de Manutenção SENAI - Área Técnica
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {registrationError && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm">
                {registrationError}
              </div>
            )}

            {/* Seção 1: Informações Pessoais */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FaUser className="text-red-400" />
                Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Data de Nascimento */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-white/50 text-sm" />
                  </div>
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={handleInputChange('dataNascimento')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm ${
                      errors.dataNascimento ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.dataNascimento && (
                    <p className="text-red-400 text-xs mt-1">{errors.dataNascimento}</p>
                  )}
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
              </div>
            </div>

            {/* Seção 2: Informações Profissionais */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FaWrench className="text-red-400" />
                Informações Profissionais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Especialidade */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStar className="text-white/50 text-sm" />
                  </div>
                  <select
                    value={formData.especialidade}
                    onChange={handleInputChange('especialidade')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none ${
                      errors.especialidade ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">Selecione sua especialidade</option>
                    {especialidades.map((especialidade) => (
                      <option key={especialidade} value={especialidade} className="bg-gray-800 text-white">
                        {especialidade}
                      </option>
                    ))}
                  </select>
                  {errors.especialidade && (
                    <p className="text-red-400 text-xs mt-1">{errors.especialidade}</p>
                  )}
                </div>

                {/* Anos de Experiência */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBriefcase className="text-white/50 text-sm" />
                  </div>
                  <input
                    type="number"
                    value={formData.anosExperiencia}
                    onChange={handleInputChange('anosExperiencia')}
                    placeholder="Anos de experiência"
                    disabled={isLoading}
                    min="0"
                    max="50"
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm ${
                      errors.anosExperiencia ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.anosExperiencia && (
                    <p className="text-red-400 text-xs mt-1">{errors.anosExperiencia}</p>
                  )}
                </div>
              </div>

              {/* Certificações */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <FaCertificate className="text-red-400" />
                  Certificações (opcional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertificacao}
                    onChange={(e) => setNewCertificacao(e.target.value)}
                    placeholder="Adicionar certificação"
                    className="flex-1 px-3 py-2 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={addCertificacao}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <FaPlus className="text-sm" />
                    Adicionar
                  </button>
                </div>
                {formData.certificacoes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.certificacoes.map((cert, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertificacao(index)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Áreas de Atuação */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <FaTools className="text-red-400" />
                  Áreas de Atuação *
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={newAreaAtuacao}
                    onChange={(e) => setNewAreaAtuacao(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  >
                    <option value="">Selecione uma área</option>
                    {areasAtuacao.map((area) => (
                      <option key={area} value={area} className="bg-gray-800 text-white">
                        {area}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addAreaAtuacao}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <FaPlus className="text-sm" />
                    Adicionar
                  </button>
                </div>
                {formData.areasAtuacao.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.areasAtuacao.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => removeAreaAtuacao(index)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.areasAtuacao && (
                  <p className="text-red-400 text-xs mt-1">{errors.areasAtuacao}</p>
                )}
              </div>
            </div>

            {/* Seção 3: Disponibilidade e Preferências */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FaCalendarAlt className="text-red-400" />
                Disponibilidade e Preferências
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Disponibilidade */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Disponibilidade de Trabalho
                  </label>
                  <select
                    value={formData.disponibilidade}
                    onChange={handleInputChange('disponibilidade')}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none"
                  >
                    {disponibilidades.map((disp) => (
                      <option key={disp.value} value={disp.value} className="bg-gray-800 text-white">
                        {disp.label} - {disp.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nível de Urgência */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Nível de Urgência
                  </label>
                  <select
                    value={formData.nivelUrgencia}
                    onChange={handleInputChange('nivelUrgencia')}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none"
                  >
                    {niveisUrgencia.map((nivel) => (
                      <option key={nivel.value} value={nivel.value} className="bg-gray-800 text-white">
                        {nivel.label} - {nivel.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Observações Adicionais (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={handleInputChange('observacoes')}
                  placeholder="Informações adicionais sobre sua experiência, disponibilidade ou preferências..."
                  rows={3}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm resize-none"
                />
              </div>
            </div>

            {/* Seção 4: Credenciais de Acesso */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FaShieldAlt className="text-red-400" />
                Credenciais de Acesso
              </h2>
              
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Botão de Registro */}
            <PrimaryButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Cadastrando técnico..."
              icon={<FaCheck className="text-sm" />}
            >
              Cadastrar Técnico
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
