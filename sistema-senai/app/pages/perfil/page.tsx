'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
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
  FaTwitter
} from 'react-icons/fa'

export default function PerfilPage() {
  const { theme } = useTheme()
  const router = useRouter()
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
    certificacoes: [] as {nome: string, data: string, validade: string}[],
    projetos: [] as {nome: string, status: string, data: string}[]
  })

  const [formData, setFormData] = useState({ ...userData })

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
          ],
          projetos: [
            { nome: 'Migração para Cloud', status: 'Concluído', data: '2023-12-01' },
            { nome: 'Implementação do Sistema SENAI', status: 'Em Andamento', data: '2024-01-15' },
            { nome: 'Treinamento de Usuários', status: 'Concluído', data: '2024-02-20' }
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
          ],
          projetos: [
            { nome: 'Migração para Cloud', status: 'Concluído', data: '2023-12-01' },
            { nome: 'Implementação do Sistema SENAI', status: 'Em Andamento', data: '2024-01-15' },
            { nome: 'Treinamento de Usuários', status: 'Concluído', data: '2024-02-20' }
          ]
        }
        setUserData(defaultData)
        setFormData(defaultData)
      })
    }
  }, [router, user, isLoading, isAuthenticated])

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

  // Definir as abas disponíveis com base no tipo de usuário
  const tabs = userType === 'admin' 
    ? [
        { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
        { id: 'atividades', label: 'Atividades', icon: <FaHistory /> }
      ]
    : [
        { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
        { id: 'atividades', label: 'Atividades', icon: <FaHistory /> },
        { id: 'projetos', label: 'Projetos', icon: <FaBriefcase /> }
      ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'Em Andamento':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'Pendente':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
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
              Meu Perfil
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie suas informações pessoais e profissionais
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
                  Cancelar
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
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Salvar
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
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheck />
          Perfil atualizado com sucesso!
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
                Informações Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome Completo
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
                    Email
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
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.telefone : userData.telefone}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={userType === 'admin' ? 'Adicione seu telefone aqui' : ''}
                    className={`w-full px-4 py-2 rounded-lg border ${
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
                        Departamento
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
                        Endereço
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
                    Biografia
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
                    Habilidades
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
                Atividades Recentes
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <FaClipboardList className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Novo chamado criado
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Chamado #2024-001 - Manutenção preventiva
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Há 2 horas
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-green-600' : 'bg-green-500'
                    }`}>
                      <FaCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Chamado concluído
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Chamado #2024-002 - Reparo de equipamento
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Há 1 dia
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-500'
                    }`}>
                      <FaUsers className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Novo usuário registrado
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Maria Silva - Técnica de Manutenção
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Há 2 dias
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

       

        {/* Projetos */}
        {activeTab === 'projetos' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Projetos Participados
              </h3>
              
              <div className="space-y-4">
                {userData.projetos.map((projeto, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {projeto.nome}
                        </h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          Iniciado em: {new Date(projeto.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(projeto.status)}`}>
                        {projeto.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  ) 
}