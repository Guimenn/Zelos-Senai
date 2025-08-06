'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import ResponsiveLayout from '../../../../components/responsive-layout'
import {
  FaPlus,
  FaTools,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaBuilding,
  FaWrench,
  FaCog,
  FaLightbulb,
  FaThermometerHalf,
  FaDesktop,
  FaNetworkWired,
  FaShieldAlt,
  FaFileUpload,
  FaTimes,
  FaArrowLeft,
  FaSave,
  FaPaperPlane,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaInfoCircle,
  FaStar,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'

interface Category {
  id: number
  name: string
  description?: string
  icon?: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: number
  name: string
  description?: string
  category_id: number
}

interface FormData {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  category_id: number
  subcategory_id?: number
  location: string
  contact_phone: string
  contact_email: string
  estimated_duration: string
  deadline: string
  urgency_level: 'Normal' | 'Urgente' | 'Muito Urgente'
  impact_level: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  affected_users: string
  business_impact: string
  attachments: File[]
  additional_info: string
  preferred_schedule: string
  access_restrictions: string
  special_requirements: string
}

interface FormErrors {
  title?: string
  description?: string
  category_id?: string
  location?: string
  contact_phone?: string
  contact_email?: string
  deadline?: string
  urgency_level?: string
  impact_level?: string
  affected_users?: string
  business_impact?: string
}

export default function NovoChamadoPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'Medium',
    category_id: 0,
    subcategory_id: undefined,
    location: '',
    contact_phone: '',
    contact_email: '',
    estimated_duration: '',
    deadline: '',
    urgency_level: 'Normal',
    impact_level: 'Médio',
    affected_users: '',
    business_impact: '',
    attachments: [],
    additional_info: '',
    preferred_schedule: '',
    access_restrictions: '',
    special_requirements: ''
  })

  // Categorias de exemplo (serão carregadas da API)
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Equipamentos',
      description: 'Problemas com equipamentos industriais e laboratoriais',
      icon: 'FaTools',
      subcategories: [
        { id: 1, name: 'Equipamentos de Solda', category_id: 1 },
        { id: 2, name: 'Máquinas CNC', category_id: 1 },
        { id: 3, name: 'Equipamentos de Medição', category_id: 1 },
        { id: 4, name: 'Ferramentas Elétricas', category_id: 1 }
      ]
    },
    {
      id: 2,
      name: 'Climatização',
      description: 'Sistemas de ar condicionado e ventilação',
      icon: 'FaThermometerHalf',
      subcategories: [
        { id: 5, name: 'Ar Condicionado', category_id: 2 },
        { id: 6, name: 'Ventilação', category_id: 2 },
        { id: 7, name: 'Aquecimento', category_id: 2 }
      ]
    },
    {
      id: 3,
      name: 'Iluminação',
      description: 'Sistemas de iluminação e lâmpadas',
      icon: 'FaLightbulb',
      subcategories: [
        { id: 8, name: 'Lâmpadas LED', category_id: 3 },
        { id: 9, name: 'Sistema de Iluminação de Emergência', category_id: 3 },
        { id: 10, name: 'Dimmer e Controles', category_id: 3 }
      ]
    },
    {
      id: 4,
      name: 'Informática',
      description: 'Computadores, redes e sistemas',
      icon: 'FaDesktop',
      subcategories: [
        { id: 11, name: 'Computadores', category_id: 4 },
        { id: 12, name: 'Rede e Internet', category_id: 4 },
        { id: 13, name: 'Impressoras', category_id: 4 },
        { id: 14, name: 'Software', category_id: 4 }
      ]
    },
    {
      id: 5,
      name: 'Infraestrutura',
      description: 'Estrutura física e instalações',
      icon: 'FaBuilding',
      subcategories: [
        { id: 15, name: 'Elétrica', category_id: 5 },
        { id: 16, name: 'Hidráulica', category_id: 5 },
        { id: 17, name: 'Alvenaria', category_id: 5 },
        { id: 18, name: 'Pintura', category_id: 5 }
      ]
    },
    {
      id: 6,
      name: 'Segurança',
      description: 'Sistemas de segurança e controle de acesso',
      icon: 'FaShieldAlt',
      subcategories: [
        { id: 19, name: 'Câmeras de Segurança', category_id: 6 },
        { id: 20, name: 'Controle de Acesso', category_id: 6 },
        { id: 21, name: 'Alarmes', category_id: 6 }
      ]
    }
  ]

  useEffect(() => {
    // Simular carregamento das categorias da API
    setCategories(mockCategories)
  }, [])

  const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      FaTools: <FaTools className="w-6 h-6" />,
      FaThermometerHalf: <FaThermometerHalf className="w-6 h-6" />,
      FaLightbulb: <FaLightbulb className="w-6 h-6" />,
      FaDesktop: <FaDesktop className="w-6 h-6" />,
      FaBuilding: <FaBuilding className="w-6 h-6" />,
      FaShieldAlt: <FaShieldAlt className="w-6 h-6" />
    }
    return iconMap[iconName] || <FaCog className="w-6 h-6" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500 text-white'
      case 'High':
        return 'bg-orange-500 text-white'
      case 'Medium':
        return 'bg-yellow-500 text-gray-900'
      case 'Low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <FaExclamationTriangle className="w-4 h-4" />
      case 'High':
        return <FaExclamationTriangle className="w-4 h-4" />
      case 'Medium':
        return <FaClock className="w-4 h-4" />
      case 'Low':
        return <FaCheckCircle className="w-4 h-4" />
      default:
        return <FaInfoCircle className="w-4 h-4" />
    }
  }

  const validateStep = (currentStep: number) => {
    const newErrors: FormErrors = {}

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
      if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória'
      if (formData.description.length < 10) newErrors.description = 'Descrição deve ter pelo menos 10 caracteres'
      if (!formData.category_id) newErrors.category_id = 'Categoria é obrigatória'
    }

    if (currentStep === 2) {
      if (!formData.location.trim()) newErrors.location = 'Localização é obrigatória'
      if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Telefone é obrigatório'
      if (!formData.contact_email.trim()) newErrors.contact_email = 'Email é obrigatório'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Email inválido'
      }
    }

    if (currentStep === 3) {
      if (!formData.deadline.trim()) newErrors.deadline = 'Prazo é obrigatório'
      if (!formData.affected_users.trim()) newErrors.affected_users = 'Usuários afetados é obrigatório'
      if (!formData.business_impact.trim()) newErrors.business_impact = 'Impacto no negócio é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setIsLoading(true)
    
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirecionar para página de sucesso ou lista de chamados
      router.push('/pages/called')
    } catch (error) {
      console.error('Erro ao criar chamado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      category_id: category.id,
      subcategory_id: undefined
    }))
    setErrors(prev => ({ ...prev, category_id: undefined }))
  }

  const handleSubcategorySelect = (subcategoryId: number) => {
    setFormData(prev => ({
      ...prev,
      subcategory_id: subcategoryId
    }))
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={5}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } shadow-lg`}
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Novo Chamado de Manutenção
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Solicite uma manutenção de forma rápida e eficiente
              </p>
            </div>
          </div>

                     {/* Progress Steps */}
           <div className="flex items-center justify-center mb-8">
             <div className="flex items-center space-x-4">
               {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
                    ${step >= stepNumber 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {stepNumber}
                  </div>
                                     {stepNumber < 5 && (
                    <div className={`
                      w-16 h-1 mx-2 transition-all duration-300
                      ${step > stepNumber 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : theme === 'dark' 
                          ? 'bg-gray-700' 
                          : 'bg-gray-200'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className={`rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-8`}>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Informações Básicas
                </h2>
              </div>

              {/* Título */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título do Chamado *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.title 
                      ? 'border-red-500' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Ex: Manutenção do equipamento de solda no Laboratório 3"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descrição Detalhada *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.description 
                      ? 'border-red-500' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Descreva detalhadamente o problema, sintomas observados e quando começou..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Prioridade */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prioridade
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center space-x-2
                        ${formData.priority === priority 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : theme === 'dark' 
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      {getPriorityIcon(priority)}
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {priority === 'Low' ? 'Baixa' : 
                         priority === 'Medium' ? 'Média' : 
                         priority === 'High' ? 'Alta' : 'Crítica'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Categoria *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left
                        ${formData.category_id === category.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : theme === 'dark' 
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'}`}>
                          {getCategoryIcon(category.icon || 'FaCog')}
                        </div>
                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {category.name}
                        </span>
                      </div>
                      {category.description && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                )}
              </div>

              {/* Subcategoria */}
              {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subcategoria (Opcional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedCategory.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => handleSubcategorySelect(subcategory.id)}
                        className={`
                          p-3 rounded-lg border transition-all duration-300 hover:scale-105
                          ${formData.subcategory_id === subcategory.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : theme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }
                        `}
                      >
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {subcategory.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

                     {step === 2 && (
             <div className="space-y-6">
               <div>
                 <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Informações de Contato e Localização
                 </h2>
               </div>

               {/* Localização */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Localização do Problema *
                 </label>
                 <div className="relative">
                   <FaMapMarkerAlt className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                   <input
                     type="text"
                     value={formData.location}
                     onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                       errors.location 
                         ? 'border-red-500' 
                         : theme === 'dark' 
                           ? 'bg-gray-700 border-gray-600 text-white' 
                           : 'bg-white border-gray-300 text-gray-900'
                     }`}
                     placeholder="Ex: Laboratório 3, Setor A, Sala 205"
                   />
                 </div>
                 {errors.location && (
                   <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                 )}
               </div>

               {/* Telefone */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Telefone para Contato *
                 </label>
                 <div className="relative">
                   <FaPhone className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                   <input
                     type="tel"
                     value={formData.contact_phone}
                     onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                       errors.contact_phone 
                         ? 'border-red-500' 
                         : theme === 'dark' 
                           ? 'bg-gray-700 border-gray-600 text-white' 
                           : 'bg-white border-gray-300 text-gray-900'
                     }`}
                     placeholder="(11) 99999-9999"
                   />
                 </div>
                 {errors.contact_phone && (
                   <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                 )}
               </div>

               {/* Email */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Email para Contato *
                 </label>
                 <div className="relative">
                   <FaEnvelope className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                   <input
                     type="email"
                     value={formData.contact_email}
                     onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                       errors.contact_email 
                         ? 'border-red-500' 
                         : theme === 'dark' 
                           ? 'bg-gray-700 border-gray-600 text-white' 
                           : 'bg-white border-gray-300 text-gray-900'
                     }`}
                     placeholder="seu@email.com"
                   />
                 </div>
                 {errors.contact_email && (
                   <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                 )}
               </div>

               {/* Duração Estimada */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Duração Estimada da Manutenção
                 </label>
                 <select
                   value={formData.estimated_duration}
                   onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                 >
                   <option value="">Selecione uma opção</option>
                   <option value="1h">1 hora</option>
                   <option value="2h">2 horas</option>
                   <option value="4h">4 horas</option>
                   <option value="8h">8 horas (1 dia)</option>
                   <option value="16h">16 horas (2 dias)</option>
                   <option value="24h">24 horas (3 dias)</option>
                   <option value="48h">48 horas (1 semana)</option>
                 </select>
               </div>

               {/* Informações Adicionais */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Informações Adicionais
                 </label>
                 <textarea
                   value={formData.additional_info}
                   onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                   rows={3}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                   placeholder="Horários preferenciais, restrições de acesso, equipamentos específicos necessários..."
                 />
               </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-6">
               <div>
                 <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Prazo e Impacto
                 </h2>
               </div>

               {/* Prazo */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Prazo para Resolução *
                 </label>
                 <select
                   value={formData.deadline}
                   onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     errors.deadline 
                       ? 'border-red-500' 
                       : theme === 'dark' 
                         ? 'bg-gray-700 border-gray-600 text-white' 
                         : 'bg-white border-gray-300 text-gray-900'
                   }`}
                 >
                   <option value="">Selecione o prazo</option>
                   <option value="immediate">Imediato (Hoje)</option>
                   <option value="24h">24 horas</option>
                   <option value="48h">48 horas</option>
                   <option value="72h">72 horas</option>
                   <option value="1week">1 semana</option>
                   <option value="2weeks">2 semanas</option>
                   <option value="1month">1 mês</option>
                   <option value="flexible">Flexível</option>
                 </select>
                 {errors.deadline && (
                   <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
                 )}
               </div>

               {/* Nível de Urgência */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Nível de Urgência
                 </label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   {(['Normal', 'Urgente', 'Muito Urgente'] as const).map((urgency) => (
                     <button
                       key={urgency}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, urgency_level: urgency }))}
                       className={`
                         p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center space-x-2
                         ${formData.urgency_level === urgency 
                           ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                           : theme === 'dark' 
                             ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                             : 'border-gray-300 bg-white hover:border-gray-400'
                         }
                       `}
                     >
                       {urgency === 'Normal' && <FaCheckCircle className="w-4 h-4 text-green-500" />}
                       {urgency === 'Urgente' && <FaExclamationTriangle className="w-4 h-4 text-orange-500" />}
                       {urgency === 'Muito Urgente' && <FaExclamationTriangle className="w-4 h-4 text-red-500" />}
                       <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                         {urgency}
                       </span>
                     </button>
                   ))}
                 </div>
               </div>

               {/* Nível de Impacto */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Nível de Impacto
                 </label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {(['Baixo', 'Médio', 'Alto', 'Crítico'] as const).map((impact) => (
                     <button
                       key={impact}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, impact_level: impact }))}
                       className={`
                         p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center space-x-2
                         ${formData.impact_level === impact 
                           ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                           : theme === 'dark' 
                             ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                             : 'border-gray-300 bg-white hover:border-gray-400'
                         }
                       `}
                     >
                       {impact === 'Baixo' && <FaCheckCircle className="w-4 h-4 text-green-500" />}
                       {impact === 'Médio' && <FaClock className="w-4 h-4 text-yellow-500" />}
                       {impact === 'Alto' && <FaExclamationTriangle className="w-4 h-4 text-orange-500" />}
                       {impact === 'Crítico' && <FaExclamationTriangle className="w-4 h-4 text-red-500" />}
                       <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                         {impact}
                       </span>
                     </button>
                   ))}
                 </div>
               </div>

               {/* Usuários Afetados */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Usuários Afetados *
                 </label>
                 <input
                   type="text"
                   value={formData.affected_users}
                   onChange={(e) => setFormData(prev => ({ ...prev, affected_users: e.target.value }))}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     errors.affected_users 
                       ? 'border-red-500' 
                       : theme === 'dark' 
                         ? 'bg-gray-700 border-gray-600 text-white' 
                         : 'bg-white border-gray-300 text-gray-900'
                   }`}
                   placeholder="Ex: 15 alunos, 3 professores, toda a equipe administrativa"
                 />
                 {errors.affected_users && (
                   <p className="text-red-500 text-sm mt-1">{errors.affected_users}</p>
                 )}
               </div>

               {/* Impacto no Negócio */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Impacto no Negócio *
                 </label>
                 <textarea
                   value={formData.business_impact}
                   onChange={(e) => setFormData(prev => ({ ...prev, business_impact: e.target.value }))}
                   rows={3}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     errors.business_impact 
                       ? 'border-red-500' 
                       : theme === 'dark' 
                         ? 'bg-gray-700 border-gray-600 text-white' 
                         : 'bg-white border-gray-300 text-gray-900'
                   }`}
                   placeholder="Descreva como este problema afeta as operações, aulas, ou serviços..."
                 />
                 {errors.business_impact && (
                   <p className="text-red-500 text-sm mt-1">{errors.business_impact}</p>
                 )}
               </div>
             </div>
           )}

           {step === 4 && (
             <div className="space-y-6">
               <div>
                 <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Agendamento e Acesso
                 </h2>
               </div>

               {/* Horário Preferencial */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Horário Preferencial para Manutenção
                 </label>
                 <select
                   value={formData.preferred_schedule}
                   onChange={(e) => setFormData(prev => ({ ...prev, preferred_schedule: e.target.value }))}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                 >
                   <option value="">Selecione o horário preferencial</option>
                   <option value="morning">Manhã (8h - 12h)</option>
                   <option value="afternoon">Tarde (13h - 17h)</option>
                   <option value="evening">Noite (18h - 22h)</option>
                   <option value="weekend">Fim de semana</option>
                   <option value="anytime">Qualquer horário</option>
                   <option value="urgent">Imediato (sem preferência)</option>
                 </select>
               </div>

               {/* Restrições de Acesso */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Restrições de Acesso
                 </label>
                 <textarea
                   value={formData.access_restrictions}
                   onChange={(e) => setFormData(prev => ({ ...prev, access_restrictions: e.target.value }))}
                   rows={3}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                   placeholder="Ex: Área restrita, necessidade de acompanhamento, horários específicos de acesso..."
                 />
               </div>

               {/* Requisitos Especiais */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Requisitos Especiais
                 </label>
                 <textarea
                   value={formData.special_requirements}
                   onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                   rows={3}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                   placeholder="Ex: Equipamentos específicos necessários, certificações requeridas, backup de dados..."
                 />
               </div>
             </div>
           )}

                     {step === 5 && (
             <div className="space-y-6">
               <div>
                 <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Anexos e Revisão
                 </h2>
               </div>

              {/* Upload de Arquivos */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Anexos (Fotos, Documentos, etc.)
                </label>
                <div className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 hover:border-blue-500
                  ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}
                `}>
                  <FaFileUpload className={`mx-auto text-3xl mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    PNG, JPG, PDF, DOC até 10MB cada
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                  >
                    Selecionar Arquivos
                  </label>
                </div>

                {/* Lista de arquivos */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className={`p-1 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 ${
                            theme === 'dark' ? 'text-gray-400 hover:bg-red-500' : 'text-gray-500 hover:bg-red-500'
                          }`}
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumo do Chamado */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Resumo do Chamado
                </h3>
                                 <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Título</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.title}</p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Prioridade</p>
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                         {getPriorityIcon(formData.priority)}
                         <span className="ml-1">
                           {formData.priority === 'Low' ? 'Baixa' : 
                            formData.priority === 'Medium' ? 'Média' : 
                            formData.priority === 'High' ? 'Alta' : 'Crítica'}
                         </span>
                       </span>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Categoria</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                         {categories.find(c => c.id === formData.category_id)?.name}
                       </p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Localização</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.location}</p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Prazo</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                         {formData.deadline === 'immediate' ? 'Imediato' :
                          formData.deadline === '24h' ? '24 horas' :
                          formData.deadline === '48h' ? '48 horas' :
                          formData.deadline === '72h' ? '72 horas' :
                          formData.deadline === '1week' ? '1 semana' :
                          formData.deadline === '2weeks' ? '2 semanas' :
                          formData.deadline === '1month' ? '1 mês' :
                          formData.deadline === 'flexible' ? 'Flexível' : formData.deadline}
                       </p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Urgência</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.urgency_level}</p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Impacto</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.impact_level}</p>
                     </div>
                     <div>
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Usuários Afetados</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.affected_users}</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 && (
              <button
                onClick={handlePrevious}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anterior
              </button>
            )}
            
                         <div className="ml-auto">
               {step < 5 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      <span>Enviar Chamado</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
