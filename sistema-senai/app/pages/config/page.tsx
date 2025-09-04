'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '../../../hooks/useTheme'
import { useI18n } from '../../../contexts/I18nContext'
import ResponsiveLayout from '../../../components/responsive-layout'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../../../utils/cookies'
import { useSupabase } from '../../../hooks/useSupabase'
import Input, { PasswordInput } from '../../../components/ui/input'
import {
  FaCog,
  FaUser,
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaLanguage,
  FaSave,
  FaUndo,
  FaCheck,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaDatabase,
  FaServer,
  FaNetworkWired,
  FaCloud,
  FaLock,
  FaUnlock,
  FaTrash,
  FaDownload,
  FaUpload,
  FaSync,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaHistory,
  FaFileAlt,
  FaLink,
  FaExternalLinkAlt,
  FaCopy,
  FaEdit,
  FaPlus,
  FaMinus,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaFilter,
  FaSort,
  FaStar,
  FaHeart,
  FaBookmark,
  FaShare,
  FaPrint,
  FaQrcode,
  FaBarcode,
  FaCreditCard,
  FaPaypal,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaClipboardList,
  FaWrench,
  FaCogs,
  FaMobile
} from 'react-icons/fa'

function ConfigPageContent() {
  const { theme } = useTheme()
  const { t, setLanguage: setI18nLanguage } = useI18n()
  const searchParams = useSearchParams()
  const supabase = useSupabase()
  const [activeTab, setActiveTab] = useState('geral')
  const [userType, setUserType] = useState<'admin' | 'tecnico' | 'profissional'>('admin')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [language, setLanguage] = useState('pt-BR')

  // Estados para alterar senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Estados para 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsSent, setSmsSent] = useState(false)

  // Detectar tipo de usuário baseado no token
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
    
    // Security Settings
    autenticacao2FA: false,
    sessaoTimeout: 30,
    historicoLogin: true,
    criptografia: true,
    backupAutomatico: false
  })

  // Consolidar todos os useEffects em um só
  useEffect(() => {
    // Carregar configurações salvas
    try {
      const saved = localStorage.getItem('appConfig')
      if (saved) {
        const parsed = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }

    // Carregar tipo de usuário
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (token) {
        const decoded: any = jwtDecode(token)
        const role = (decoded?.role ?? decoded?.userRole ?? '').toString().toLowerCase()
        const mapped = role === 'agent' ? 'tecnico' : role === 'client' ? 'profissional' : 'admin'
        setUserType(mapped)
        
        // Se for técnico ou profissional, forçar aba geral
        if (mapped !== 'admin') {
          setActiveTab('geral')
        }
      }
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
    }
  }, [])

  // Efeito para sincronizar com mudanças na URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl === 'creations' && userType === 'admin') {
      setActiveTab('criacoes')
    } else if (tabFromUrl === 'general') {
      setActiveTab('geral')
    }
  }, [searchParams, userType])

  // Efeito separado para aplicar tamanho da fonte
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

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try { 
      console.log('💾 Iniciando salvamento das configurações...')
      
      // Salvar configurações gerais no localStorage
      localStorage.setItem('appConfig', JSON.stringify(config))
      console.log('✅ Configurações gerais salvas no localStorage')
      
      // Salvar configurações de 2FA no backend
      if (supabase) {
        const token = authCookies.getToken()
        if (token) {
          try {
            const decoded: any = jwtDecode(token)
            const userId = decoded.userId || decoded.user_id
            
            console.log('🔐 Salvando configurações 2FA:', {
              userId,
              twoFactorEnabled,
              phoneNumber
            })
            
            // Atualizar configurações de 2FA no banco de dados
            const response = await fetch('/user/update-2fa', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                userId: userId,
                twoFactorEnabled: twoFactorEnabled,
                phoneNumber: phoneNumber
              })
            })

            console.log('🔐 Resposta do backend:', response.status, response.statusText)

            if (response.ok) {
              const responseData = await response.json()
              console.log('✅ Configurações 2FA salvas:', responseData)
              toast.success('Configurações salvas com sucesso!')
            } else {
              const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
              console.error('❌ Erro ao salvar 2FA:', response.status, errorData)
              toast.error('Erro ao salvar configurações 2FA: ' + (errorData.message || 'Erro desconhecido'))
            }
          } catch (error) {
            console.error('❌ Erro ao salvar 2FA:', error)
            toast.error('Erro ao salvar configurações 2FA')
          }
        } else {
          console.error('❌ Token não encontrado')
          toast.error('Erro de autenticação')
        }
      } else {
        console.error('❌ Supabase não disponível')
        toast.error('Erro de conexão com o sistema')
      }
      
      setShowSuccess(true)
      toast.success(t('toasts.saved'))
    } catch (error) {
      console.error('❌ Erro geral no salvamento:', error)
      toast.error(t('toasts.saveFailed'))
    } finally {
      setIsSaving(false)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }, [config, t, supabase, twoFactorEnabled, phoneNumber])

  const handleThemeChange = useCallback((newTheme: string) => {
    setConfig(prev => ({ ...prev, tema: newTheme }))
  }, [])

  const handleResetDefaults = useCallback(() => {
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
  }, [t])

  const handleLanguageChange = useCallback((value: 'pt-BR' | 'en-US') => {
    setConfig(prev => ({ ...prev, idioma: value }))
    setLanguage(value)
    setI18nLanguage(value)
  }, [setLanguage, setI18nLanguage])

  // Função para alterar senha
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    setIsChangingPassword(true)
    try {
      const token = authCookies.getToken()
      if (!token) {
        toast.error('Erro de autenticação')
        return
      }

      const response = await fetch('/user/me/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Erro ao alterar senha')
      } else {
        toast.success('Senha alterada com sucesso!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordModal(false)
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Função para configurar 2FA
  const handleSetupTwoFactor = async () => {
    if (!phoneNumber) {
      toast.error('Digite um número de telefone')
      return
    }

    setTwoFactorLoading(true)
    try {
      if (!supabase) {
        toast.error('Erro de conexão com o sistema')
        return
      }

      // Usar a API correta do Supabase para SMS
      const { data, error } = await supabase!.auth.signInWithOtp({
        phone: phoneNumber
      })

      if (error) {
        toast.error('Erro ao enviar SMS: ' + error.message)
      } else {
        setSmsSent(true)
        toast.success('Código SMS enviado para ' + phoneNumber)
      }
    } catch (error) {
      toast.error('Erro ao configurar 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Função para verificar código 2FA
  const handleVerifyTwoFactor = async () => {
    if (!verificationCode) {
      toast.error('Digite o código de verificação')
      return
    }

    setTwoFactorLoading(true)
    try {
      if (!supabase) {
        toast.error('Erro de conexão com o sistema')
        return
      }

      console.log('🔐 Verificando código 2FA:', { phoneNumber, verificationCode })

      // Verificar o código SMS
      const { data, error } = await supabase!.auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: 'sms'
      })

      console.log('🔐 Resposta da verificação:', { data, error })

      if (error) {
        console.error('❌ Erro na verificação:', error)
        toast.error('Código inválido: ' + error.message)
      } else {
        console.log('✅ Verificação bem-sucedida, salvando configurações...')
        
        // Salvar configurações de 2FA no backend
        const token = authCookies.getToken()
        if (token) {
          try {
            const decoded: any = jwtDecode(token)
            const userId = decoded.userId || decoded.user_id
            
            const response = await fetch('/user/update-2fa', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                userId: userId,
                twoFactorEnabled: true,
                phoneNumber: phoneNumber
              })
            })

            console.log('🔐 Resposta do backend:', response.status)

            if (response.ok) {
              setTwoFactorEnabled(true)
              setSmsSent(false)
              setVerificationCode('')
              toast.success('2FA configurado com sucesso!')
            } else {
              const errorData = await response.json()
              console.error('❌ Erro ao salvar 2FA:', errorData)
              toast.error('Erro ao salvar configurações: ' + (errorData.message || 'Erro desconhecido'))
            }
          } catch (saveError) {
            console.error('❌ Erro ao salvar 2FA:', saveError)
            toast.error('Erro ao salvar configurações de 2FA')
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Erro geral na verificação:', error)
      toast.error('Erro ao verificar código: ' + error.message)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Função para reenviar SMS
  const handleResendSMS = async () => {
    setTwoFactorLoading(true)
    try {
      if (!supabase) {
        toast.error('Erro de conexão com o sistema')
        return
      }

      // Reenviar SMS usando a mesma API
      const { data, error } = await supabase!.auth.signInWithOtp({
        phone: phoneNumber
      })

      if (error) {
        toast.error('Erro ao reenviar SMS: ' + error.message)
      } else {
        toast.success('SMS reenviado para ' + phoneNumber)
      }
    } catch (error) {
      toast.error('Erro ao reenviar SMS')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Função para trocar aba e atualizar URL
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href)
    if (tabId === 'criacoes') {
      url.searchParams.set('tab', 'creations')
    } else if (tabId === 'geral') {
      url.searchParams.set('tab', 'general')
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Memoizar opções para evitar re-renderizações
  const idiomas = useMemo(() => [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' }
  ], [])

  const tamanhosFonte = useMemo(() => [
    { value: 'small', label: t('general.fontSize.small') },
    { value: 'medium', label: t('general.fontSize.medium') },
    { value: 'large', label: t('general.fontSize.large') }
  ], [t])

  const densidades = useMemo(() => [
    { value: 'compact', label: t('general.interfaceDensity.compact') },
    { value: 'comfortable', label: t('general.interfaceDensity.comfortable') },
    { value: 'spacious', label: t('general.interfaceDensity.spacious') }
  ], [t])

  const tabs = useMemo(() => [
    { id: 'geral', label: t('tabs.general'), icon: <FaCog /> },
    ...(userType === 'admin' ? [{ id: 'criacoes', label: t('tabs.creations'), icon: <FaClipboardList /> }] : []),
  ], [t, userType])

  // Carregar configurações de 2FA do usuário
  const loadTwoFactorSettings = useCallback(async () => {
    console.log('🔄 Carregando configurações 2FA...')
    
    if (supabase) {
      const token = authCookies.getToken()
      if (token) {
        try {
          const decoded: any = jwtDecode(token)
          const userId = decoded.userId || decoded.user_id
          
          console.log('🔍 Buscando configurações para usuário:', userId)
          
          // Buscar configurações de 2FA do usuário
          const response = await fetch(`/user/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          console.log('📡 Resposta da API:', response.status)

          if (response.ok) {
            const userData = await response.json()
            console.log('📊 Dados do usuário:', userData)
            
            const twoFactorEnabled = userData.two_factor_enabled || false
            const phoneNumber = userData.phone || ""
            
            console.log('🔐 Configurações 2FA carregadas:', {
              twoFactorEnabled,
              phoneNumber
            })
            
            setTwoFactorEnabled(twoFactorEnabled)
            setPhoneNumber(phoneNumber)
          } else {
            console.error('❌ Erro ao carregar dados do usuário:', response.status)
          }
        } catch (error) {
          console.error('❌ Erro ao carregar configurações 2FA:', error)
        }
      } else {
        console.log('⚠️ Token não encontrado')
      }
    } else {
      console.log('⚠️ Supabase não disponível')
    }
  }, [supabase])

  useEffect(() => {
    loadTwoFactorSettings()
  }, [loadTwoFactorSettings])

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-16 lg:py-4">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('settings.title')}
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('settings.subtitle')}
            </p>
          </div>
          
          {/* Botões de ação - apenas para administradores */}
          <div className={`flex flex-wrap gap-3 w-full md:w-auto ${userType === 'admin' ? '' : 'hidden'}`}>
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

      {/* Botões de ação flutuantes para usuários não-admin em mobile */}
      {userType !== 'admin' && (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden">
          <div className="flex gap-3">
            <button
              onClick={handleResetDefaults}
              className={`px-4 py-3 rounded-lg shadow-lg ${
                theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {t('buttons.restoreDefaults')}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${userType !== 'admin' ? 'mb-24 md:mb-0' : ''}`}>
        
        {/* Criações */}
        {activeTab === 'criacoes' && userType === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200" id="creations">
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
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
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
                <Link href="/pages/maintenance/new" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
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
                <Link href="/pages/employees/new" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
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
                <Link href="/pages/admin/new" className={`${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
                  <div className="p-2 rounded-lg bg-red-500/15 text-red-500">
                    <FaShieldAlt />
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
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
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
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200 hover:shadow-md flex items-start gap-3`}>
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
          <div className="space-y-6 animate-in fade-in duration-200" id="general">
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
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
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
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
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
                    onChange={(e) => handleLanguageChange(e.target.value as 'pt-BR' | 'en-US')}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
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
              className={`mt-6 rounded-xl border p-5 transition-all duration-200 ${
                theme === 'dark' ? 'bg-gray-900/40 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('security.title')}
              </h3>
              
              {/* Alterar Senha */}
              <div className="mb-6">
                <h4 className={`text-md font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('security.changePassword.title')}
                </h4>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('security.changePassword.button')}
                </button>
              </div>

             
              

          
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alterar Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl max-w-md w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('security.changePassword.title')}
            </h3>
            
            <div className="space-y-4">
              <PasswordInput
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder={t('security.changePassword.currentPassword')}
                showPassword={showPasswords.current}
                onTogglePassword={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                icon={<FaLock className="text-gray-400" />}
              />
              <PasswordInput
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t('security.changePassword.newPassword')}
                showPassword={showPasswords.new}
                onTogglePassword={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                icon={<FaLock className="text-gray-400" />}
              />
              <PasswordInput
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t('security.changePassword.confirmPassword')}
                showPassword={showPasswords.confirm}
                onTogglePassword={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                icon={<FaLock className="text-gray-400" />}
              />
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isChangingPassword ? t('security.changePassword.changing') : t('security.changePassword.button')}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {t('security.changePassword.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}

export default function ConfigPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfigPageContent />
    </Suspense>
  )
}