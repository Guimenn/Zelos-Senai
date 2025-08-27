'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FaHome,
  FaTachometerAlt,
  FaClipboardList,
  FaWrench,
  FaUsers,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaChevronUp,
  FaChevronDown,
  FaChevronRight,
  FaUserCircle,
  FaSun,
  FaMoon,
  FaUser,
  FaShieldAlt
} from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import Logo from './logo'
import NotificationModal from './notification-modal'
import { authCookies } from '../utils/cookies'
import { useI18n } from '../contexts/I18nContext'

interface MobileNavbarProps {
  userType?: 'admin' | 'profissional' | 'tecnico'
  userName?: string
  userEmail?: string
  notifications?: number
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactElement
  href: string
  isMain?: boolean
  badge?: number
  danger?: boolean
}

export default function MobileNavbar({ 
  userType = 'admin', 
  userName,
  userEmail,
  notifications = 0
}: MobileNavbarProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [actualUserType, setActualUserType] = useState(userType)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Buscar dados do usuário incluindo avatar e tipo
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
          
          // Determinar o tipo de usuário baseado no role
          const role = userData.role?.toLowerCase() || userData.userRole?.toLowerCase()
          if (role === 'client') {
            setActualUserType('profissional')
          } else if (role === 'agent') {
            setActualUserType('tecnico')
          } else if (role === 'admin') {
            setActualUserType('admin')
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
      }
    }
    
    fetchUserData()
  }, [])

  // Itens do menu principal
  const menuItems: MenuItem[] = [
    { id: 'chamados', label: t('nav.tickets') || 'Chamados', icon: <FaClipboardList />, href: '/pages/called' },
    { id: 'maintenance', label: t('nav.technicians') || 'Técnicos', icon: <FaWrench />, href: '/pages/maintenance' },
    { id: 'home', label: t('nav.home') || 'Início', icon: <FaHome />, href: actualUserType === 'tecnico' ? '/pages/agent/home' : 
      actualUserType === 'profissional' ? '/pages/client/home' : '/pages/home', isMain: true },
    { id: 'employees', label: t('nav.employees') || 'Colaboradores', icon: <FaUsers />, href: '/pages/employees' },
    // 5º item: Configurações para colaboradores, Relatórios para outros
    ...(actualUserType === 'profissional' 
      ? [{ id: 'config', label: t('nav.settings') || 'Configurações', icon: <FaCog />, href: '/pages/config' } as MenuItem]
      : [{ id: 'reports', label: t('nav.reports') || 'Relatórios', icon: <FaChartBar />, href: '/pages/reports' } as MenuItem]
    )
  ]
  
  const handleLogout = () => {
      authCookies.removeToken();
      router.push('/pages/auth/login');
    };

  // Itens do menu de perfil
  const profileMenuItems: MenuItem[] = [
    // Administradores: mostrar apenas para admin
    ...(actualUserType === 'admin' 
      ? [{ id: 'admins', label: t('nav.admins') || 'Administradores', icon: <FaShieldAlt />, href: '/pages/admin/list' } as MenuItem]
      : []
    ),
    // Configurações: mostrar apenas para admin e técnico (colaboradores veem na navbar)
    ...(actualUserType !== 'profissional' 
      ? [{ id: 'config', label: t('nav.settings') || 'Configurações', icon: <FaCog />, href: '/pages/config' } as MenuItem]
      : []
    ),
    { id: 'sair', label: t('nav.logout') || 'Sair', icon: <FaSignOutAlt />, href: '/logout', danger: true }
  ]
  
  // Estado para controlar o dropdown do perfil
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // Fechar menu expandido quando clicar em um item
  const handleItemClick = () => {
    setIsExpanded(false)
    setIsLoading(true)
    
    // Haptic feedback para dispositivos móveis
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Simular loading
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }

  // Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isSwipeUp = distance > 50
    const isSwipeDown = distance < -50

    if (isSwipeUp && !isExpanded) {
      setIsExpanded(true)
    } else if (isSwipeDown && isExpanded) {
      setIsExpanded(false)
    }
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Header para telas pequenas */}
      <div className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
        ${theme === 'dark' 
          ? 'bg-gray-900/95 shadow-xl border-b border-gray-700' 
          : 'bg-gray-900/95 shadow-xl border-b border-gray-700'
        }
        h-16
      `}>
        <div className="relative flex items-center justify-center h-full px-4">
          {/* Logo centralizado */}
          <Link href="/pages/home">
          <Logo size="md" showBackground={false} className="mx-auto" />
          </Link>

          {/* Ações à direita sem afetar centralização */}
          <div className="absolute right-4 flex items-center space-x-4">
            {/* Botão de notificações */}
            <button 
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaBell className="text-lg text-gray-600 dark:text-gray-300" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Dropdown de perfil */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-900 dark:bg-gray-800 transition-colors hover:bg-gray-800 dark:hover:bg-gray-700 overflow-hidden"
              >
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName || 'Usuário'} 
                    className="w-full h-full object-cover"
                    onError={() => setUserAvatar(null)}
                  />
                ) : (
                  <FaUserCircle className="text-lg text-gray-600 dark:text-gray-300" />
                )}
              </button>
              
              {/* Menu dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 py-3 bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 dark:border-gray-700 animate-fadeIn z-50">
                  
                  {/* Seção do Perfil Integrada */}
                  <div className="px-4 pb-3 border-b border-gray-700 dark:border-gray-700">
                    <Link
                      href="/pages/perfil"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="group flex items-center w-full p-3 rounded-xl transition-all duration-200 hover:bg-gray-700 dark:hover:bg-gray-700/50 text-white"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 overflow-hidden bg-gradient-to-br from-red-500 to-red-600">
                        {userAvatar ? (
                          <img 
                            src={userAvatar} 
                            alt={userName || 'Usuário'} 
                            className="w-full h-full object-cover "
                            onError={() => setUserAvatar(null)}
                          />
                        ) : (
                          <FaUser className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-white">
                          {userName || 'Usuário'}
                        </div>
                        <div className="text-xs truncate text-gray-500 dark:text-gray-400 mt-1">
                          {userEmail || 'admin@senai.com'}
                        </div>
                        <div className="text-xs mt-2 text-red-600 dark:text-red-400 font-medium">
                          Meu Perfil
                        </div>
                      </div>
                      
                      <FaChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-gray-400" />
                    </Link>
                  </div>
                  
                  {/* Outros itens do menu */}
                  <div className="py-2">
                    {profileMenuItems.map((item) => (
                      item.id === 'sair' ? (
                        <button
                          key={item.id}
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            setIsExpanded(false)
                            handleLogout()
                          }}
                          className="flex w-full text-left items-center px-4 py-3 text-sm transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <div className="w-5 h-5 mr-3 flex items-center justify-center">{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            handleItemClick()
                          }}
                          className="flex items-center px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <div className="w-5 h-5 mr-3 flex items-center justify-center">{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Padding */}
      <div className="h-16"></div>

      {/* Bottom Navigation */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'bg-gray-900/95 shadow-2xl border-t border-gray-700' 
            : 'bg-white/95 shadow-2xl border-t border-gray-200'
          }
          h-20
        `}
      >
        <div className="grid grid-cols-5 items-center h-full px-1">
          {menuItems.map((item) => {
            const isActiveItem = isActive(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                className={`
                  flex flex-col items-center justify-center py-3 transition-all duration-200 rounded-xl mx-1
                  ${item.isMain 
                    ? 'scale-110 -mt-4 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg ring-2 ring-white/30' 
                    : ''
                  }
                  ${isActiveItem
                    ? item.isMain 
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-xl ring-red-500/50' 
                      : theme === 'dark'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-500/10 text-red-600'
                    : theme === 'dark'
                      ? item.isMain
                        ? 'text-white hover:shadow-xl hover:ring-red-500/40'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      : item.isMain
                        ? 'text-white hover:shadow-xl hover:ring-red-500/40'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <div className="relative">
                  <div className={`text-xl mb-1 transition-all duration-200 ${isActiveItem ? 'scale-110' : ''}`}>
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse font-bold">
                      {item.badge}
                    </span>
                  )}
                  {isActiveItem && !item.isMain && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <span className={`text-center leading-tight font-medium ${
                  item.id === 'employees' ? 'text-[0.6rem]' : 'text-xs'
                } ${item.isMain ? 'mt-1' : ''}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-20"></div>
      
      
      
      {/* Overlay para fechar o dropdown quando clicar fora */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileDropdownOpen(false)}
        ></div>
      )}

      {/* Modal de Notificações */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={[]}
      />
    </>
   )
 }
