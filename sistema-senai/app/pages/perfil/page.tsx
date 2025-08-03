'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
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
  const [activeTab, setActiveTab] = useState('perfil')
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Dados do usuário
  const [userData, setUserData] = useState({
    nome: 'João Silva Santos',
    email: 'joao.silva@senai.com',
    telefone: '(11) 99999-8888',
    cargo: 'Administrador do Sistema',
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
  })

  const [formData, setFormData] = useState({ ...userData })

  const handleSave = async () => {
    setIsSaving(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setUserData(formData)
    setIsSaving(false)
    setShowSuccess(true)
    setIsEditing(false)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCancel = () => {
    setFormData({ ...userData })
    setIsEditing(false)
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <FaUser /> },
    { id: 'atividades', label: 'Atividades', icon: <FaHistory /> },
    { id: 'certificacoes', label: 'Certificações', icon: <FaCertificate /> },
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

  return (
    <ResponsiveLayout
      userType="admin"
      userName="João Silva Santos"
      userEmail="joao.silva@senai.com"
      notifications={5}
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

      {/* Profile Header */}
      <div className={`rounded-xl p-6 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <img 
                src={userData.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <button className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
            } hover:bg-gray-500 transition-colors`}>
              <FaCamera className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {userData.nome}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                Administrador
              </span>
            </div>
            
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
              {userData.cargo}
            </p>
            
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              {userData.departamento} • Matrícula: {userData.matricula}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <FaEnvelope className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {userData.email}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <FaPhone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {userData.telefone}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <FaCalendarAlt className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Admissão: {new Date(userData.dataAdmissao).toLocaleDateString('pt-BR')}
                </span>
              </div>
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
              </div>
            </div>

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

        {/* Certificações */}
        {activeTab === 'certificacoes' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Certificações Profissionais
              </h3>
              
              <div className="space-y-4">
                {userData.certificacoes.map((cert, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {cert.nome}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <FaCalendarAlt className="inline w-3 h-3 mr-1" />
                            Obtida: {new Date(cert.data).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <FaCertificate className="inline w-3 h-3 mr-1" />
                            Válida até: {new Date(cert.validade).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                      }`}>
                        Válida
                      </div>
                    </div>
                  </div>
                ))}
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