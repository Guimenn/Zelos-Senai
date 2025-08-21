'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useI18n } from '../../contexts/I18nContext'
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
  FaCloudUploadAlt,
  FaImage,
  FaTrash,
} from 'react-icons/fa'
import { createClient } from '@supabase/supabase-js'
import { authCookies } from '../../utils/cookies'

type EmployeeRegisterModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (employee: any) => void
}

export default function EmployeeRegisterModal({ isOpen, onClose, onSuccess }: EmployeeRegisterModalProps) {
  const { theme } = useTheme()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
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
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    genero: '',

    cargo: '',
    departamento: '',
    matricula: '',
    dataAdmissao: '',
    nivelEducacao: '',
    formacao: '',

    senha: '',
    confirmarSenha: '',

    tipoContrato: 'clt',
    jornadaTrabalho: 'integral',
    observacoes: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isUploading, setIsUploading] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_API_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!isOpen) {
      // Reset parcial quando fechar
      setRegistrationError('')
      setAvatarFile(null)
      setAvatarUrl(undefined)
      setIsDragOver(false)
    }
  }, [isOpen])

  const cargos = [
    'Analista',
    'Assistente',
    'Auxiliar',
    'Coordenador',
    'Diretor',
    'Estagiário',
    'Gerente',
    'Operador',
    'Supervisor',
    'Técnico',
    'Outros'
  ]

  const departamentos = [
    'Administrativo',
    'Comercial',
    'Financeiro',
    'Gestão de Pessoas',
    'Informática',
    'Manutenção',
    'Marketing',
    'Operacional',
    'Produção',
    'Qualidade',
    'Recursos Humanos',
    'Segurança do Trabalho',
    'Suprimentos',
    'Vendas',
    'Outros'
  ]

  const niveisEducacao = [
    'Ensino Fundamental Incompleto',
    'Ensino Fundamental Completo',
    'Ensino Médio Incompleto',
    'Ensino Médio Completo',
    'Ensino Superior Incompleto',
    'Ensino Superior Completo',
    'Pós-graduação',
    'Mestrado',
    'Doutorado'
  ]

  const generos = [
    'Masculino',
    'Feminino',
    'Não binário',
    'Prefiro não informar'
  ]

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
    if (phone.length <= 10) {
      for (let i = 0; i < phone.length && i < 10; i++) {
        if (i === 0) formatted += '('
        else if (i === 2) formatted += ') '
        else if (i === 6) formatted += '-'
        formatted += phone[i]
      }
    } else {
      for (let i = 0; i < phone.length && i < 11; i++) {
        if (i === 0) formatted += '('
        else if (i === 2) formatted += ') '
        else if (i === 7) formatted += '-'
        formatted += phone[i]
      }
    }
    return formatted
  }

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    let remainder: number | string = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (Number(remainder) !== parseInt(cleanCPF.charAt(9))) return false
    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (Number(remainder) !== parseInt(cleanCPF.charAt(10))) return false
    return true
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = event.target.value
    if (field === 'cpf') value = formatCPF(value)
    else if (field === 'telefone') value = formatPhone(value)
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Por favor, selecione apenas arquivos de imagem' }))
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'A imagem deve ter no máximo 5MB' }))
      return
    }

    setIsUploading(true)
    setErrors(prev => ({ ...prev, avatar: '' }))

    try {
      setAvatarFile(file)
      
      // Upload para Supabase
      const fileExt = file.name.split('.').pop()
      const fileName = `user-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      
      if (error) {
        setErrors(prev => ({ ...prev, avatar: 'Erro ao fazer upload da imagem' }))
        setAvatarFile(null)
        return
      }
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setAvatarUrl(publicUrlData.publicUrl)
    } catch (error) {
      setErrors(prev => ({ ...prev, avatar: 'Erro ao processar a imagem' }))
      setAvatarFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório'
    else if (formData.nome.trim().length < 3) newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório'
    else if (!validateCPF(formData.cpf.replace(/\D/g, ''))) newErrors.cpf = 'CPF inválido'
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório'
    else if (formData.telefone.replace(/\D/g, '').length < 10) newErrors.telefone = 'Telefone inválido'
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório'
    if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória'
    if (!formData.cargo) newErrors.cargo = 'Cargo é obrigatório'
    if (!formData.departamento) newErrors.departamento = 'Departamento é obrigatório'
    if (!formData.matricula.trim()) newErrors.matricula = 'Matrícula é obrigatória'
    if (!formData.dataAdmissao) newErrors.dataAdmissao = 'Data de admissão é obrigatória'
    if (!formData.senha) newErrors.senha = 'Senha é obrigatória'
    else if (formData.senha.length < 6) newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) newErrors.senha = 'Senha deve conter letra maiúscula, minúscula e número'
    if (!formData.confirmarSenha) newErrors.confirmarSenha = 'Confirme sua senha'
    else if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = 'Senhas não coincidem'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRegistrationError('')
    setIsLoading(true)
    const isValid = validateForm()
    if (!isValid) {
      setIsLoading(false)
      return
    }
    try {
      const apiData = {
        user: {
          name: formData.nome.trim(),
          email: formData.email.trim(),
          password: formData.senha,
          phone: formData.telefone,
          avatar: avatarUrl, // Salva a URL do Supabase
        },
        matricu_id: formData.matricula.trim(),
        department: formData.departamento,
        position: formData.cargo,
        admission_date: formData.dataAdmissao,
        birth_date: formData.dataNascimento,
        address: formData.endereco.trim(),
        gender: formData.genero,
        education_level: formData.nivelEducacao,
        education_field: formData.formacao?.trim(),
        contract_type: formData.tipoContrato,
        work_schedule: formData.jornadaTrabalho,
        cpf: formData.cpf.replace(/\D/g, ''),
        notes: formData.observacoes?.trim(),
      }

      const token = authCookies.getToken()
      if (!token) throw new Error('Você precisa estar autenticado')

      const response = await fetch('/admin/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      })

      const data = await response.json()
      if (!response.ok) {
        const details = Array.isArray(data?.errors)
          ? data.errors.map((e: any) => `${e.path}: ${e.message || e.error || 'inválido'}`).join('; ')
          : ''
        const msg = data?.message || 'Erro ao cadastrar colaborador'
        throw new Error(details ? `${msg}: ${details}` : msg)
      }

      const c = data
      const item = {
        id: String(c.matricu_id || c.user?.id || c.id),
        clientId: c.id,
        name: c.user?.name || '—',
        email: c.user?.email || '—',
        phone: c.user?.phone || '—',
        department: c.department || '—',
        role: 'Profissional',
        status: c.user?.is_active ? 'Ativo' : 'Inativo',
        position: c.position || '—',
        client_type: c.client_type,
        matricu_id: c.matricu_id || '',
        cpf: c.cpf || '',
        rating: Math.min(5, Math.max(0, (c._count?.tickets || 0) / 10 + 4)),
        projectsCompleted: c._count?.tickets || 0,
        activeProjects: 0,
        location: c.address || '—',
        avatar: c.user?.avatar || null,
        performance: { leadership: 0, communication: 0, problemSolving: 0, teamwork: 0 },
        skills: [],
        education: [],
        recentActivities: [],
      }

      onSuccess(item)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Erro ao cadastrar colaborador')
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
              {t('employees.new.title')}
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
                {t('employees.new.personalInfo')}
              </h3>
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
                  placeholder="Email corporativo"
                  disabled={isLoading}
                  error={errors.email}
                  icon={<FaEnvelope className="text-white/50 text-sm" />}
                  required
                />
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTie className={leftIconClass} />
                  </div>
                  <select
                    value={formData.genero}
                    onChange={handleInputChange('genero')}
                    disabled={isLoading}
                    className={`${selectClass} ${!formData.genero ? (theme === 'dark' ? 'text-white/70' : 'text-gray-500') : ''}`}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Selecione o gênero</option>
                    {generos.map((genero) => (
                      <option key={genero} value={genero} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {genero}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className={leftIconClass} />
                  </div>
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={handleInputChange('dataNascimento')}
                    disabled={isLoading}
                    className={`${dateInputClass} ${errors.dataNascimento ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.dataNascimento && (
                    <p className="text-red-400 text-xs mt-1">{errors.dataNascimento}</p>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Input
                    value={formData.endereco}
                    onChange={handleInputChange('endereco')}
                    placeholder="Endereço completo"
                    disabled={isLoading}
                    error={errors.endereco}
                    icon={<FaMapPin className="text-white/50 text-sm" />}
                    required
                  />
                </div>
                
                {/* Área de Upload de Foto com Drag and Drop */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    Foto de Perfil
                  </label>
                  
                  {/* Área de Drag and Drop */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                      isDragOver
                        ? 'border-red-400 bg-red-50/10'
                        : theme === 'dark'
                        ? 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isLoading || isUploading}
                    />
                    
                    {avatarUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <img 
                            src={avatarUrl} 
                            alt="Avatar Preview" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-lg" 
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAvatar()
                            }}
                            className={`absolute -top-2 -right-2 p-1 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            } transition-colors`}
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                          Clique para alterar a foto
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mb-2"></div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                              Fazendo upload...
                            </p>
                          </div>
                        ) : (
                          <>
                            <FaCloudUploadAlt className={`text-4xl mb-3 ${
                              theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                            }`} />
                            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              Arraste uma foto aqui ou clique para selecionar
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                              PNG, JPG, GIF até 5MB
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {errors.avatar && (
                    <p className="text-red-400 text-xs mt-2">{errors.avatar}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção: Informações Profissionais */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaBriefcase className="text-red-400" />
                {t('employees.new.professionalInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTie className={leftIconClass} />
                  </div>
                  <select
                    value={formData.cargo}
                    onChange={handleInputChange('cargo')}
                    disabled={isLoading}
                    className={`${selectClass} ${errors.cargo ? 'border-red-500' : ''} ${!formData.cargo ? (theme === 'dark' ? 'text-white/70' : 'text-gray-500') : ''}`}
                    required
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Selecione o cargo</option>
                    {cargos.map((cargo) => (
                      <option key={cargo} value={cargo} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {cargo}
                      </option>
                    ))}
                  </select>
                  {errors.cargo && (
                    <p className="text-red-400 text-xs mt-1">{errors.cargo}</p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className={leftIconClass} />
                  </div>
                  <select
                    value={formData.departamento}
                    onChange={handleInputChange('departamento')}
                    disabled={isLoading}
                    className={`${selectClass} ${errors.departamento ? 'border-red-500' : ''} ${!formData.departamento ? (theme === 'dark' ? 'text-white/70' : 'text-gray-500') : ''}`}
                    required
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Selecione o departamento</option>
                    {departamentos.map((departamento) => (
                      <option key={departamento} value={departamento} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {departamento}
                      </option>
                    ))}
                  </select>
                  {errors.departamento && (
                    <p className="text-red-400 text-xs mt-1">{errors.departamento}</p>
                  )}
                </div>

                <Input
                  value={formData.matricula}
                  onChange={e => {
                    // Permite apenas números e até 10 dígitos
                    let value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    handleInputChange('matricula')({ ...e, target: { ...e.target, value } })
                  }}
                  placeholder="Número da matrícula"
                  disabled={isLoading}
                  error={errors.matricula}
                  icon={<FaIdBadge className="text-white/50 text-sm" />}
                  required
                  type="number"
                />

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-white/50 text-sm" />
                  </div>
                  <input
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={handleInputChange('dataAdmissao')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm ${errors.dataAdmissao ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.dataAdmissao && (
                    <p className="text-red-400 text-xs mt-1">{errors.dataAdmissao}</p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className={leftIconClass} />
                  </div>
                  <select
                    value={formData.nivelEducacao}
                    onChange={handleInputChange('nivelEducacao')}
                    disabled={isLoading}
                    className={`${selectClass} ${!formData.nivelEducacao ? (theme === 'dark' ? 'text-white/70' : 'text-gray-500') : ''}`}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>Nível de educação</option>
                    {niveisEducacao.map((nivel) => (
                      <option key={nivel} value={nivel} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {nivel}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  value={formData.formacao}
                  onChange={handleInputChange('formacao')}
                  placeholder="Curso/Formação (opcional)"
                  disabled={isLoading}
                  icon={<FaGraduationCap className="text-white/50 text-sm" />}
                />
              </div>
            </div>

            {/* Seção: Credenciais de Acesso */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaShieldAlt className="text-red-400" />
                {t('employees.new.accessCredentials')}
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

            {/* Ações */}
            <div className={`sticky bottom-0 -mx-6 px-6 py-4 border-t ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700 backdrop-blur-xl' : 'bg-gray-50/80 border-gray-200 backdrop-blur-xl'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <PrimaryButton
                  type="submit"
                  disabled={isLoading || isUploading}
                  isLoading={isLoading}
                  loadingText="Cadastrando colaborador..."
                  icon={<FaCheck className="text-sm" />}
                  className="flex-1"
                >
                  {t('employees.new.save')}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  {t('employees.new.cancel')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

