'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import {
  FaCog,
  FaUser,
  FaBell,
  FaPalette,
  FaShieldAlt,
  FaSave,
  FaTimes,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
  FaGlobe,
  FaLanguage,
  FaClock,
  FaCalendarAlt,
  FaFileAlt,
  FaDownload,
  FaUpload,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaInfoCircle,
  FaQuestionCircle,
  FaHistory,
  FaChartBar,
  FaUsers,
  FaTools,
  FaClipboardList,
  FaWrench,
  FaGraduationCap,
  FaShieldAlt as FaShield,
  FaBriefcase,
  FaHeart,
  FaThumbsUp,
  FaComments,
  FaFileExport,
  FaFileImport,
  FaCogs,
  FaEquals
} from 'react-icons/fa'

export default function ConfigPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('geral')

  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Estados para configurações
  const [config, setConfig] = useState({
    // Configurações Gerais
    nomeEmpresa: 'SENAI - Serviço Nacional de Aprendizagem Industrial',
    cnpj: '03.777.341/0001-36',
    endereco: 'Av. Paulista, 1313 - Bela Vista, São Paulo - SP',
    telefoneEmpresa: '(11) 3322-0050',
    emailEmpresa: 'contato@senai.com',
    website: 'www.senai.com.br',
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR',
    
    // Configurações de Integrações
    apiEnabled: true,
    webhookUrl: 'https://api.senai.com/webhook',
    apiKey: 'sk_senai_123456789',
    emailIntegration: true,
    smsIntegration: false,
    whatsappIntegration: false,
    calendarIntegration: true,
    crmIntegration: false,
    
    // Configurações de Notificações
    emailNotificacoes: true,
    pushNotificacoes: true,
    smsNotificacoes: false,
    notificacoesChamados: true,
    notificacoesRelatorios: true,
    notificacoesManutencao: true,
    notificacoesUsuarios: false,
    
    // Configurações de Aparência
    tema: theme,
    tamanhoFonte: 'medium',
    densidade: 'comfortable',
    animacoes: true,
    modoCompacto: false,
    
    // Configurações de Segurança
    autenticacao2FA: false,
    sessaoTimeout: 30,
    historicoLogin: true,
    criptografia: true
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark')
    setConfig(prev => ({ ...prev, tema: newTheme }))
  }

  const tabs = [
    { id: 'geral', label: 'Geral', icon: <FaCog /> },
    { id: 'integracoes', label: 'Integrações', icon: <FaGlobe /> },
    { id: 'notificacoes', label: 'Notificações', icon: <FaBell /> },
    { id: 'aparencia', label: 'Aparência', icon: <FaPalette /> },
    { id: 'seguranca', label: 'Segurança', icon: <FaShieldAlt /> }
  ]

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Belem', label: 'Belém (GMT-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' }
  ]

  const idiomas = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' }
  ]

  const tamanhosFonte = [
    { value: 'small', label: 'Pequeno' },
    { value: 'medium', label: 'Médio' },
    { value: 'large', label: 'Grande' }
  ]

  const densidades = [
    { value: 'compact', label: 'Compacto' },
    { value: 'comfortable', label: 'Confortável' },
    { value: 'spacious', label: 'Espaçoso' }
  ]

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={5}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Configurações
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie as configurações do sistema e seu perfil
            </p>
          </div>
          
          <div className="flex gap-3">
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
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheck />
          Configurações salvas com sucesso!
        </div>
      )}

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
        
        {/* Configurações Gerais */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Informações da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={config.nomeEmpresa}
                    onChange={(e) => setConfig(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={config.cnpj}
                    onChange={(e) => setConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={config.endereco}
                    onChange={(e) => setConfig(prev => ({ ...prev, endereco: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={config.telefoneEmpresa}
                    onChange={(e) => setConfig(prev => ({ ...prev, telefoneEmpresa: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.emailEmpresa}
                    onChange={(e) => setConfig(prev => ({ ...prev, emailEmpresa: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={config.website}
                    onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Configurações do Sistema
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fuso Horário
                  </label>
                  <select
                    value={config.timezone}
                    onChange={(e) => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Idioma
                  </label>
                  <select
                    value={config.idioma}
                    onChange={(e) => setConfig(prev => ({ ...prev, idioma: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  >
                    {idiomas.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de Integrações */}
        {activeTab === 'integracoes' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                API e Webhooks
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        API REST
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Habilitar acesso via API para integrações externas
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.apiEnabled}
                        onChange={(e) => setConfig(prev => ({ ...prev, apiEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://api.senai.com/webhook"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Chave da API
                    </label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Integrações de Comunicação
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Selecione as integrações que deseja habilitar
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.emailIntegration}
                        onChange={(e) => setConfig(prev => ({ ...prev, emailIntegration: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Integração com Email (SMTP)
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.smsIntegration}
                        onChange={(e) => setConfig(prev => ({ ...prev, smsIntegration: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Integração com SMS
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.whatsappIntegration}
                        onChange={(e) => setConfig(prev => ({ ...prev, whatsappIntegration: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Integração com WhatsApp Business
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.calendarIntegration}
                        onChange={(e) => setConfig(prev => ({ ...prev, calendarIntegration: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Integração com Google Calendar
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.crmIntegration}
                        onChange={(e) => setConfig(prev => ({ ...prev, crmIntegration: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Integração com CRM
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Testar Integrações
              </h3>
              
              <div className="flex gap-3">
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  <FaGlobe />
                  Testar API
                </button>
                
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}>
                  <FaEnvelope />
                  Testar Email
                </button>
                
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}>
                  <FaPhone />
                  Testar SMS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de Notificações */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Preferências de Notificação
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Canais de Notificação
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.emailNotificacoes}
                        onChange={(e) => setConfig(prev => ({ ...prev, emailNotificacoes: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Notificações por Email
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.pushNotificacoes}
                        onChange={(e) => setConfig(prev => ({ ...prev, pushNotificacoes: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Notificações Push
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.smsNotificacoes}
                        onChange={(e) => setConfig(prev => ({ ...prev, smsNotificacoes: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Notificações por SMS
                      </span>
                    </label>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Tipos de Notificação
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notificacoesChamados}
                        onChange={(e) => setConfig(prev => ({ ...prev, notificacoesChamados: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Novos chamados de manutenção
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notificacoesRelatorios}
                        onChange={(e) => setConfig(prev => ({ ...prev, notificacoesRelatorios: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Relatórios disponíveis
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notificacoesManutencao}
                        onChange={(e) => setConfig(prev => ({ ...prev, notificacoesManutencao: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Atualizações de manutenção
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notificacoesUsuarios}
                        onChange={(e) => setConfig(prev => ({ ...prev, notificacoesUsuarios: e.target.checked }))}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Atividades de usuários
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de Aparência */}
        {activeTab === 'aparencia' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Personalização da Interface
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tema
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tema"
                        value="light"
                        checked={config.tema === 'light'}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Claro
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tema"
                        value="dark"
                        checked={config.tema === 'dark'}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                      />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Escuro
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tamanho da Fonte
                  </label>
                  <select
                    value={config.tamanhoFonte}
                    onChange={(e) => setConfig(prev => ({ ...prev, tamanhoFonte: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  >
                    {tamanhosFonte.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Densidade da Interface
                  </label>
                  <select
                    value={config.densidade}
                    onChange={(e) => setConfig(prev => ({ ...prev, densidade: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  >
                    {densidades.map(density => (
                      <option key={density.value} value={density.value}>
                        {density.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Comportamento
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.animacoes}
                    onChange={(e) => setConfig(prev => ({ ...prev, animacoes: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Habilitar animações
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.modoCompacto}
                    onChange={(e) => setConfig(prev => ({ ...prev, modoCompacto: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Modo compacto
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de Segurança */}
        {activeTab === 'seguranca' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Autenticação e Segurança
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Autenticação de Dois Fatores (2FA)
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autenticacao2FA}
                        onChange={(e) => setConfig(prev => ({ ...prev, autenticacao2FA: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Timeout da Sessão
                    </h4>
                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tempo de inatividade antes do logout automático
                    </p>
                    <select
                      value={config.sessaoTimeout}
                      onChange={(e) => setConfig(prev => ({ ...prev, sessaoTimeout: parseInt(e.target.value) }))}
                      className={`px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                      <option value={0}>Nunca</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Privacidade e Dados
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.historicoLogin}
                    onChange={(e) => setConfig(prev => ({ ...prev, historicoLogin: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Manter histórico de login
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.backupAutomatico}
                    onChange={(e) => setConfig(prev => ({ ...prev, backupAutomatico: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Backup automático dos dados
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.criptografia}
                    onChange={(e) => setConfig(prev => ({ ...prev, criptografia: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Criptografia de dados sensíveis
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}
