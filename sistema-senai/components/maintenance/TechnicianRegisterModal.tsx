'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useI18n } from '../../contexts/I18nContext'
import { PrimaryButton } from '../ui/button'
import Input, { PasswordInput, EmailInput, PhoneInput } from '../ui/input'
import { authCookies } from '../../utils/cookies'
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
import { useSupabase } from '../../hooks/useSupabase'

type TechnicianRegisterModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (technician: any) => void
}

export default function TechnicianRegisterModal({ isOpen, onClose, onSuccess }: TechnicianRegisterModalProps) {
  const { theme } = useTheme()
  const { t } = useI18n()
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
    subcategoria_id: null as number | null,
    anosExperiencia: '',
    categorias: [] as number[],
    certificacoes: [] as string[],
    areasAtuacao: [] as string[],
    
    // Informações de Acesso
    senha: '',
    confirmarSenha: '',
    
    // Informações Adicionais
    disponibilidade: '',
    nivelUrgencia: '',
    observacoes: ''
  })
  const [dragActive, setDragActive] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const supabase = useSupabase()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [newCertificacao, setNewCertificacao] = useState('')
  const [newAreaAtuacao, setNewAreaAtuacao] = useState('')
  const [categories, setCategories] = useState<Array<{id: number, name: string, description: string, color: string, icon: string}>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [subcategories, setSubcategories] = useState<Array<{id: number, name: string, description: string, category_id: number}>>([])
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [selectedCategoryForSpecialty, setSelectedCategoryForSpecialty] = useState<number | null>(null)



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
      const token = authCookies.getToken()
      
      if (token) {
        // Tentar buscar do backend se tiver token
        const response = await fetch('/helpdesk/categories', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setCategories(data || [])
          return
        }
      }
      
      // Fallback: usar categorias de teste se não conseguir buscar do backend
      const testCategories = [
        { id: 1, name: 'Suporte Técnico', description: 'Suporte técnico geral', color: '#ef4444', icon: 'wrench' },
        { id: 2, name: 'Infraestrutura', description: 'Problemas de infraestrutura', color: '#10b981', icon: 'server' },
        { id: 3, name: 'Sistema', description: 'Problemas de sistema', color: '#3b82f6', icon: 'desktop' },
        { id: 4, name: 'Dúvidas', description: 'Dúvidas gerais', color: '#f59e0b', icon: 'question' }
      ]
      setCategories(testCategories)
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      
      // Em caso de erro, usar categorias de teste
      const testCategories = [
        { id: 1, name: 'Suporte Técnico', description: 'Suporte técnico geral', color: '#ef4444', icon: 'wrench' },
        { id: 2, name: 'Infraestrutura', description: 'Problemas de infraestrutura', color: '#10b981', icon: 'server' },
        { id: 3, name: 'Sistema', description: 'Problemas de sistema', color: '#3b82f6', icon: 'desktop' },
        { id: 4, name: 'Dúvidas', description: 'Dúvidas gerais', color: '#f59e0b', icon: 'question' }
      ]
      setCategories(testCategories)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Função para buscar subcategorias por categoria
  const fetchSubcategories = async (categoryId: number) => {
    setLoadingSubcategories(true)
    try {
      const token = authCookies.getToken()
      
      if (token) {
        // Tentar buscar do backend se tiver token
        const response = await fetch(`/helpdesk/categories/${categoryId}/subcategories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setSubcategories(data || [])
          return
        }
      }
      
      // Fallback: usar subcategorias de teste
      const testSubcategories = [
        { id: 1, name: 'Hardware', description: 'Problemas de hardware', category_id: categoryId },
        { id: 2, name: 'Software', description: 'Problemas de software', category_id: categoryId },
        { id: 3, name: 'Rede', description: 'Problemas de rede', category_id: categoryId },
        { id: 4, name: 'Login', description: 'Problemas de login', category_id: categoryId }
      ]
      setSubcategories(testSubcategories)
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error)
      
      // Em caso de erro, usar subcategorias de teste
      const testSubcategories = [
        { id: 1, name: 'Hardware', description: 'Problemas de hardware', category_id: categoryId },
        { id: 2, name: 'Software', description: 'Problemas de software', category_id: categoryId },
        { id: 3, name: 'Rede', description: 'Problemas de rede', category_id: categoryId },
        { id: 4, name: 'Login', description: 'Problemas de login', category_id: categoryId }
      ]
      setSubcategories(testSubcategories)
    } finally {
      setLoadingSubcategories(false)
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
        subcategoria_id: null,
        anosExperiencia: '',
        categorias: [],
        certificacoes: [],
        areasAtuacao: [],
        senha: '',
        confirmarSenha: '',
        disponibilidade: 'integral',
        nivelUrgencia: 'medio',
        observacoes: ''
      })
      setSubcategories([])
      setSelectedCategoryForSpecialty(null)
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
    let value: any = e.target.value
    
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'telefone') {
      value = formatPhone(value)
    } else if (field === 'subcategoria_id') {
      value = value ? Number(value) : null
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addCertificacao = () => {
    if (newCertificacao.trim() && !(formData.certificacoes || []).includes(newCertificacao.trim())) {
      setFormData(prev => ({
        ...prev,
        certificacoes: [...(prev.certificacoes || []), newCertificacao.trim()]
      }))
      setNewCertificacao('')
    }
  }

  const removeCertificacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificacoes: (prev.certificacoes || []).filter((_, i) => i !== index)
    }))
  }

  const addAreaAtuacao = () => {
    if (newAreaAtuacao.trim() && !(formData.areasAtuacao || []).includes(newAreaAtuacao.trim())) {
      setFormData(prev => ({
        ...prev,
        areasAtuacao: [...(prev.areasAtuacao || []), newAreaAtuacao.trim()]
      }))
      setNewAreaAtuacao('')
    }
  }

  const removeAreaAtuacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areasAtuacao: (prev.areasAtuacao || []).filter((_, i) => i !== index)
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

  const handleSpecialtyCategoryChange = (categoryId: number) => {
    setSelectedCategoryForSpecialty(categoryId)
    setFormData(prev => ({ ...prev, subcategoria_id: null }))
    if (categoryId) {
      fetchSubcategories(categoryId)
    } else {
      setSubcategories([])
    }
  }

  // Função para validar CPF
  const isValidCPF = (cpf: string) => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    if (digit1 > 9) digit1 = 0
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    if (digit2 > 9) digit2 = 0
    
    return digit1 === parseInt(cpf[9]) && digit2 === parseInt(cpf[10])
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Validações básicas
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    } else if (!isValidCPF(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos'
    }

    if (!formData.subcategoria_id) {
      newErrors.subcategoria_id = 'Especialidade é obrigatória'
    }

    if (!formData.anosExperiencia.trim()) {
      newErrors.anosExperiencia = 'Anos de experiência é obrigatório'
    } else {
      const anosExp = parseInt(formData.anosExperiencia)
      if (isNaN(anosExp) || anosExp < 0 || anosExp > 50) {
        newErrors.anosExperiencia = 'Anos de experiência deve ser um número entre 0 e 50'
      }
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    }

    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória'
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem'
    }

    if (!formData.disponibilidade) {
      newErrors.disponibilidade = 'Disponibilidade é obrigatória'
    }

    if (!formData.nivelUrgencia) {
      newErrors.nivelUrgencia = 'Nível de urgência é obrigatório'
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
        ;(async () => {
          const url = await uploadToSupabase(file)
          if (url) {
            setAvatarUrl(url)
            setFormData(prev => ({ ...prev, foto: url }))
          }
        })()
      }
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      ;(async () => {
        const url = await uploadToSupabase(file)
        if (url) {
          setAvatarUrl(url)
          setFormData(prev => ({ ...prev, foto: url }))
        }
      })()
    }
  }

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      if (!supabase) {
        console.error('Supabase não configurado')
        return null
      }
      
      const ext = file.name.split('.').pop()
      const path = `tech-${Date.now()}.${ext}`
      const { data, error } = await supabase!.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) {
        console.error('Erro no upload da imagem:', error.message)
        return null
      }
      const { data: publicUrl } = supabase!.storage.from('avatars').getPublicUrl(data.path)
      return publicUrl.publicUrl
    } catch (err) {
      console.error('Falha no upload da imagem:', err)
      return null
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
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      // Buscar o nome da subcategoria selecionada
      const selectedSubcategory = subcategories.find(sub => sub.id === formData.subcategoria_id)
      const specialtyName = selectedSubcategory?.name || 'Técnico'
      
      // Automaticamente incluir a categoria da subcategoria selecionada
      const categoryId = selectedSubcategory?.category_id
      const categories = categoryId ? [categoryId] : []

      const technicianData = {
        user: {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone.replace(/\D/g, ''),
          password: formData.senha,
          avatar: avatarUrl || formData.foto || null,
          address: formData.endereco || null
        },
        employee_id: formData.cpf.replace(/\D/g, ''),
        department: specialtyName,
        skills: [
          specialtyName,
          `EXP:${formData.anosExperiencia}`,
          `AVAIL:${formData.disponibilidade}`,
          `URGENCY:${formData.nivelUrgencia}`,
          ...(formData.certificacoes || []).map(cert => `CERT:${cert}`),
          ...(formData.areasAtuacao || [])
        ].filter(Boolean),
        max_tickets: 10,
        categories: categories
      }

      console.log('Dados sendo enviados:', JSON.stringify(technicianData, null, 2))

      const response = await fetch('/admin/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(technicianData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro detalhado do servidor:', errorData)
        
        // Mapear erros específicos para mensagens mais amigáveis
        let errorMessage = 'Erro ao cadastrar técnico'
        
        if (response.status === 400) {
          if (errorData.message?.includes('CPF já está em uso')) {
            errorMessage = 'Este CPF já está cadastrado no sistema. Verifique se o técnico já existe.'
          } else if (errorData.message?.includes('Email já está em uso')) {
            errorMessage = 'Este email já está cadastrado no sistema. Use um email diferente.'
          } else if (errorData.message?.includes('Dados inválidos')) {
            errorMessage = 'Dados inválidos. Verifique se todos os campos obrigatórios foram preenchidos corretamente.'
          } else if (errorData.message?.includes('Categoria não encontrada')) {
            errorMessage = 'A categoria selecionada não foi encontrada. Tente selecionar outra categoria.'
          } else {
            errorMessage = errorData.message || 'Dados inválidos. Verifique os campos preenchidos.'
          }
        } else if (response.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.'
        } else if (response.status === 403) {
          errorMessage = 'Você não tem permissão para cadastrar técnicos.'
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.'
        } else {
          errorMessage = errorData.message || 'Erro inesperado. Tente novamente.'
        }
        
        throw new Error(errorMessage)
      }

      const newTechnician = await response.json()

      // Garante persistência do avatar no perfil do usuário (caso a API de criação ignore o campo)
      try {
        if ((avatarUrl || formData.foto) && (newTechnician?.user?.id || newTechnician?.user_id || newTechnician?.user?.user_id)) {
          const targetUserId = newTechnician?.user?.id || newTechnician?.user_id || newTechnician?.user?.user_id
          await fetch(`/user/${encodeURIComponent(targetUserId)}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ avatar: avatarUrl || formData.foto })
          })
        }
      } catch (e) {
        console.warn('Não foi possível atualizar avatar do usuário imediatamente:', e)
      }

      // Injeta avatar no objeto retornado para refletir imediatamente na UI
      if (avatarUrl || formData.foto) {
        newTechnician.user = newTechnician.user || {}
        newTechnician.user.avatar = avatarUrl || formData.foto
      }
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
              {t('technicians.new.title')}
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
                {t('technicians.new.personalInfo')}
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
                          src={avatarUrl || formData.foto}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                 <Input
                  value={formData.anosExperiencia}
                  onChange={handleInputChange('anosExperiencia')}
                  placeholder="Anos de experiência"
                  disabled={isLoading}
                  error={errors.anosExperiencia}
                  icon={<FaGraduationCap className="text-white/50 text-sm" />}
                  type="number"
                  required
                />
                
                <div className="md:col-span-2 lg:col-span-2">
                  <PhoneInput
                    value={formData.telefone}
                    onChange={handleInputChange('telefone')}
                    placeholder="Telefone"
                    disabled={isLoading}
                    error={errors.telefone}
                    icon={<FaPhone className="text-white/50 text-sm" />}
                    required
                  />
                </div>
                
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
                <FaUserTie className="text-red-400" />
                {t('technicians.new.professionalInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seleção de Categoria para Especialidade */}
                <div className="relative">
                  <FaTools className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <select
                    value={selectedCategoryForSpecialty || ''}
                    onChange={(e) => handleSpecialtyCategoryChange(Number(e.target.value))}
                    disabled={isLoading || loadingCategories}
                    className={selectClass}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>
                      Selecione uma categoria
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção de Especialidade (Subcategoria) */}
                <div className="relative">
                  <FaGraduationCap className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${leftIconClass}`} />
                  <select
                    value={formData.subcategoria_id || ''}
                    onChange={handleInputChange('subcategoria_id')}
                    disabled={isLoading || loadingSubcategories || !selectedCategoryForSpecialty}
                    className={selectClass}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-white text-gray-500'}>
                      {loadingSubcategories ? 'Carregando especialidades...' : 'Selecione uma especialidade'}
                    </option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id} className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {errors.subcategoria_id && (
                    <p className="text-red-400 text-xs mt-1">{errors.subcategoria_id}</p>
                  )}
                </div>
                
              </div>
            </div>
            {/* Seção: Credenciais de Acesso */}
            <div className={`rounded-xl p-6 border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <FaShieldAlt className="text-red-400" />
                {t('technicians.new.accessCredentials')}
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
                {t('technicians.new.additionalSettings')}
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
                  {errors.disponibilidade && (
                    <p className="text-red-400 text-xs mt-1">{errors.disponibilidade}</p>
                  )}
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
                  {errors.nivelUrgencia && (
                    <p className="text-red-400 text-xs mt-1">{errors.nivelUrgencia}</p>
                  )}
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
                  {t('technicians.new.save')}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  {t('technicians.new.cancel')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}