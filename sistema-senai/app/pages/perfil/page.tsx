'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRequireAuth } from '../../../hooks/useAuth'
import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../../../utils/cookies'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Interface para o token decodificado
interface DecodedToken {
  id?: string | number;
  userId?: string | number;
  sub?: string | number;
  name?: string;
  email?: string;
  role?: string;
  userRole?: string;
  exp?: number;
  iat?: number;
  [key: string]: any; // Para outros campos que possam existir
}

interface UserData {
  id: number
  nome: string
  email: string
  telefone: string
  cargo: string
  departamento: string
  matricula: string
  dataAdmissao: string
  avatar: string
  endereco: string
  habilidades: string[]
  certificacoes: string[]
}

import {
  FaUser,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaTrash,
  FaDownload,
  FaUpload,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaGraduationCap,
  FaCertificate,
  FaAward,
  FaCalendar,
  FaClock,
  FaStar,
  FaHeart,
  FaBookmark,
  FaShare,
  FaLink,
  FaExternalLinkAlt,
  FaCopy,
  FaQrcode,
  FaBarcode,
  FaCreditCard,
  FaPaypal,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaTools,
  FaWrench,
  FaCog,
  FaHistory,
  FaChartBar,
  FaFileAlt,
  FaTicketAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaQuestionCircle,
  FaComments,
  FaThumbsUp,
  FaThumbsDown,
  FaSmile,
  FaFrown,
  FaMeh,
  FaAngry,
  FaSurprise,
  FaSadTear,
  FaLaugh,
  FaGrin,
  FaGrinBeam,
  FaGrinHearts,
  FaGrinStars,
  FaGrinTears,
  FaGrinTongue,
  FaGrinTongueWink,
  FaGrinTongueSquint,
  FaGrinWink,
  FaGrinSquint,
  FaGrinSquintTears
} from 'react-icons/fa'

export default function PerfilPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const [activeTab, setActiveTab] = useState('perfil')
  const [isEditing, setIsEditing] = useState(false)
  
  // Verificar se há um parâmetro tab na URL para abrir a aba automaticamente
  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam && ['perfil', 'atividades', 'avaliacoes'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userType, setUserType] = useState<string>('admin')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Dados do usuário
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    departamento: '',
    matricula: '',
    dataAdmissao: '',
    endereco: '',
    avatar: '/senai-logo.png',
    habilidades: [] as string[],
    certificacoes: [] as {nome: string, data: string, validade: string}[]
  })

  const [formData, setFormData] = useState({ ...userData })
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [evaluationStats, setEvaluationStats] = useState<any>(null)
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false)

  // Lista das 5 atividades mais recentes
  const recentTickets = useMemo(() => {
    const list = Array.isArray(tickets) ? [...tickets] : []
    list.sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
    return list.slice(0, 5)
  }, [tickets])

  // Detectar tipo de usuário baseado no token
  useEffect(() => {
    if (!user || isLoading) return

    try {
      const token = authCookies.getToken()
      if (token) {
        const decoded: DecodedToken = jwtDecode(token)
        const role = (decoded?.role ?? decoded?.userRole ?? '').toString().toLowerCase()
        const mapped = role === 'agent' ? 'tecnico' : role === 'client' ? 'profissional' : 'admin'
        setUserType(mapped)
      }
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
    }
  }, [user, isLoading])

  // Carregar dados do usuário
  useEffect(() => {
    if (!user || isLoading || !isAuthenticated) return

    const loadUserData = async () => {
      try {
        const token = authCookies.getToken()
        if (!token) {
          router.push('/pages/auth/login')
          return
        }

        // Tentar buscar dados do usuário da API
        const response = await fetch('/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const userDataFromAPI = await response.json()
          setUserData(userDataFromAPI)
          setFormData(userDataFromAPI)
        } else {
          // Fallback: usar dados do token JWT
          const decoded: DecodedToken = jwtDecode(token)
          const userId = Number(decoded?.userId ?? decoded?.id ?? decoded?.sub ?? 1)
          const userRole = (decoded?.role ?? decoded?.userRole ?? 'admin').toString().toLowerCase()
          
          const defaultData: UserData = {
            id: userId,
            nome: user.name || 'Usuário SENAI',
            email: user.email || 'usuario@senai.com',
            telefone: '',
            cargo: userRole === 'admin' ? 'Administrador do Sistema' : userRole === 'tecnico' ? 'Técnico' : 'Profissional',
            departamento: 'Tecnologia da Informação',
            matricula: 'SENAI-2024-001',
            dataAdmissao: '2020-03-15',
            avatar: '/senai-logo.png',
            endereco: '',
            habilidades: [],
            certificacoes: [],
          }
          setUserData(defaultData)
          setFormData(defaultData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        // Fallback em caso de erro
        const defaultData: UserData = {
          id: 1,
          nome: user.name || 'Usuário SENAI',
          email: user.email || 'usuario@senai.com',
          telefone: '',
          cargo: 'Usuário',
          departamento: 'Tecnologia da Informação',
          matricula: 'SENAI-2024-001',
          dataAdmissao: '2020-03-15',
          avatar: '/senai-logo.png',
          endereco: '',
          habilidades: [],
          certificacoes: [],
        }
        setUserData(defaultData)
        setFormData(defaultData)
      }
    }

    loadUserData()
  }, [router, user, isLoading, isAuthenticated])

  // Buscar chamados quando a aba de atividades for selecionada
  useEffect(() => {
    if (activeTab === 'atividades' && user && !isLoadingTickets) {
      fetchTickets()
    }
  }, [activeTab, user])

  // Buscar avaliações quando a aba de avaliações for selecionada
  useEffect(() => {
    if (activeTab === 'avaliacoes' && user && !isLoadingEvaluations && (userType === 'tecnico' || userType === 'agent')) {
      fetchEvaluations()
    }
  }, [activeTab, user, userType])

  const fetchEvaluations = async () => {
    if (!user) return
    
    setIsLoadingEvaluations(true)
    try {
      const token = authCookies.getToken()
      if (!token) {
        console.error('Token não encontrado')
        return
      }

      // Buscar avaliações
      const evaluationsResponse = await fetch('/helpdesk/agents/my-evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Buscar estatísticas de avaliação
      const statsResponse = await fetch('/helpdesk/agents/my-evaluation-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (evaluationsResponse.ok) {
        const evaluationsData = await evaluationsResponse.json()
        setEvaluations(evaluationsData.evaluations || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setEvaluationStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    } finally {
      setIsLoadingEvaluations(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Obter o ID do usuário do token
      const token = authCookies.getToken();
      if (!token) {
        alert('Token não encontrado. Faça login novamente.');
        return;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.id || decodedToken.userId || decodedToken.sub;
      
      if (!userId) {
        alert('ID do usuário não encontrado no token.');
        return;
      }

      // Configurar headers de autenticação para o Supabase
      // Como estamos usando JWT próprio, vamos usar a chave anônima do Supabase
      console.log('Iniciando upload de avatar para o Supabase Storage...');

      // Fazer upload para o Supabase Storage
      const fileName = `${userId}/avatar_${Date.now()}.webp`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload da imagem: ' + error.message);
        return;
      }

      // Obter URL pública
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      const avatarUrl = publicData.publicUrl;

      // Atualizar no backend
      const response = await fetch(`/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: avatarUrl })
      });

      if (response.ok) {
        setUserData(prev => ({ ...prev, avatar: avatarUrl }));
        setFormData(prev => ({ ...prev, avatar: avatarUrl }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('Erro ao atualizar avatar no backend:', errorData);
        alert('Erro ao atualizar avatar: ' + (errorData.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro geral:', error);
      alert('Erro ao processar upload da imagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Obter o ID do usuário do token
      const token = authCookies.getToken()
      if (!token) {
        alert('Token não encontrado. Faça login novamente.')
        return
      }
      const decodedToken = jwtDecode<DecodedToken>(token)
      const userId = decodedToken.userId || decodedToken.id || decodedToken.sub

      // Preparar dados para enviar ao backend
      const payload = {
        name: formData.nome,
        email: formData.email,
        phone: (formData.telefone || '').replace(/\D/g, ''),
        avatar: formData.avatar,
        // Outros campos que precisam ser atualizados
      }

      // Enviar os dados atualizados para o backend (usa rota /user/me para persistir dados relacionados ao perfil)
      const response = await fetch(`/user/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          // Campos de perfil complementares (não permitir edição por colaboradores)
          ...(userType === 'admin' ? { department: formData.departamento, position: formData.cargo } : {}),
          address: formData.endereco,
        })
      })

      if (response.ok) {
        try {
          // Recarregar dados do backend para refletir valores normalizados
          const refreshed = await fetch('/user/me', { headers: { 'Authorization': `Bearer ${token}` } })
          if (refreshed.ok) {
            const latest = await refreshed.json()
            const latestData = {
              ...payload,
              id: latest.id,
              nome: latest.name,
              email: latest.email,
              telefone: latest.phone || '',
              avatar: latest.avatar || formData.avatar,
              cargo: latest.position || formData.cargo,
              departamento: latest.agent?.department || latest.department || formData.departamento,
              matricula: latest.agent?.employee_id || userData.matricula,
              dataAdmissao: latest.created_at || userData.dataAdmissao,
              endereco: latest.address || latest.client?.address || formData.endereco,
              habilidades: formData.habilidades,
              certificacoes: formData.certificacoes,
              categorias: (latest.agent?.categories || []).map((c: any) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon })),
            }
            setUserData(latestData)
            setFormData(latestData)

            // Notificar outros componentes (ex.: Sidebar) para se atualizarem
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('profile-updated'))
            }
          } else {
            setUserData(formData)
          }
        } catch {
          setUserData(formData)
        }
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        console.error('Erro na resposta do servidor:', errorData)
        alert('Erro ao salvar os dados do perfil: ' + (errorData.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar os dados do perfil')
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData({ ...userData })
    setIsEditing(false)
  }

  // Função para buscar chamados baseados no tipo de usuário
  const fetchTickets = async () => {
    if (!user) return
    
    setIsLoadingTickets(true)
    try {
      const token = authCookies.getToken()
      if (!token) return

      let endpoint = ''
      if (userType === 'tecnico' || userType === 'agent') {
        // Técnicos/Agentes: tickets atribuídos a eles
        endpoint = '/helpdesk/agents/my-tickets'
      } else if (userType === 'client' || userType === 'colaborador' || userType === 'profissional') {
        // Clientes/colaboradores: tickets criados por eles
        endpoint = '/helpdesk/client/my-tickets'
      } else {
        // Admin: listar tickets (pode filtrar no cliente depois se necessário)
        endpoint = '/helpdesk/tickets'
      }

      const response = await fetch(`${endpoint}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const ticketsData = data.tickets || data.assignedTickets || []
        setTickets(ticketsData)
      } else {
        console.error('Erro ao buscar chamados:', response.statusText)
        setTickets([])
      }
    } catch (error) {
      console.error('Erro ao buscar chamados:', error)
      setTickets([])
    } finally {
      setIsLoadingTickets(false)
    }
  }

  // Definir as abas disponíveis com base no tipo de usuário
  const tabs = userType === 'admin' 
    ? [
        { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
        { id: 'atividades', label: 'Atividades', icon: <FaHistory /> }
      ]
    : userType === 'tecnico' || userType === 'agent'
    ? [
        { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
        { id: 'atividades', label: 'Atividades', icon: <FaHistory /> },
        { id: 'avaliacoes', label: 'Avaliações', icon: <FaStar /> }
      ]
    : [
        { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
        { id: 'atividades', label: 'Atividades', icon: <FaHistory /> }
      ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
      case 'Resolved':
      case 'Closed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'Em Andamento':
      case 'InProgress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'Pendente':
      case 'Open':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'Cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  // Função para formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) {
      return 'Agora mesmo'
    } else if (diffInHours < 24) {
      return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  // Função para obter ícone baseado no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
      case 'Concluído':
        return <FaCheckCircle className="w-5 h-5 text-white" />
      case 'InProgress':
      case 'Em Andamento':
        return <FaClock className="w-5 h-5 text-white" />
      case 'Open':
      case 'Pendente':
        return <FaTicketAlt className="w-5 h-5 text-white" />
      case 'Cancelled':
        return <FaTimes className="w-5 h-5 text-white" />
      default:
        return <FaTicketAlt className="w-5 h-5 text-white" />
    }
  }

  // Função para obter cor do ícone baseado no status
  const getStatusIconColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
      case 'Concluído':
        return 'bg-green-600'
      case 'InProgress':
      case 'Em Andamento':
        return 'bg-blue-600'
      case 'Open':
      case 'Pendente':
        return 'bg-yellow-600'
      case 'Cancelled':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  // Função para renderizar estrelas
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <FaStar 
            key={i} 
            className={`text-yellow-400 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} 
          />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <FaStar 
            key={i} 
            className={`text-yellow-400 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} 
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        )
      } else {
        stars.push(
          <FaStar 
            key={i} 
            className={`text-gray-300 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} 
          />
        )
      }
    }
    return stars
  }

  const userTypeCast = userType as 'admin' | 'profissional' | 'tecnico';
return (
    <ResponsiveLayout
      userType={userTypeCast}
      userName={userName}
      userEmail={userEmail}
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-16 lg:py-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Perfil
            </h1>
            <p className={`mt-2 text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie suas informações de perfil.
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaTimes className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    isSaving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span className="hidden sm:inline">Salvar</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaEdit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar Perfil</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheckCircle />
          Informações salvas com sucesso!
        </div>
      )}

      {/* Cabeçalho do Perfil */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-red-500">
              <img 
                src={userData.avatar || '/avatar-placeholder.png'} 
                alt="Avatar do usuário" 
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing && (
  <button 
    className="absolute bottom-0 right-0 bg-red-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg"
    onClick={() => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e) => {
        handleAvatarChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
      };
      fileInput.click();
    }}
  >
    <FaCamera size={14} className="sm:w-4 sm:h-4" />
  </button>
 )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {userData.nome}
            </h2>
            <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {userData.cargo}
            </p>
            
            {userType !== 'admin' && (
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {userData.departamento} • Matrícula: {userData.matricula}
              </p>
            )}
            
            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <FaEnvelope className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} w-3 h-3 sm:w-4 sm:h-4`} />
                <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{userData.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <FaPhone className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} w-3 h-3 sm:w-4 sm:h-4`} />
                {userData.telefone ? (
                  <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{userData.telefone}</span>
                ) : userType === 'admin' && (
                  <span className={`italic text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clique em "Editar Perfil" para adicionar seu telefone</span>
                )}
              </div>
              
              {userType !== 'admin' && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <FaCalendar className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} w-3 h-3 sm:w-4 sm:h-4`} />
                  <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Admissão: {userData.dataAdmissao}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`rounded-xl p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        
        {/* Perfil */}
        {activeTab === 'perfil' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Informações Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.nome : userData.nome}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={isEditing ? formData.email : userData.email}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.telefone : userData.telefone}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={userType === 'admin' ? 'Adicionar telefone' : ''}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.cargo : userData.cargo}
                    onChange={(e) => {
                      if (!isEditing) return
                      setFormData(prev => ({ ...prev, cargo: e.target.value }))
                    }}
                    disabled={userType !== 'admin' ? true : !isEditing}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${(userType !== 'admin') ? 'opacity-60 cursor-not-allowed' : (!isEditing ? 'opacity-50 cursor-not-allowed' : '')}`}
                  />
                </div>

                {userType !== 'admin' && (
                  <>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={isEditing ? formData.endereco : userData.endereco}
                        onChange={(e) => isEditing && setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        disabled={!isEditing}
                        className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={
                          userType === 'tecnico' || userType === 'agent'
                            ? ((isEditing ? ((formData as any).categorias || []) : ((userData as any).categorias || []))).map((c: any) => c?.name).filter(Boolean).join(', ') || ''
                            : (isEditing ? formData.departamento : userData.departamento)
                        }
                        onChange={(e) => {
                          if (!isEditing) return
                          if (!(userType === 'tecnico' || userType === 'agent')) {
                            setFormData(prev => ({ ...prev, departamento: e.target.value }))
                          }
                        }}
                        disabled={userType !== 'admin' ? true : !isEditing}
                        className={`w-full px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent ${(userType !== 'admin') ? 'opacity-60 cursor-not-allowed' : (!isEditing ? 'opacity-50 cursor-not-allowed' : '')}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Atividades */}
        {activeTab === 'atividades' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Chamados
              </h3>
              
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Carregando chamados...
                  </span>
                </div>
              ) : recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {recentTickets.map((ticket, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusIconColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.title || ticket.description || 'Sem título'}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            #{ticket.id || ticket.ticket_id} - {ticket.description ? (ticket.description.length > 60 ? ticket.description.substring(0, 60) + '...' : ticket.description) : 'Sem descrição'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status === 'Open' ? 'Pendente' : 
                               ticket.status === 'InProgress' ? 'Em Andamento' : 
                               ticket.status === 'Resolved' ? 'Concluído' : 
                               ticket.status === 'Closed' ? 'Fechado' : 
                               ticket.status === 'Cancelled' ? 'Cancelado' : ticket.status}
                            </span>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              {ticket.created_at ? formatRelativeTime(ticket.created_at) : 'Data não disponível'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tickets.length > 5 && (
                    <div className="pt-2">
                      <button
                        onClick={() => router.push('/pages/called/history')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        Ver mais
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FaTicketAlt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Nenhum chamado ainda
                  </p>
                  <p className="text-sm">
                    Seus chamados aparecerão aqui quando você os criar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avaliações - Apenas para técnicos */}
        {activeTab === 'avaliacoes' && (userType === 'tecnico' || userType === 'agent') && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Avaliações
              </h3>
              
              {isLoadingEvaluations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Carregando avaliações...
                  </span>
                </div>
              ) : evaluationStats ? (
                <div className="space-y-6">
                  {/* Resumo das Avaliações */}
                  <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Resumo Geral
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Avaliação Média Geral */}
                      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Avaliação Média
                          </span>
                          <FaStar className="text-yellow-400 w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {evaluationStats.averageRatings?.overall_rating || 0}
                          </span>
                          <div className="flex">
                            {renderStars(evaluationStats.averageRatings?.overall_rating || 0, 'sm')}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {evaluationStats.totalEvaluations || 0} avaliações
                        </p>
                      </div>

                      {/* Total de Avaliações */}
                      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Total de Avaliações
                          </span>
                          <FaChartBar className="text-blue-400 w-4 h-4" />
                        </div>
                        <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {evaluationStats.totalEvaluations || 0}
                        </span>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          avaliações recebidas
                        </p>
                      </div>

                      {/* Tendência */}
                      {evaluationStats.improvementTrend && (
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              Tendência
                            </span>
                            {evaluationStats.improvementTrend.trend === 'improving' ? (
                              <FaThumbsUp className="text-green-400 w-4 h-4" />
                            ) : evaluationStats.improvementTrend.trend === 'declining' ? (
                              <FaExclamationTriangle className="text-red-400 w-4 h-4" />
                            ) : (
                              <FaCheckCircle className="text-blue-400 w-4 h-4" />
                            )}
                          </div>
                          <span className={`text-lg font-bold ${
                            evaluationStats.improvementTrend.trend === 'improving' 
                              ? 'text-green-600' 
                              : evaluationStats.improvementTrend.trend === 'declining' 
                                ? 'text-red-600' 
                                : 'text-blue-600'
                          }`}>
                            {evaluationStats.improvementTrend.change > 0 ? '+' : ''}
                            {evaluationStats.improvementTrend.change.toFixed(1)}
                          </span>
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {evaluationStats.improvementTrend.percentage > 0 ? '+' : ''}
                            {evaluationStats.improvementTrend.percentage}% vs anterior
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento por Categoria */}
                  {evaluationStats.averageRatings && (
                    <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Avaliação por Categoria
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(evaluationStats.averageRatings).map(([category, rating]) => {
                          if (category === 'overall_rating') return null
                          
                          const categoryLabels: { [key: string]: string } = {
                            technical_skills: 'Habilidades Técnicas',
                            communication: 'Comunicação',
                            problem_solving: 'Resolução de Problemas',
                            teamwork: 'Trabalho em Equipe',
                            punctuality: 'Pontualidade'
                          }
                          
                          return (
                            <div key={category} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {categoryLabels[category] || category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {rating as number}
                                </span>
                                <div className="flex">
                                  {renderStars(rating as number, 'sm')}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lista de Avaliações Recentes */}
                  {evaluations.length > 0 ? (
                    <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Avaliações Recentes
                      </h4>
                      
                      <div className="space-y-4">
                        {evaluations.slice(0, 5).map((evaluation, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Avaliação #{evaluation.id}
                                  </span>
                                  <div className="flex">
                                    {renderStars(evaluation.overall_rating, 'sm')}
                                  </div>
                                </div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Avaliado por: {evaluation.evaluator?.name || 'Avaliador anônimo'}
                                </p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {evaluation.evaluation_date ? new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                </p>
                              </div>
                            </div>
                            
                            {evaluation.comments && (
                              <div className={`mt-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-100'}`}>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  "{evaluation.comments}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <FaStar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        Nenhuma avaliação ainda
                      </p>
                      <p className="text-sm">
                        Suas avaliações aparecerão aqui quando você receber feedback dos clientes
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FaStar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Erro ao carregar avaliações
                  </p>
                  <p className="text-sm">
                    Não foi possível carregar suas avaliações. Tente novamente mais tarde.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

       

        
      </div>
    </ResponsiveLayout>
  ) 
}