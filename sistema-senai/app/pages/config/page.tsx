'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../../../utils/cookies'
import { useI18n } from '../../../contexts/I18nContext'
import { useTabState } from '../../../hooks/useTabState'
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
  const { t, setLanguage } = useI18n()
  const [activeTab, setActiveTab] = useState('geral')

  useEffect(() => {
    // Se for técnico ou cliente e a aba ativa for 'criacoes', redireciona para 'geral'
    if ((userType === 'tecnico' || userType === 'cliente') && activeTab === 'criacoes') {
      setActiveTab('geral')
    }
  }, []) // Remove dependencies since userType is not yet declared
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userType, setUserType] = useState<string>('admin')

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (token) {
        const decoded: any = jwtDecode(token)
        const role = (decoded?.role ?? decoded?.userRole ?? '').toString().toLowerCase()
        const mapped = role === 'agent' ? 'tecnico' : role === 'client' ? 'profissional' : 'admin'
        setUserType(mapped)
      }
    } catch {}
  }, [])
  // Estados para configurações
  const [config, setConfig] = useState({
  
    
    
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
    
    // Configurações de geral
    tamanhoFonte: 'medium',
    densidade: 'comfortable',
    animacoes: true,
    modoCompacto: false,
    idioma: 'pt-BR',
    
    // Configurações de Segurança
    autenticacao2FA: false,
    sessaoTimeout: 30,
    historicoLogin: true,
    criptografia: true,
    backupAutomatico: false
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('appConfig', JSON.stringify(config))
      setShowSuccess(true)
      toast.success(t('toasts.saved'))
    } catch (_) {
      toast.error(t('toasts.saveFailed'))
    } finally {
      setIsSaving(false)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    // setTheme não aceita argumentos no hook atual, apenas atualizar config
    setConfig(prev => ({ ...prev, tema: newTheme }))
  }

  const handleResetDefaults = () => {
    const defaults = {
      nomeEmpresa: 'SENAI - Serviço Nacional de Aprendizagem Industrial',
      cnpj: '03.777.341/0001-36',
      endereco: 'Av. Paulista, 1313 - Bela Vista, São Paulo - SP',
      telefoneEmpresa: '(11) 3322-0050',
      emailEmpresa: 'contato@senai.com',
      website: 'www.senai.com.br',
      timezone: 'America/Sao_Paulo',
      idioma: 'pt-BR',
      apiEnabled: true,
      webhookUrl: 'https://api.senai.com/webhook',
      apiKey: 'sk_senai_123456789',
      emailIntegration: true,
      smsIntegration: false,
      whatsappIntegration: false,
      calendarIntegration: true,
      crmIntegration: false,
      emailNotificacoes: true,
      pushNotificacoes: true,
      smsNotificacoes: false,
      notificacoesChamados: true,
      notificacoesRelatorios: true,
      notificacoesManutencao: true,
      notificacoesUsuarios: false,
      tamanhoFonte: 'medium',
      densidade: 'comfortable',
      animacoes: true,
      modoCompacto: false,
      autenticacao2FA: false,
      sessaoTimeout: 30,
      historicoLogin: true,
      criptografia: true,
      backupAutomatico: false
    } as typeof config
    setConfig(defaults)
    toast.info(t('toasts.restoredDefaults'))
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('appConfig')
      if (saved) {
        const parsed = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsed }))
        if (parsed?.tema === 'light' || parsed?.tema === 'dark') {
          // setTheme não aceita argumentos no hook atual
          // Apenas atualizar o config com o tema
        }
      }
    } catch {}
  }, []) // Removido setTheme da dependência para evitar loop infinito

  useEffect(() => {
    const body = document.body
    body.classList.remove('text-sm', 'text-base', 'text-lg')
    switch (config.tamanhoFonte) {
      case 'small':
        body.classList.add('text-sm')
        break
      case 'large':
        body.classList.add('text-lg')
        break
      default:
        break
    }
  }, [config.tamanhoFonte])

  const tabs = [
    ...(userType !== 'tecnico' && userType !== 'profissional'  ? [{ id: 'criacoes', label: t('tabs.creations'), icon: <FaPlus /> }] : []),
    { id: 'geral', label: t('tabs.general'), icon: <FaPalette /> }
  ]

  const { activeTab: syncedActiveTab, setActiveTab: syncSetActiveTab } = useTabState({
    defaultTab: 'geral',
    externalToInternal: { general: 'geral', creations: 'criacoes' },
    internalToExternal: { geral: 'general', criacoes: 'creations' },
    isAllowed: (tab) => {
      if ((userType === 'tecnico' || userType === 'profissional') && tab === 'criacoes') return false
      return ['geral', 'criacoes'].includes(tab)
    }
  })

  useEffect(() => {
    // Atualiza a aba local a partir do sincronizado via URL
    if (activeTab !== syncedActiveTab) setActiveTab(syncedActiveTab)
  }, [syncedActiveTab])

 

  const idiomas = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' }
  ]

  const tamanhosFonte = [
    { value: 'small', label: t('general.fontSize.small') },
    { value: 'medium', label: t('general.fontSize.medium') },
    { value: 'large', label: t('general.fontSize.large') }
  ]

  const densidades = [
    { value: 'compact', label: t('general.interfaceDensity.compact') },
    { value: 'comfortable', label: t('general.interfaceDensity.comfortable') },
    { value: 'spacious', label: t('general.interfaceDensity.spacious') }
  ]

  return (
    <ResponsiveLayout
      userType={userType as "admin" | "profissional" | "tecnico"}
      userName={userType === 'admin' ? "Administrador SENAI" : userType === 'tecnico' ? "Técnico SENAI" : "Profissional SENAI"}
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('settings.title')}
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('settings.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
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
                  {t('buttons.saving')}
                </>
              ) : (
                <>
                  <FaSave />
                  {t('buttons.save')}
                </>
              )}
            </button>
            <button
              onClick={handleResetDefaults}
              className={`${
                theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              } px-4 py-2 rounded-lg`}
            >
              {t('buttons.restoreDefaults')}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheck />
          {t('messages.savedSuccess')}
        </div>
      )}

      {/* Tabs */}
      <div className={`mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => syncSetActiveTab(tab.id)}
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
        
       

        {/* Criações */}
        {activeTab === 'criacoes' && userType !== 'tecnico' && userType !== 'profissional' && (
          <div className="space-y-6" id="creations">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('creations.title')}
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                {t('creations.subtitle')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/pages/called/new" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                  <div className="p-2 rounded-lg bg-red-500/15 text-red-500">
                    <FaClipboardList />
                  </div>
                  <div>
                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                      {t('creations.newTicket.title')}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      {t('creations.newTicket.subtitle')}
                    </div>
                  </div>
                </Link>
                {userType !== 'profissional' && (
                  <Link href="/pages/maintenance/new" className={`${
                    theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                    <div className="p-2 rounded-lg bg-green-500/15 text-red-500">
                      <FaWrench />
                    </div>
                    <div>
                      <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                        {t('creations.newTechnician.title')}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                        {t('creations.newTechnician.subtitle')}
                      </div>
                    </div>
                  </Link>
                )}
                {userType !== 'profissional' && (
                  <Link href="/pages/employees/new" className={`${
                    theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                    <div className="p-2 rounded-lg bg-blue-500/15 text-red-500">
                      <FaUsers />
                    </div>
                    <div>
                      <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                        {t('creations.newEmployee.title')}
                      </div>
                      <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                        {t('creations.newEmployee.subtitle')}
                      </div>
                    </div>
                  </Link>
                )}
                <Link href="/pages/admin/new" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                  <div className="p-2 rounded-lg bg-red-500/15 text-red-500">
                    <FaShield />
                  </div>
                  <div>
                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                      Novo Administrador
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      Criar um novo administrador do sistema
                    </div>
                  </div>
                </Link>
                <Link href="/pages/subcategory" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                  <div className="p-2 rounded-lg bg-pink-500/15 text-red-500">
                    <FaClipboardList />
                  </div>
                  <div>
                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                      {t('creations.subcategories.title')}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      {t('creations.subcategories.subtitle')}
                    </div>
                  </div>
                </Link>

                <Link href="/pages/category" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-colors flex items-start gap-3`}>
                  <div className="p-2 rounded-lg bg-purple-500/15 text-red-500">
                    <FaCogs />
                  </div>
                  <div>
                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>
                      {t('creations.categories.title')}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      {t('creations.categories.subtitle')}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

       

        {/* Configurações de geral */}
        {activeTab === 'geral' && (
          <div className="space-y-6" id="general">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('general.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('general.fontSize.label')}
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
                    {t('general.interfaceDensity.label')}
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

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('general.language.label')}
                  </label>
                  <select
                    value={config.idioma}
                    onChange={(e) => {
                      const value = e.target.value as 'pt-BR' | 'en-US'
                      setConfig(prev => ({ ...prev, idioma: value }))
                      setLanguage(value)
                    }}
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

            <div
              className={`mt-6 rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-gray-900/40 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    theme === 'dark' ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <FaKey />
                </div>
                <div className="flex-1">
                  <h4 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>{t('security.resetPassword.title')}</h4>
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('security.resetPassword.subtitle')}</p>
                  <div className="mt-3">
                    <a
                      href="/pages/auth/reset-password"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
                        theme === 'dark'
                          ? 'bg-red-600/90 hover:bg-red-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      <FaKey />
                      {t('buttons.resetPassword')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}

// Code that was outside the component has been removed
