'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireRole } from '../../../../hooks/useAuth'
import { useI18n } from '../../../../contexts/I18nContext'
import { authCookies } from '../../../../utils/cookies'
import { jwtDecode } from 'jwt-decode'
import { useRequireAuth } from '../../../../hooks/useAuth'

// Base URL para as requisições à API
const API_BASE = 'http://localhost:3000'
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
  FaArrowRight,
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
  attachments: File[]
  additional_info: string
}

interface FormErrors {
  title?: string
  description?: string
  category_id?: string
  subcategory_id?: string
  location?: string
  contact_phone?: string
  contact_email?: string
  deadline?: string
  urgency_level?: string
  impact_level?: string
}

export default function NovoChamadoPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { user, isLoading: authLoading } = useRequireRole(['Client', 'Admin'])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [userData, setUserData] = useState<any>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const categoriesLoadedRef = useRef(false)

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
    attachments: [],
    additional_info: ''
  })

  // Carregar dados completos do usuário apenas uma vez
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.userId || userDataLoaded) {
        return
      }
      
      console.log('Carregando dados do usuário:', user.userId)
      
      try {
        const token = authCookies.getToken()
        if (!token) {
          console.error('Token não encontrado')
          return
        }

        // Tentar primeiro a rota /me que é mais simples
        let response = await fetch(`${API_BASE}/user/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        // Se não funcionar, tentar a rota específica do usuário
        if (!response.ok) {
          console.log('Rota /me falhou, tentando rota específica...')
          response = await fetch(`${API_BASE}/user/${user.userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        }

        console.log('Resposta da API:', response.status, response.statusText)

        if (response.ok) {
          const data = await response.json()
          console.log('Dados do usuário carregados:', data)
          setUserData(data)
          
          // Preencher automaticamente telefone e email se disponíveis
          if (data.phone) {
            console.log('Preenchendo telefone:', data.phone)
            setFormData(prev => ({ ...prev, contact_phone: data.phone }))
          }
          if (data.email) {
            console.log('Preenchendo email:', data.email)
            setFormData(prev => ({ ...prev, contact_email: data.email }))
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Erro na resposta da API:', response.status, errorData)
          
          // Fallback: usar dados do token JWT
          console.log('Usando dados do token JWT como fallback')
          const fallbackData = {
            email: user.email || '',
            phone: ''
          }
          setUserData(fallbackData)
          
          if (fallbackData.phone) {
            setFormData(prev => ({ ...prev, contact_phone: fallbackData.phone }))
          }
          if (fallbackData.email) {
            setFormData(prev => ({ ...prev, contact_email: fallbackData.email }))
          }
        }
        
        setUserDataLoaded(true)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        
        // Fallback em caso de erro: usar dados do token JWT
        console.log('Usando dados do token JWT como fallback devido ao erro')
        const fallbackData = {
          email: user.email || '',
          phone: ''
        }
        setUserData(fallbackData)
        
        if (fallbackData.phone) {
          setFormData(prev => ({ ...prev, contact_phone: fallbackData.phone }))
        }
        if (fallbackData.email) {
          setFormData(prev => ({ ...prev, contact_email: fallbackData.email }))
        }
        
        setUserDataLoaded(true)
      }
    }

    loadUserData()
  }, [user?.userId, userDataLoaded])

  // Já definido no topo do arquivo
  // const API_BASE = 'http://localhost:3000'

  useEffect(() => {
    // Carregar categorias da API apenas quando o usuário estiver autenticado
    const fetchCategories = async () => {
      if (categoriesLoadedRef.current || authLoading || !user) return // Evitar carregamento duplicado
      
      try {
        setIsLoading(true)
        const token = authCookies.getToken()
        if (!token) {
          console.error('Token não encontrado para carregar categorias')
          return
        }

        const response = await fetch(`${API_BASE}/helpdesk/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Falha ao carregar categorias')
        }

        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        // Fallback para categorias mockadas em caso de erro
        setCategories([
          {
            id: 1,
            name: 'Suporte Técnico',
            description: 'Problemas relacionados a hardware, software e configurações',
            icon: 'FaTools'
          },
          {
            id: 2,
            name: 'Infraestrutura',
            description: 'Problemas de rede, servidores e conectividade',
            icon: 'FaNetworkWired'
          },
          {
            id: 3,
            name: 'Sistema',
            description: 'Problemas com o sistema principal e aplicações',
            icon: 'FaDesktop'
          },
          {
            id: 4,
            name: 'Dúvidas',
            description: 'Dúvidas sobre funcionalidades e uso do sistema',
            icon: 'FaInfoCircle'
          }
        ])
      } finally {
        setIsLoading(false)
        categoriesLoadedRef.current = true
      }
    }

    fetchCategories()
  }, [authLoading, user]) // Dependências corretas sem categories.length

  // Função para carregar subcategorias quando uma categoria é selecionada
  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId) return
    
    // Verificar se já temos as subcategorias carregadas
    const existingCategory = categories.find(cat => cat.id === categoryId)
    if (existingCategory?.subcategories) {
      console.log('Subcategorias já carregadas para categoria:', categoryId)
      return
    }
    
    try {
      setIsLoading(true)
      const token = authCookies.getToken()
      if (!token) {
        console.error('Token não encontrado para carregar subcategorias')
        return
      }

      const response = await fetch(`${API_BASE}/helpdesk/categories/${categoryId}/subcategories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Falha ao carregar subcategorias')
      }

      const data = await response.json()
      
      // Atualizar a categoria selecionada com as subcategorias
      const updatedCategory = {...selectedCategory!, subcategories: data}
      setSelectedCategory(updatedCategory)
      
      // Atualizar também a lista de categorias
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, subcategories: data } : cat
      ))
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error)
    } finally {
      setIsLoading(false)
    }
  }



  // Função para lidar com a mudança de categoria
  const handleCategoryChange = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId) || null
    setSelectedCategory(category)
    setFormData({...formData, category_id: categoryId, subcategory_id: undefined})
    
    if (category && (!category.subcategories || category.subcategories.length === 0)) {
      loadSubcategories(categoryId)
    }
  }

  // Função para enviar o formulário para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Dados do formulário antes da validação:', formData);

    // Validar todos os passos antes de enviar
    const newErrors: FormErrors = {};
    
    if (!formData.title) newErrors.title = 'Título é obrigatório';
    if (!formData.description) newErrors.description = 'Descrição é obrigatória';
    if (!formData.category_id) newErrors.category_id = 'Categoria é obrigatória';
    if (!formData.subcategory_id) newErrors.subcategory_id = 'Subcategoria é obrigatória';
    if (!formData.location) newErrors.location = 'Localização é obrigatória';
    if (!formData.contact_phone) newErrors.contact_phone = 'Telefone é obrigatório';
    if (!formData.contact_email) newErrors.contact_email = 'Email é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const { toast } = await import('react-toastify');
      toast.error('Por favor, preencha todos os campos obrigatórios');
      console.log('Erros de validação:', newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Obter token do localStorage
      const token = authCookies.getToken();
      if (!token) {
        import('react-toastify').then(({ toast }) => {
          toast.error('Você precisa estar logado para criar um chamado');
        });
        router.push('/auth/login');
        return;
      }
      
      // Preparar dados do ticket para envio
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        location: formData.location,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        deadline: formData.deadline
      };
      
      console.log('Enviando dados do ticket:', ticketData);
      
      // Enviar dados do ticket para o backend (rota geral permite Admin/Agent/Client)
      const response = await fetch(`${API_BASE}/helpdesk/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar chamado');
      }
      
      const ticketResponse = await response.json();
      console.log('Chamado criado com sucesso:', ticketResponse);
      
      // Se houver anexos, enviar para o backend
      if (formData.attachments.length > 0) {
        const formDataFiles = new FormData();
        formData.attachments.forEach(file => {
          formDataFiles.append('files', file);
        });
        formDataFiles.append('ticketId', ticketResponse.id.toString());
        
        const attachmentResponse = await fetch(`${API_BASE}/api/attachments/upload-multiple`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataFiles
        });
        
        if (!attachmentResponse.ok) {
          const errorData = await attachmentResponse.json();
          console.error('Erro ao enviar anexos:', errorData);
          if (typeof window !== 'undefined' && typeof (window as any).toast !== 'undefined') {
            (window as any).toast.warning('Chamado criado, mas houve um erro ao enviar os anexos');
          }
        } else {
          console.log('Anexos enviados com sucesso');
        }
      }

      // Notificar e redirecionar após a criação
      const { toast } = await import('react-toastify');
      toast.success('Chamado criado com sucesso!');
      setTimeout(() => {
        router.back();
      }, 1200);
      
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      if (typeof window !== 'undefined' && typeof (window as any).toast !== 'undefined') {
        (window as any).toast.error(error instanceof Error ? error.message : 'Erro ao criar chamado');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
      if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
      if (formData.description.trim().length < 10) newErrors.description = 'Descrição deve ter no mínimo 10 caracteres';
      if (!formData.category_id) newErrors.category_id = 'Categoria é obrigatória';
    }

    if (currentStep === 2) {
      if (!formData.location.trim()) newErrors.location = 'Localização é obrigatória';
      if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Telefone é obrigatório';
      if (!formData.contact_email.trim()) newErrors.contact_email = 'Email é obrigatório';
      if (formData.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Email inválido';
      }
    }

    // Etapa 3 removida - campos simplificados

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const files = Array.from(event.target.files);
    
    // Validar tamanho dos arquivos (máximo 10MB cada)
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidSize) {
        alert(`Arquivo ${file.name} excede o tamanho máximo de 10MB`);
      }
      return isValidSize;
    });
    
    // Validar tipos de arquivo permitidos
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validTypeFiles = validFiles.filter(file => {
      const isValidType = allowedTypes.includes(file.type);
      if (!isValidType) {
        alert(`Tipo de arquivo não suportado: ${file.name}`);
      }
      return isValidType;
    });
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validTypeFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Substituído pela nova implementação do handleSubmit que usa a API real
  // const handleSubmit = async () => {
  //   if (!validateStep(step)) return

  //   setIsLoading(true)
    
  //   try {
  //     // Simular envio para API
  //     await new Promise(resolve => setTimeout(resolve, 2000))
      
  //     // Redirecionar para página de sucesso ou lista de chamados
  //     router.push('/pages/called')
  //   } catch (error) {
  //     console.error('Erro ao criar chamado:', error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // Substituído pelo handleCategoryChange
  // const handleCategorySelect = (category: Category) => {
  //   setSelectedCategory(category)
  //   setFormData(prev => ({
  //     ...prev,
  //     category_id: category.id,
  //     subcategory_id: undefined
  //   }))
  //   setErrors(prev => ({ ...prev, category_id: undefined }))
  // }

  // Função para lidar com a seleção de subcategoria
  const handleSubcategorySelect = (subcategoryId: number) => {
    setFormData({
      ...formData,
      subcategory_id: subcategoryId
    });
  };

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 to-gray-900' : 'bg-gray-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-gray-100'}
    >
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } shadow-lg flex items-center justify-center`}
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <span className="mr-3 bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg text-white shadow-md">
                  <FaTools className="w-6 h-6" />
                </span>
                Chamado
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Solicite uma manutenção de forma rápida e eficiente
              </p>
            </div>
          </div>

                     {/* Progress Steps */}
           <div className="flex items-center justify-center mb-8">
             <div className="flex items-center space-x-4">
               {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
                    ${step >= stepNumber 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {stepNumber}
                  </div>
                                     {stepNumber < 4 && (
                    <div className={`
                      w-10 md:w-16 h-1.5 mx-1 md:mx-2 rounded-full transition-all duration-300
                      ${step > stepNumber 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
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
        <div className={`rounded-2xl shadow-xl ${theme === 'dark' ? 'bg-gray-800 border-red-800/30' : 'bg-white border-red-200'} p-8 border backdrop-blur-sm bg-opacity-95 hover:shadow-red-500/10 transition-all duration-300`}>
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  <span className="mr-3 bg-gradient-to-r from-red-500 to-red-600 p-1.5 rounded-lg text-white shadow-md">
                    <FaInfoCircle className="w-4 h-4" />
                  </span>
                  Informações Básicas
                </h2>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  Forneça as informações essenciais para o seu chamado
                </p>
              </div>

              {/* Título */}
              <div className="group">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <FaCalendarAlt className="mr-2 text-red-500" size={14} />
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-red-500 ${
                    errors.title 
                      ? 'border-red-500' 
                      : theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Ex: Falha no sistema de login"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Descrição */}
              <div className="group">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <FaFileUpload className="mr-2 text-red-500" size={14} />
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-red-500 ${
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
              <div className="group">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <FaExclamationTriangle className="mr-2 text-red-500" size={14} />
                  Prioridade *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2
                        ${formData.priority === priority 
                          ? priority === 'Low' 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' 
                            : priority === 'Medium' 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' 
                              : priority === 'High' 
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md' 
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                          : theme === 'dark' 
                            ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className={`
                        ${formData.priority === priority 
                          ? priority === 'Low' 
                            ? 'text-green-500' 
                            : priority === 'Medium' 
                              ? 'text-red-500' 
                              : priority === 'High' 
                                ? 'text-orange-500' 
                                : 'text-red-500'
                          : theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }
                      `}>
                        {getPriorityIcon(priority)}
                      </div>
                      <span className={`font-medium 
                        ${formData.priority === priority 
                          ? priority === 'Low' 
                            ? 'text-green-700 dark:text-green-300' 
                            : priority === 'Medium' 
                              ? 'text-red-700 dark:text-red-300' 
                              : priority === 'High' 
                                ? 'text-orange-700 dark:text-orange-300' 
                                : 'text-red-700 dark:text-red-300'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }
                      `}>
                        {priority === 'Low' ? 'Baixa' : 
                         priority === 'Medium' ? 'Média' : 
                         priority === 'High' ? 'Alta' : 'Crítica'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div className="group">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <FaWrench className="mr-2 text-red-500" size={14} />
                  Categoria *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left
                        ${formData.category_id === category.id 
                          ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 shadow-md' 
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
                    Subcategoria *
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
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
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
                  {errors.subcategory_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.subcategory_id}</p>
                  )}
                </div>
              )}


            </div>
          )}

                     {step === 2 && (
             <div className="space-y-6">
               <div>
                 <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Localização e Contato
                 </h2>
               </div>
               <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                 Forneça detalhes precisos sobre a localização do problema e suas informações de contato para facilitar a comunicação durante o atendimento.
               </p>

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
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-red-500 ${
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
                     type="text"
                     value={formData.contact_phone}
                     readOnly
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                       errors.contact_phone 
                         ? 'border-red-500' 
                         : theme === 'dark' 
                           ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed' 
                           : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                     }`}
                                           placeholder={userData?.phone ? userData.phone : (user?.userId ? "Carregando..." : "Aguardando login...")}
                   />
                 </div>
                 {errors.contact_phone && (
                   <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                 )}
                 <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   Telefone carregado automaticamente do seu perfil
                 </p>
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
                     readOnly
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                       errors.contact_email 
                         ? 'border-red-500' 
                         : theme === 'dark' 
                           ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed' 
                           : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                     }`}
                                           placeholder={userData?.email ? userData.email : (user?.userId ? "Carregando..." : "Aguardando login...")}
                   />
                 </div>
                 {errors.contact_email && (
                   <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                 )}
                 <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   Email carregado automaticamente do seu perfil
                 </p>
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
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-red-500 ${
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
                   Prazo, Impacto e Agendamento
                 </h2>
               </div>
               <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                 Defina a urgência e o impacto do problema para ajudar a equipe técnica a priorizar adequadamente o seu chamado.
               </p>

               {/* Prazo */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Prazo para Resolução *
                 </label>
                 <select
                   value={formData.deadline}
                   onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                   className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-red-500 ${
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
                           ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
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

               {/* Campos simplificados - removidos campos desnecessários */}
             </div>
           )}

                     {step === 4 && (
             <div className="space-y-6">
               <div className="flex items-center mb-6">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
                   <FaFileUpload className="w-5 h-5" />
                 </div>
                 <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Anexos e Revisão
                 </h2>
               </div>
               <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                 Adicione arquivos que possam ajudar a equipe técnica a entender melhor o problema e revise todas as informações antes de enviar o chamado.
               </p>

              {/* Upload de Arquivos */}
              <div>
                <label className={`flex items-center text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaFileUpload className="mr-2" />
                  Anexos (Fotos, Documentos, etc.)
                </label>
                <div className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 hover:border-red-500 hover:shadow-md
                  ${theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}
                `}>
                  <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 p-3 rounded-full inline-block mb-4">
                    <FaFileUpload className={`mx-auto text-3xl ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                  </div>
                  <p className={`mb-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                    className="inline-block mt-4 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 cursor-pointer"
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
                       <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Informações Adicionais</p>
                       <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formData.additional_info || 'Nenhuma informação adicional'}</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2 shadow-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <FaArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}
            </div>
            
            <div className="ml-auto">
               {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <span>Próximo</span>
                  <FaArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
