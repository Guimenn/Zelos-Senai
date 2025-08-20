'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useI18n } from '../../../contexts/I18nContext'
import { useRouter } from 'next/navigation'
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

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShieldAlt,
  FaGraduationCap,
  FaTools,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaCheck,
  FaExclamationTriangle,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaHistory,
  FaChartBar,
  FaClipboardList,
  FaWrench,
  FaUsers,
  FaCog as FaSettings,
  FaUserCog,
  FaIdCard,
  FaCertificate,
  FaAward,
  FaStar,
  FaThumbsUp,
  FaComments,
  FaHeart,
  FaBriefcase,
  FaGlobe,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaClock
} from 'react-icons/fa'

export default function PerfilPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { t } = useI18n()
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const [activeTab, setActiveTab] = useState('perfil')
  const [isEditing, setIsEditing] = useState(false)
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
    bio: '',
    avatar: '/senai-logo.png',
    habilidades: [] as string[],
    certificacoes: [] as {nome: string, data: string, validade: string}[]
  })

  const [formData, setFormData] = useState({ ...userData })
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

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

  // Carregar dados do usuário logado
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Verificar se o token tem o formato antigo (com userRole) ou novo (com role)
      const userRole = user.userRole ? user.userRole.toLowerCase() : user.role?.toLowerCase()
      
      setUserType(userRole || 'admin')
      setUserName(user.name || '')
      setUserEmail(user.email || '')

      // Buscar dados do usuário do backend
      const token = authCookies.getToken()
      fetch('/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do usuário')
        }
        return response.json()
      })
      .then(data => {
        // Preencher os dados do usuário com os dados do backend
        const userData = {
          id: data.id,
          nome: data.name || 'Usuário SENAI',
          email: data.email || 'usuario@senai.com',
          telefone: data.phone || '',
          cargo: userRole === 'admin' ? 'Administrador do Sistema' : userRole === 'tecnico' ? 'Técnico' : 'Profissional',
          departamento: data.agent?.department || 'Tecnologia da Informação',
          matricula: data.agent?.employee_id || 'SENAI-2024-001',
          dataAdmissao: data.created_at || '2020-03-15',
          endereco: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP',
          bio: 'Administrador experiente com mais de 5 anos de experiência em sistemas de gestão empresarial. Especialista em implementação de soluções tecnológicas para otimização de processos.',
          avatar: data.avatar || '/senai-logo.png',
          habilidades: ['Gestão de Sistemas', 'Administração de Redes', 'Suporte Técnico', 'Análise de Dados', 'Treinamento de Usuários'],
          certificacoes: [
            { nome: 'Microsoft Certified: Azure Administrator Associate', data: '2023-06-15', validade: '2025-06-15' },
            { nome: 'ITIL Foundation', data: '2022-09-20', validade: '2024-09-20' },
            { nome: 'CompTIA A+', data: '2021-11-10', validade: '2024-11-10' }
          ]
        }
        
        setUserData(userData)
        setFormData(userData)
      })
      .catch(error => {
        console.error('Erro ao buscar dados do usuário:', error)
        // Em caso de erro, usar dados padrão
        const userId = user.userId
        const defaultData = {
          id: userId,
          nome: user.name || 'Usuário SENAI',
          email: user.email || 'usuario@senai.com',
          telefone: '',
          cargo: userRole === 'admin' ? 'Administrador do Sistema' : userRole === 'tecnico' ? 'Técnico' : 'Profissional',
          departamento: 'Tecnologia da Informação',
          matricula: 'SENAI-2024-001',
          dataAdmissao: '2020-03-15',
          endereco: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP',
          bio: 'Administrador experiente com mais de 5 anos de experiência em sistemas de gestão empresarial. Especialista em implementação de soluções tecnológicas para otimização de processos.',
          avatar: '/senai-logo.png',
          habilidades: ['Gestão de Sistemas', 'Administração de Redes', 'Suporte Técnico', 'Análise de Dados', 'Treinamento de Usuários'],
          certificacoes: [
            { nome: 'Microsoft Certified: Azure Administrator Associate', data: '2023-06-15', validade: '2025-06-15' },
            { nome: 'ITIL Foundation', data: '2022-09-20', validade: '2024-09-20' },
            { nome: 'CompTIA A+', data: '2021-11-10', validade: '2024-11-10' }
          ]
        }
        setUserData(defaultData)
        setFormData(defaultData)
      })
    }
  }, [router, user, isLoading, isAuthenticated])

  // Buscar chamados quando a aba de atividades for selecionada
  useEffect(() => {
    if (activeTab === 'atividades' && user && !isLoadingTickets) {
      fetchTickets()
    }
  }, [activeTab, user])

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
      const userId = decodedToken.userId

      // Preparar dados para enviar ao backend
      const userData = {
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        avatar: formData.avatar,
        // Outros campos que precisam ser atualizados
      }

      // Enviar os dados atualizados para o backend
      const response = await fetch(`/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        // Atualizar o estado local com os dados do formulário
        setUserData(formData)
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
        return <FaCheck className="w-5 h-5 text-white" />
      case 'InProgress':
      case 'Em Andamento':
        return <FaClock className="w-5 h-5 text-white" />
      case 'Open':
      case 'Pendente':
        return <FaClipboardList className="w-5 h-5 text-white" />
      case 'Cancelled':
        return <FaTimes className="w-5 h-5 text-white" />
      default:
        return <FaClipboardList className="w-5 h-5 text-white" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('profile.title')}
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('profile.subtitle')}
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaTimes />
                  {t('profile.buttons.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isSaving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('profile.buttons.saving')}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {t('profile.buttons.save')}
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaEdit />
                {t('profile.buttons.edit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheck />
          {t('profile.success')}
        </div>
      )}

      {/* Cabeçalho do Perfil */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-500">
              <img 
                src={userData.avatar || '/avatar-placeholder.png'} 
                alt="Avatar do usuário" 
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing && (
  <button 
    className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg"
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
    <FaCamera size={16} />
  </button>
)}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {userData.nome}
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {userData.cargo}
            </p>
            
            {userType !== 'admin' && (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {userData.departamento} • Matrícula: {userData.matricula}
              </p>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <FaEnvelope className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{userData.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <FaPhone className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
                {userData.telefone ? (
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{userData.telefone}</span>
                ) : userType === 'admin' && (
                  <span className={`italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clique em "Editar Perfil" para adicionar seu telefone</span>
                )}
              </div>
              
              {userType !== 'admin' && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <FaCalendarAlt className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Admissão: {userData.dataAdmissao}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
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
      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        
        {/* Perfil */}
        {activeTab === 'perfil' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('profile.section.personalInfo')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('profile.labels.fullName')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.nome : userData.nome}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('profile.labels.email')}
                  </label>
                  <input
                    type="email"
                    value={isEditing ? formData.email : userData.email}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('profile.labels.phone')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.telefone : userData.telefone}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={userType === 'admin' ? t('profile.labels.addPhone') : ''}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('profile.labels.role')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.cargo : userData.cargo}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                {userType !== 'admin' && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('profile.labels.department')}
                      </label>
                      <input
                        type="text"
                        value={isEditing ? formData.departamento : userData.departamento}
                        onChange={(e) => isEditing && setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('profile.labels.address')}
                      </label>
                      <input
                        type="text"
                        value={isEditing ? formData.endereco : userData.endereco}
                        onChange={(e) => isEditing && setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {userType !== 'admin' && (
              <>
                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('profile.labels.bio')}
                  </h3>
                  <textarea
                    value={isEditing ? formData.bio : userData.bio}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('profile.labels.skills')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.habilidades.map((habilidade, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {habilidade}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Atividades */}
        {activeTab === 'atividades' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {userType === 'tecnico' || userType === 'agent' 
                  ? 'Chamados Atribuídos a Você' 
                  : 'Chamados Criados por Você'
                }
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
                            {userType === 'tecnico' || userType === 'agent' 
                              ? `Chamado atribuído: ${ticket.title || ticket.description || 'Sem título'}`
                              : `Chamado criado: ${ticket.title || ticket.description || 'Sem título'}`
                            }
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
                  <FaClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {userType === 'tecnico' || userType === 'agent' 
                      ? 'Nenhum chamado atribuído a você ainda'
                      : 'Você ainda não criou nenhum chamado'
                    }
                  </p>
                  <p className="text-sm">
                    {userType === 'tecnico' || userType === 'agent' 
                      ? 'Os chamados aparecerão aqui quando forem atribuídos a você'
                      : 'Seus chamados aparecerão aqui quando você os criar'
                    }
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