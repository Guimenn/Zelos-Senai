'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { PrimaryButton } from '../ui/button'
import Input, { PasswordInput, EmailInput, PhoneInput } from '../ui/input'
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaPhone,
  FaUserTie,
  FaCalendarAlt,
  FaMapPin,
  FaBriefcase,
  FaBuilding,
  FaIdBadge,
  FaGraduationCap,
  FaShieldAlt,
  FaLock,
  FaTimes,
  FaCheck,
  FaTools,
  FaCertificate,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
  FaUpload
} from 'react-icons/fa'

type TechnicianRegisterModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (technician: any) => void
}

export default function TechnicianRegisterModal({ isOpen, onClose, onSuccess }: TechnicianRegisterModalProps) {
  const { theme } = useTheme()
  const selectClass = `w-full px-4 py-3 pl-10 backdrop-blur-sm rounded-lg focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none ${
    theme === 'dark'
      ? 'bg-gray-50/5 border border-white/10 text-white'
      : 'bg-white border border-gray-300 text-gray-900'
  }`
  const leftIconClass = theme === 'dark' ? 'text-white/80 text-sm' : 'text-gray-500 text-sm'
  const dateInputClass = `w-full px-4 py-3 pl-10 backdrop-blur-sm rounded-lg focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm ${
    theme === 'dark' ? 'bg-gray-50/5 border border-white/10 text-white' : 'bg-white border border-gray-300 text-gray-900'
  }`

  const [formData, setFormData] = useState({
    // Informações Pessoais
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    foto: '',
    
    // Informações Profissionais
    especialidade: '',
    anosExperiencia: '',
    certificacoes: [] as string[],
    areasAtuacao: [] as string[],
    categorias: [] as number[],
    
    // Informações de Acesso
    senha: '',
    confirmarSenha: '',
    
    // Informações Adicionais
    disponibilidade: '',
    nivelUrgencia: '',
    observacoes: ''
  })
  const [dragActive, setDragActive] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [newCertificacao, setNewCertificacao] = useState('')
  const [newAreaAtuacao, setNewAreaAtuacao] = useState('')
  const [categories, setCategories] = useState<Array<{id: number, name: string, description: string, color: string, icon: string}>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

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
    'Soldagem e Metalurgia',
    'Pneumática',
    'Mecânica Geral',
    'Eletrônica',
    'Telecomunicações'
  ]

  const disponibilidades = [
    { value: 'integral', label: 'Integral (8h)' },
    { value: 'meio-periodo', label: 'Meio Período (4h)' },
    { value: 'plantao', label: 'Plantão' },
    { value: 'sob-demanda', label: 'Sob Demanda' }
  ]

  const niveisUrgencia = [
    { value: 'baixo', label: 'Baixo' },
    { value: 'medio', label: 'Médio' },
    { value: 'alto', label: 'Alto' },
    { value: 'critico', label: 'Crítico' }
  ]

  // Função para buscar categorias
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:3001/helpdesk/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    } else {
      // Reset form when modal closes
      setFormData({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        endereco: '',
        dataNascimento: '',
        foto: '',
        especialidade: '',
        anosExperiencia: '',
        certificacoes: [],
        areasAtuacao: [],
        categorias: [],
        senha: '',
        confirmarSenha: '',
        disponibilidade: 'integral',
        nivelUrgencia: 'medio',
        observacoes: ''
      })
      setErrors({})
      setRegistrationError('')
      setNewCertificacao('')
      setNewAreaAtuacao('')
    }
  }, [isOpen])

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    let formatted = ''
    for (let i = 0; i < cpf.length && i < 11; i++) {
      if (i === 3 || i === 6) formatted += '.'
      else if (i === 9) formatted += '-'
      formatted += cpf[i]
    }
    return formatted
  }

  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, '')
    let formatted = ''
    for (let i = 0; i < phone.length && i < 11; i++) {
      if (i === 0) formatted += '('
      else if (i === 2) formatted += ') '
      else if (i === 7) formatted += '-'
      formatted += phone[i]
    }
    return formatted
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value
    
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'telefone') {
      value = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoryId)
        ? prev.categorias.filter(id => id !== categoryId)
        : [...prev.categorias, categoryId]
    }))
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Validações básicas
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório'
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório'
    if (!formData.especialidade) newErrors.especialidade = 'Especialidade é obrigatória'
    if (!formData.anosExperiencia.trim()) newErrors.anosExperiencia = 'Anos de experiência é obrigatório'
    if (!formData.senha.trim()) newErrors.senha = 'Senha é obrigatória'
    if (!formData.confirmarSenha.trim()) newErrors.confirmarSenha = 'Confirmação de senha é obrigatória'

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validação de CPF
    const cpfNumbers = formData.cpf.replace(/\D/g, '')
    if (formData.cpf && cpfNumbers.length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    }

    // Validação de telefone
    const phoneNumbers = formData.telefone.replace(/\D/g, '')
    if (formData.telefone && (phoneNumbers.length < 10 || phoneNumbers.length > 11)) {
      newErrors.telefone = 'Telefone inválido'
    }

    // Validação de senha
    if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem'
    }

    // Validação de anos de experiência
    const anosExp = parseInt(formData.anosExperiencia)
    if (formData.anosExperiencia && (isNaN(anosExp) || anosExp < 0 || anosExp > 50)) {
      newErrors.anosExperiencia = 'Anos de experiência deve ser um número entre 0 e 50'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, foto: e.target?.result as string }))
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, foto: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setRegistrationError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      const technicianData = {
        user: {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone.replace(/\D/g, ''),
          password: formData.senha
        },
        employee_id: formData.cpf.replace(/\D/g, ''),
        department: formData.especialidade || 'Técnico',
        skills: [
          formData.especialidade,
          `EXP:${formData.anosExperiencia}`,
          `AVAIL:${formData.disponibilidade}`,
          `URGENCY:${formData.nivelUrgencia}`,
          ...formData.certificacoes.map(cert => `CERT:${cert}`),
          ...formData.areasAtuacao
        ].filter(Boolean),
        max_tickets: 10,
        categories: formData.categorias
      }

      const response = await fetch('http://localhost:3001/admin/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(technicianData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao cadastrar técnico')
      }

      const newTechnician = await response.json()
      onSuccess(newTechnician)
      onClose()
    } catch (error: any) {
      console.error('Erro ao cadastrar técnico:', error)
      setRegistrationError(error.message || 'Erro interno do servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePasswordVisibility = (field: 'senha' | 'confirmarSenha') => {
    if (field === 'senha') setShowPassword(prev => !prev)
    else setShowConfirmPassword(prev => !prev)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className={`p-6 border-b sticky top-0 z-10 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/80 backdrop-blur-xl' : 'border-gray-200 bg-gray-50/80 backdrop-blur-xl'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Cadastro de Técnico
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {registrationError && (
            <div className="mb-6 bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm">
              {registrationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Informações Pessoais */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaUser className="text-red-400" />
                Informações Pessoais
              </h3>
              {/* Upload de Foto */}
              <div className="mb-6">
                <div className="relative">
                  <div
                    className={`w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                      dragActive
                        ? 'border-red-400 bg-red-400/10'
                        : theme === 'dark'
                        ? 'border-gray-600 bg-gray-700/30 hover:border-red-400'
                        : 'border-gray-300 bg-gray-50 hover:border-red-400'
                    }`}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isLoading}
                      className="hidden"
                      id="photo-upload"
                    />
                    
                    {formData.foto ? (
                      <div className="w-full h-full rounded-lg overflow-hidden">
                        <img
                          src={formData.foto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <FaUpload className="text-4xl mb-4" />
                          <p className="text-lg text-center px-4">
                            Clique ou arraste uma foto
                          </p>
                          <p className="text-sm text-center px-4 mt-2 opacity-70">
                            Formatos aceitos: JPG, PNG, GIF
                          </p>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  value={formData.nome}
                  onChange={handleInputChange('nome')}
                  placeholder="Nome completo"
                  disabled={isLoading}
                  error={errors.nome}
                  icon={<FaUser className="text-white/50 text-sm" />}
                  required
                />
                
                <EmailInput
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="Email profissional"
                  disabled={isLoading}
                  error={errors.email}
                  icon={<FaEnvelope className="text-white/50 text-sm" />}
                  required
                />
                
                <Input
                  value={formData.cpf}
                  onChange={handleInputChange('cpf')}
                  placeholder="CPF"
                  disabled={isLoading}
                  error={errors.cpf}
                  icon={<FaIdCard className="text-white/50 text-sm" />}
                  maxLength={14}
                  required
                />
                
                <PhoneInput
                  value={formData.telefone}
                  onChange={handleInputChange('telefone')}
                  placeholder="Telefone"
                  disabled={isLoading}
                  error={errors.telefone}
                  icon={<FaPhone className="text-white/50 text-sm" />}
                  required
                />
                
                <Input
                  value={formData.endereco}
                  onChange={handleInputChange('endereco')}
                  placeholder="Endereço (opcional)"
                  disabled={isLoading}
                  icon={<FaMapPin className="text-white/50 text-sm" />}
                />
                
                <div className="relative">
                  <FaCalendarAlt className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={handleInputChange('dataNascimento')}
                    disabled={isLoading}
                    className={dateInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Informações Profissionais */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaTools className="text-red-400" />
                Informações Profissionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FaBriefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <select
                    value={formData.especialidade}
                    onChange={handleInputChange('especialidade')}
                    disabled={isLoading}
                    className={`${selectClass} ${errors.especialidade ? 'border-red-500' : ''} ${!formData.especialidade ? (theme === 'dark' ? 'text-white/70' : 'text-gray-500') : ''}`}
                    required
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Selecione a especialidade</option>
                    {especialidades.map((especialidade) => (
                      <option key={especialidade} value={especialidade} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {especialidade}
                      </option>
                    ))}
                  </select>
                  {errors.especialidade && (
                    <p className="text-red-400 text-xs mt-1">{errors.especialidade}</p>
                  )}
                </div>
                
                <Input
                  value={formData.anosExperiencia}
                  onChange={handleInputChange('anosExperiencia')}
                  placeholder="Anos de experiência"
                  disabled={isLoading}
                  error={errors.anosExperiencia}
                  icon={<FaGraduationCap className="text-white/50 text-sm" />}
                  type="number"
                  min="0"
                  max="50"
                  required
                />
              </div>
              
              {/* Certificações */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Certificações
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 relative">
                    <FaCertificate className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                    <input
                      type="text"
                      value={newCertificacao}
                      onChange={(e) => setNewCertificacao(e.target.value)}
                      placeholder="Adicionar certificação"
                      disabled={isLoading}
                      className={selectClass}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertificacao())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCertificacao}
                    disabled={isLoading || !newCertificacao.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
                {formData.certificacoes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.certificacoes.map((cert, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertificacao(index)}
                          disabled={isLoading}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Áreas de Atuação */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Áreas de Atuação
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 relative">
                    <FaBuilding className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                    <input
                      type="text"
                      value={newAreaAtuacao}
                      onChange={(e) => setNewAreaAtuacao(e.target.value)}
                      placeholder="Adicionar área de atuação"
                      disabled={isLoading}
                      className={selectClass}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAreaAtuacao())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAreaAtuacao}
                    disabled={isLoading || !newAreaAtuacao.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
                {formData.areasAtuacao.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.areasAtuacao.map((area, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => removeAreaAtuacao(index)}
                          disabled={isLoading}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Categorias */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaTools className="text-red-400" />
                Categorias de Atendimento
              </h3>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  <span className={`ml-2 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>Carregando categorias...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.categorias.includes(category.id)
                          ? theme === 'dark'
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-red-500 bg-red-50'
                          : theme === 'dark'
                          ? 'border-white/20 bg-white/5 hover:bg-white/10'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div className="flex-1">
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {category.name}
                          </div>
                          {category.description && (
                            <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                              {category.description}
                            </div>
                          )}
                        </div>
                        {formData.categorias.includes(category.id) && (
                          <FaCheck className="text-red-500 text-sm" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {categories.length === 0 && !loadingCategories && (
                <div className={`text-center py-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                  Nenhuma categoria disponível
                </div>
              )}
            </div>

            {/* Seção: Credenciais de Acesso */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaShieldAlt className="text-red-400" />
                Credenciais de Acesso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordInput
                  value={formData.senha}
                  onChange={handleInputChange('senha')}
                  placeholder="Senha de acesso ao sistema"
                  disabled={isLoading}
                  error={errors.senha}
                  icon={<FaLock className="text-white/50 text-sm" />}
                  showPassword={showPassword}
                  onTogglePassword={() => handleTogglePasswordVisibility('senha')}
                  required
                />
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

            {/* Seção: Configurações Adicionais */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaClock className="text-red-400" />
                Configurações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FaClock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <select
                    value={formData.disponibilidade}
                    onChange={handleInputChange('disponibilidade')}
                    disabled={isLoading}
                    className={selectClass}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Disponibilidade</option>
                    {disponibilidades.map((disp) => (
                      <option key={disp.value} value={disp.value} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {disp.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <FaExclamationTriangle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <select
                    value={formData.nivelUrgencia}
                    onChange={handleInputChange('nivelUrgencia')}
                    disabled={isLoading}
                    className={selectClass}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Nível de Urgência</option>
                    {niveisUrgencia.map((nivel) => (
                      <option key={nivel.value} value={nivel.value} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={handleInputChange('observacoes')}
                  placeholder="Informações adicionais sobre o técnico..."
                  disabled={isLoading}
                  rows={3}
                  className={`w-full px-4 py-3 backdrop-blur-sm rounded-lg focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm resize-none ${
                    theme === 'dark' ? 'bg-gray-50/5 border border-white/10 text-white' : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Ações */}
            <div className={`sticky bottom-0 -mx-6 px-6 py-4 border-t ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700 backdrop-blur-xl' : 'bg-gray-50/80 border-gray-200 backdrop-blur-xl'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <PrimaryButton
                  type="submit"
                  disabled={isLoading}
                  isLoading={isLoading}
                  loadingText="Cadastrando técnico..."
                  icon={<FaCheck className="text-sm" />}
                  className="flex-1"
                >
                  Cadastrar Técnico
                </PrimaryButton>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}