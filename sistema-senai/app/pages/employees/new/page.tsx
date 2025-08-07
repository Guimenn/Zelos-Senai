'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
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
  FaTrash,
  FaBuilding,
  FaUsers,
  FaUserGraduate,
  FaIdBadge,
  FaClock,
  FaMapPin
} from 'react-icons/fa'
import Logo from '../../../../components/logo'  
import Link from 'next/link'
import { PrimaryButton } from '../../../../components/ui/button'
import Input, { PasswordInput, EmailInput, PhoneInput } from '../../../../components/ui/input'
import VantaBackground from '../../../../components/VantaBackground'

interface DecodedToken {
  userId: number
  userRole: string
  name: string
  email: string
  iat: number
  exp: number
}

export default function EmployeeRegister() {
  const { theme } = useTheme()
  const router = useRouter()
  const [formData, setFormData] = useState({
    // Informações Pessoais
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    genero: '',
    
    // Informações Profissionais
    cargo: '',
    departamento: '',
    matricula: '',
    dataAdmissao: '',
    nivelEducacao: '',
    formacao: '',
    
    // Informações de Acesso
    senha: '',
    confirmarSenha: '',
    
    // Informações Adicionais
    tipoContrato: 'clt',
    jornadaTrabalho: 'integral',
    observacoes: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/pages/auth/login')
      return
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token)
      // Verificar se o usuário tem permissão de administrador
      const userRole = decodedToken.userRole || (decodedToken as any).role
      
      if (userRole !== 'Admin') {
        // Redirecionar para a página inicial se não for administrador
        router.push('/pages/home')
      }
    } catch (error) {
      console.error('Failed to decode token:', error)
      router.push('/pages/auth/login')
    }
  }, [router])

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

  const tiposContrato = [
    { value: 'clt', label: 'CLT', description: 'Consolidação das Leis do Trabalho' },
    { value: 'pj', label: 'PJ', description: 'Pessoa Jurídica' },
    { value: 'estagiario', label: 'Estagiário', description: 'Contrato de estágio' },
    { value: 'temporario', label: 'Temporário', description: 'Contrato temporário' }
  ]

  const jornadasTrabalho = [
    { value: 'integral', label: 'Tempo Integral', description: '8 horas por dia' },
    { value: 'parcial', label: 'Tempo Parcial', description: '4-6 horas por dia' },
    { value: 'flexivel', label: 'Flexível', description: 'Horário flexível' },
    { value: 'noturno', label: 'Noturno', description: 'Trabalho noturno' }
  ]

  const generos = [
    'Masculino',
    'Feminino',
    'Não binário',
    'Prefiro não informar'
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    // Validação do nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres'
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validação do CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido'
    }

    // Validação do telefone
    if (!formData.telefone.trim()) {
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
      if (idade < 16) {
        newErrors.dataNascimento = 'Colaborador deve ter pelo menos 16 anos'
      }
    }

    // Validação do cargo
    if (!formData.cargo) {
      newErrors.cargo = 'Cargo é obrigatório'
    }

    // Validação do departamento
    if (!formData.departamento) {
      newErrors.departamento = 'Departamento é obrigatório'
    }

    // Validação da matrícula
    if (!formData.matricula.trim()) {
      newErrors.matricula = 'Matrícula é obrigatória'
    }

    // Validação da data de admissão
    if (!formData.dataAdmissao) {
      newErrors.dataAdmissao = 'Data de admissão é obrigatória'
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRegistrationError('')
    setIsLoading(true)

    console.log('Formulário submetido')
    const isValid = validateForm()
    console.log('Validação:', isValid, 'Erros:', errors)

    if (isValid) {
      try {
        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!formData.nome || !formData.email || !formData.senha || !formData.telefone || 
            !formData.matricula || !formData.departamento || !formData.cpf) {
          throw new Error('Todos os campos obrigatórios devem ser preenchidos');
        }

        // Validar formato do email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          throw new Error('Formato de email inválido');
        }

        // Validar CPF
        if (!validateCPF(formData.cpf.replace(/\D/g, ''))) {
          throw new Error('CPF inválido');
        }

        // Validar telefone
        if (formData.telefone.replace(/\D/g, '').length < 10) {
          throw new Error('Telefone inválido');
        }

        // Preparar dados para a API no formato esperado pelo backend
        const apiData = {
          user: {
            name: formData.nome.trim(),
            email: formData.email.trim(),
            password: formData.senha,
            phone: formData.telefone,
            avatar: null // Pode ser implementado upload de avatar posteriormente
          },
          matricu_id: formData.matricula.trim(),
          department: formData.departamento,
          position: formData.cargo,
          admission_date: formData.dataAdmissao,
          birth_date: formData.dataNascimento,
          address: formData.endereco.trim(),
          gender: formData.genero,
          education_level: formData.nivelEducacao,
          education_field: formData.areaFormacao?.trim(),
          contract_type: formData.tipoContrato,
          work_schedule: formData.jornadaTrabalho,
          cpf: formData.cpf.replace(/\D/g, ''),
          notes: formData.observacoes?.trim()
        }

        console.log('Enviando dados para API:', apiData)
        
        // Obter o token de autenticação
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Você precisa estar autenticado para cadastrar um colaborador')
        }

        // Fazer requisição para a API
        const response = await fetch('http://localhost:3001/admin/client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.message || 'Erro ao cadastrar colaborador')
        }
        
        console.log('Resposta da API:', data)
        setRegistrationSuccess(true)
      } catch (error) {
        console.error('Erro ao cadastrar:', error)
        setRegistrationError(error instanceof Error ? error.message : 'Erro ao cadastrar colaborador')
      } finally {
        setIsLoading(false)
      }
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
              O colaborador foi cadastrado com sucesso no sistema.
            </p>
            <Link href="/pages/employees">
              <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                <FaArrowRight className="text-sm" />
                Ver Colaboradores
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
      <div className="max-w-5xl w-full relative z-10">
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
              Cadastro de Colaborador
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>
              Sistema de Gestão SENAI - Recursos Humanos
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  placeholder="Email corporativo"
                  disabled={isLoading}
                  error={errors.email}
                  icon={<FaEnvelope className="text-white/50 text-sm" />}
                  required
                />

                {/* CPF */}
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

                {/* Telefone */}
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

                {/* Gênero */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTie className="text-white/50 text-sm" />
                  </div>
                  <select
                    value={formData.genero}
                    onChange={handleInputChange('genero')}
                    disabled={isLoading}
                    className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none"
                  >
                    <option value="">Selecione o gênero</option>
                    {generos.map((genero) => (
                      <option key={genero} value={genero} className="bg-gray-800 text-white">
                        {genero}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>
            </div>

            {/* Seção 2: Informações Profissionais */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <FaBriefcase className="text-red-400" />
                Informações Profissionais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Cargo */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTie className="text-white/50 text-sm" />
                  </div>
                  <select
                    value={formData.cargo}
                    onChange={handleInputChange('cargo')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none ${
                      errors.cargo ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">Selecione o cargo</option>
                    {cargos.map((cargo) => (
                      <option key={cargo} value={cargo} className="bg-gray-800 text-white">
                        {cargo}
                      </option>
                    ))}
                  </select>
                  {errors.cargo && (
                    <p className="text-red-400 text-xs mt-1">{errors.cargo}</p>
                  )}
                </div>

                {/* Departamento */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-white/50 text-sm" />
                  </div>
                  <select
                    value={formData.departamento}
                    onChange={handleInputChange('departamento')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none ${
                      errors.departamento ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">Selecione o departamento</option>
                    {departamentos.map((departamento) => (
                      <option key={departamento} value={departamento} className="bg-gray-800 text-white">
                        {departamento}
                      </option>
                    ))}
                  </select>
                  {errors.departamento && (
                    <p className="text-red-400 text-xs mt-1">{errors.departamento}</p>
                  )}
                </div>

                {/* Matrícula */}
                <Input
                  value={formData.matricula}
                  onChange={handleInputChange('matricula')}
                  placeholder="Número da matrícula"
                  disabled={isLoading}
                  error={errors.matricula}
                  icon={<FaIdBadge className="text-white/50 text-sm" />}
                  required
                />

                {/* Data de Admissão */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-white/50 text-sm" />
                  </div>
                  <input
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={handleInputChange('dataAdmissao')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm ${
                      errors.dataAdmissao ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.dataAdmissao && (
                    <p className="text-red-400 text-xs mt-1">{errors.dataAdmissao}</p>
                  )}
                </div>

                {/* Nível de Educação */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="text-white/50 text-sm" />
                  </div>
                  <select
                    value={formData.nivelEducacao}
                    onChange={handleInputChange('nivelEducacao')}
                    disabled={isLoading}
                    className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none"
                  >
                    <option value="">Nível de educação</option>
                    {niveisEducacao.map((nivel) => (
                      <option key={nivel} value={nivel} className="bg-gray-800 text-white">
                        {nivel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Formação */}
                <Input
                  value={formData.formacao}
                  onChange={handleInputChange('formacao')}
                  placeholder="Curso/Formação (opcional)"
                  disabled={isLoading}
                  icon={<FaUserGraduate className="text-white/50 text-sm" />}
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
                  placeholder="Senha de acesso ao sistema"
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

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <PrimaryButton
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Cadastrando colaborador..."
                icon={<FaCheck className="text-sm" />}
                className="flex-1"
              >
                Cadastrar Colaborador
              </PrimaryButton>

              <Link href="/pages/employees" className="flex-1">
                <button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FaArrowLeft className="text-sm" />
                  Voltar
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
