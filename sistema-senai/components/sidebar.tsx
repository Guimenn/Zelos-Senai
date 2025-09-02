'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { authCookies } from '../utils/cookies'
import MobileNavbar from './mobile-navbar'
import {
  FaHome,
  FaPalette, 
  FaTachometerAlt,
  FaWrench,
  FaClipboardList,
  FaUsers,
  FaCog,
  FaChartBar,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaGraduationCap,
  FaShieldAlt,
  FaTools,
  FaClipboardCheck,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUserCog,
  FaCogs,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa'
import Logo from './logo'
import { useTheme } from '../hooks/useTheme'
import { useSidebar } from '../contexts/SidebarContext'
import NotificationModal from './notification-modal'
import { useI18n } from '../contexts/I18nContext'



interface SidebarProps {
  userType?: 'admin' | 'profissional' | 'tecnico'
  userName?: string
  userEmail?: string
  notifications?: number
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  subItems?: Omit<MenuItem, 'subItems'>[]
}

function SidebarContent({ 
  userType = 'admin', 
  userName,
  userEmail,
  notifications = 0
}: SidebarProps) {
  const { t } = useI18n()
  const { isCollapsed, setIsCollapsed, toggleSidebar, isMobile } = useSidebar()
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>(userName || '')
  const [displayEmail, setDisplayEmail] = useState<string>(userEmail || '')

  // Debug logs
  useEffect(() => {
    console.log('Sidebar - isMobile:', isMobile, 'isNotificationModalOpen:', isNotificationModalOpen)
  }, [isMobile, isNotificationModalOpen])

  useEffect(() => {
    setIsMounted(true)
    
    // Buscar dados do usuário incluindo avatar
    const fetchUserData = async () => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) return
        
        const response = await fetch('/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUserAvatar(userData.avatar)
          setDisplayName(userData.name || userName || '')
          setDisplayEmail(userData.email || userEmail || '')
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
      }
    }
    
    fetchUserData()

    // Atualiza quando o perfil for salvo/atualizado em outra tela
    const onProfileUpdated = () => fetchUserData()
    const onFocus = () => fetchUserData()
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchUserData() }

    window.addEventListener('profile-updated', onProfileUpdated)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('profile-updated', onProfileUpdated)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function fetchUnread() {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) return
        const res = await fetch('/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (active && typeof data?.unread_count === 'number') {
          setUnreadCount(data.unread_count)
        }
      } catch {}
    }

    fetchUnread()

    // Atualiza ao trocar de rota (ex.: após marcar notificações como lidas)
    // Também poderíamos usar um intervalo, mas mantemos simples e eficiente
    return () => {
      active = false
      controller.abort()
    }
  }, [pathname])

  const handleLogout = () => {
    authCookies.removeToken();
    router.push('/pages/auth/login');
  };

  // Estilos padronizados
  const itemBase = 'group flex items-center rounded-xl text-sm font-medium transition-colors duration-200';
  const itemPadding = 'px-3 py-2.5';
  const itemInactive = theme === 'dark'
    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100';
  const itemActive = 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-white border border-red-400/30';

  const subItemPadding = 'px-3 py-2';
  const subItemInactive = theme === 'dark'
    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
  const subItemActive = 'bg-gradient-to-r from-red-500/10 to-red-600/10 text-white border border-red-400/20';

  const iconBtnBase = 'w-10 h-10 rounded-xl flex items-center justify-center transition-colors';
  const iconBtnNeutral = theme === 'dark'
    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  const iconBtnDanger = theme === 'dark'
    ? 'bg-red-900/20 hover:bg-red-900/30 text-red-300'
    : 'bg-red-50 hover:bg-red-100 text-red-600';

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case 'admin':
        return {
          label: t('roles.administrator'),
          icon: <FaShieldAlt className="text-red-400" />,
          color: 'from-red-500 to-red-600',
          bgColor: 'bg-red-500/10'
        }
      case 'profissional':
        return {
          label: 'Profissional',
          icon: <FaGraduationCap className="text-blue-400" />,
          color: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-500/10'
        }
      case 'tecnico':
        return {
          label: 'Técnico',
          icon: <FaTools className="text-green-400" />,
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-500/10'
        }
      default:
        return {
          label: 'Usuário',
          icon: <FaUser className="text-gray-400" />,
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-500/10'
        }
    }
  }

  const normalizedUserType = typeof userType === 'string' ? userType.toLowerCase() : 'admin';
  const userTypeInfo = getUserTypeInfo(normalizedUserType)

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: t('nav.home') || 'Início',
      icon: <FaHome />,
      href: normalizedUserType === 'tecnico' ? '/pages/agent/home' : 
            normalizedUserType === 'profissional' ? '/pages/client/home' : '/pages/home'
    },
    {
      id: 'chamados',
      label: t('nav.tickets') || 'Chamados',
      icon: <FaClipboardList />,
      href: '/pages/called',
      subItems: normalizedUserType === 'tecnico' ? [
        {
          id: 'historico',
          label: t('nav.history') || 'Histórico',
          icon: <FaHistory />,
          href: '/pages/called/history'
        }
      ] : [
        {
          id: 'novos-chamados',
          label: t('nav.newTickets') || 'Novos Chamados',
          icon: <FaExclamationTriangle />,
          href: '/pages/called/new'
        },
        {
          id: 'historico',
          label: t('nav.history') || 'Histórico',
          icon: <FaHistory />,
          href: '/pages/called/history'
        }
      ]
    },
    {
      id: 'maintenance',
      label: t('nav.technicians') || 'Técnicos',
      icon: <FaWrench />,
      href: '/pages/maintenance'
    },
    {
      id: 'employees',
      label: t('nav.employees') || 'Colaboradores',
      icon: <FaUsers />,
      href: '/pages/employees'
    },
    // Apenas Admin: página de administradores
    ...(normalizedUserType === 'admin' ? [{
      id: 'admins',
      label: t('nav.admins'),
      icon: <FaShieldAlt />,
      href: '/pages/admin/list'
    }] : []),
    // Esconde "Relatórios" para usuários colaboradores
    ...(normalizedUserType !== 'profissional' ? [{
      id: 'relatorios',
      label: t('nav.reports') || 'Relatórios',
      icon: <FaChartBar />,
      href: '/pages/reports'
    }] : []),

    {
      id: 'config',
      label: t('nav.settings') || 'Configurações',
      icon: <FaCog />,
      href: '/pages/config',
      // Se for técnico ou profissional, não mostra subitens
      ...(normalizedUserType === 'tecnico' || normalizedUserType === 'profissional'
        ? {}
        : {
            subItems: [
              {
                id: 'creations',
                label: t('tabs.creations'),
                icon: <FaCogs />,
                href: '/pages/config?tab=creations'
              },
              {
                id: 'general',
                label: t('tabs.general'),
                icon: <FaPalette />,
                href: '/pages/config?tab=general'
              },
            ]
          })
    }
  ]

  const getPathFromHref = (href: string) => href.split('?')[0]
  const getParamsFromHref = (href: string) => new URLSearchParams(href.split('?')[1] || '')

  const isActive = (href: string) => {
    const hrefPath = getPathFromHref(href)
    if (pathname !== hrefPath) return false
    const hrefParams = getParamsFromHref(href)
    let paramsMatch = true
    hrefParams.forEach((value, key) => {
      if (searchParams.get(key) !== value) {
        paramsMatch = false
      }
    })
    return paramsMatch
  }

  const isSubmenuActive = (item: MenuItem) => {
    return item.subItems?.some(subItem => isActive(subItem.href)) || false
  }

  const toggleSubmenu = (itemId: string) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId)
    
    // Haptic feedback para dispositivos móveis
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
  }

  // Se for mobile, renderiza o navbar móvel
  if (isMobile) {
    return (
      <MobileNavbar
        userType={userType}
        userName={userName}
        notifications={notifications}
      />
    )
  }

  return (
    <div className={`
      fixed left-0 top-0 h-full z-50 sidebar-transition
      ${isCollapsed ? 'w-16' : 'w-64'}
      ${theme === 'dark' 
        ? 'bg-gray-900 shadow-lg border-r border-gray-700' 
        : 'bg-gray-50 shadow-lg border-r border-gray-200'
      }
    `}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
           <a href={normalizedUserType === 'tecnico' ? '/pages/agent/home' : '/pages/home'} title={t('nav.home') || 'Início'} className='flex flex-col items-center mx-auto space-x-3'>
            <div className="flex flex-col items-center mx-auto space-x-3 ">
              <Logo size="md" showBackground={false} className="mx-auto" />
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('app.name') || 'Sistema de Chamados'}
              </p>
            </div>
            </a>
           
           
          )}
          <button
            onClick={toggleSidebar}
            className={`w-8 h-8 rounded-lg flex items-center justify-center sidebar-hover ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <div className={`sidebar-transition ${
              isCollapsed ? 'rotate-180' : 'rotate-0'
            }`}>
              <FaChevronLeft className="text-sm" />
            </div>
          </button>
        </div>
      </div>

     

      {/* Seção do Perfil do Usuário */}
      <div className={`p-4 border-b overflow-hidden sidebar-transition ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      } ${isCollapsed ? 'h-0 p-0 opacity-0' : 'h-auto opacity-100'}`}>
        
        <a
          href="/pages/perfil"
          className={`
            group flex items-center w-full p-3 rounded-xl transition-all duration-200
            ${theme === 'dark'
              ? 'hover:bg-gray-700/50'
              : 'hover:bg-gray-100'
            }
          `}
          title="Ir para o perfil"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-800'
          }`}>
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName || 'Usuário'} 
                className="w-full h-full object-cover"
                onError={() => setUserAvatar(null)}
              />
            ) : (
              <FaUser className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {isMounted ? (
              <>
                <div className={`font-light text-[.8rem] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {displayName || userName}
                </div>
                <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {displayEmail || userEmail}
                </div>
                <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('profile.title')}
                </div>
              </>
            ) : (
              <div className="h-10 flex items-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>Carregando…</span>
              </div>
            )}
          </div>
          
          <FaChevronRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`} />
        </a>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`px-3 space-y-1 sidebar-transition ${
          isCollapsed ? 'px-1' : 'px-3'
        }`}>
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                href={item.href}
                className={`${itemBase} ${itemPadding} sidebar-hover ${
                  isActive(item.href) || isSubmenuActive(item) ? itemActive : itemInactive
                }`}
              >
                                  <div className="flex items-center justify-center w-5 h-5 mr-3 sidebar-transition-fast">
                    {item.icon}
                  </div>
                  <div className={`sidebar-transition overflow-hidden ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                     {item.subItems && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleSubmenu(item.id)
                        }}
                        className={`ml-2 p-1 rounded transition-all duration-300 ease-in-out hover:scale-110 ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <FaChevronRight className={`text-xs transition-transform duration-300 ease-in-out ${activeSubmenu === item.id ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>
              </Link>

                            {/* Submenu */}
              {item.subItems && (
                <div className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${
                  isCollapsed || activeSubmenu !== item.id 
                    ? 'max-h-0 opacity-0' 
                    : 'max-h-96 opacity-100'
                }`}>
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className={`${itemBase} ${subItemPadding} ${
                        isActive(subItem.href) ? subItemActive : subItemInactive
                      }`}
                    >
                      <div className="flex items-center justify-center w-4 h-4 mr-2">
                        {subItem.icon}
                      </div>
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className={`p-4 border-t transition-all duration-300 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            {/* Notifications icon-only */}
            {isMobile ? (
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                title={t('nav.notifications') || 'Notificações'}
                className={`${itemBase} ${itemPadding} ${itemInactive} justify-center relative`}
              >
                <FaBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/pages/notifications"
                title={t('nav.notifications') || 'Notificações'}
                className={`${itemBase} ${itemPadding} ${itemInactive} justify-center relative`}
              >
                <FaBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Logout icon-only */}
            <button
              onClick={handleLogout}
              title={t('nav.logout') || 'Sair'}
              className={`${itemBase} ${itemPadding} ${itemInactive} justify-center`}
            >
              <FaSignOutAlt className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Notifications full */}
            {isMobile ? (
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 w-full ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <FaBell className="w-5 h-5 mr-3" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>{t('nav.notifications') || 'Notificações'}</span>
              </button>
            ) : (
              <Link
                href="/pages/notifications"
                className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <FaBell className="w-5 h-5 mr-3" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>{t('nav.notifications') || 'Notificações'}</span>
              </Link>
            )}

            {/* Logout full */}
            <button
              onClick={handleLogout}
              className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 w-full ${
                theme === 'dark'
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              <FaSignOutAlt className="w-5 h-5 mr-3" />
              <span>{t('nav.logout') || 'Sair'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Collapsed Tooltips */}
      {isCollapsed && (
        <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Tooltip
        </div>
      )}

      {/* Modal de Notificações para dispositivos móveis */}
      {isMobile && (
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={[]}
        />
      )}
    </div>
  )
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SidebarContent {...props} />
    </Suspense>
  )
}
