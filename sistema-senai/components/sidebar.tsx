'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import MobileNavbar from './mobile-navbar'
import { User } from '@heroui/user'
import {
  FaHome,
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
  FaEnvelope,
  FaSun,
  FaMoon
} from 'react-icons/fa'
import Logo from './logo'
import { useTheme } from '../hooks/useTheme'
import ThemeToggle from './theme-toggle'
import { useSidebar } from '../contexts/SidebarContext'
import NotificationModal from './notification-modal'



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

export default function Sidebar({ 
  userType = 'admin', 
  userName,
  userEmail,
  notifications = 3
}: SidebarProps) {
  const { isCollapsed, setIsCollapsed, toggleSidebar, isMobile } = useSidebar()
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const pathname = usePathname()
  const { theme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/pages/auth/login');
  };

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case 'admin':
        return {
          label: 'Administrador',
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

  const userTypeInfo = getUserTypeInfo(userType)

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: <FaHome />,
      href: '/pages/home'
    },
    {
      id: 'chamados',
      label: 'Chamados',
      icon: <FaClipboardList />,
      href: '/pages/called',
      badge: 5,
      subItems: [
        {
          id: 'novos-chamados',
          label: 'Novos Chamados',
          icon: <FaExclamationTriangle />,
          href: '/pages/called/novos'
        },
        {
          id: 'historico',
          label: 'Histórico',
          icon: <FaHistory />,
          href: '/pages/called/historico'
        }
      ]
    },
    {
      id: 'maintenance',
      label: 'Técnicos',
      icon: <FaWrench />,
      href: '/pages/maintenance'
    },
    {
      id: 'employees',
      label: 'Colaboradores',
      icon: <FaUsers />,
      href: '/pages/employees'
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <FaChartBar />,
      href: '/pages/reports'
    },
    {
      id: 'config',
      label: 'Configurações',
      icon: <FaCog />,
      href: '/pages/config',
      subItems: [
        {
          id: 'sistema',
          label: 'Sistema',
          icon: <FaCogs />,
          href: '/pages/config/sistema'
        },
        {
          id: 'unidade',
          label: 'Unidade',
          icon: <FaBuilding />,
          href: '/pages/config/unidade'
        },
        {
          id: 'perfil',
          label: 'Perfil',
          icon: <FaUserCog />,
          href: '/pages/config/perfil'
        }
      ]
    }
  ]

  const isActive = (href: string) => pathname === href
  const isSubmenuActive = (item: MenuItem) => {
    return item.subItems?.some(subItem => pathname === subItem.href) || false
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
           <a href="/pages/home" title='Início' className='flex flex-col items-center mx-auto space-x-3'>
            <div className="flex flex-col items-center mx-auto space-x-3 ">
              <Logo size="md" showBackground={false} className="mx-auto" />
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Sistema de Chamados
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
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
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
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            theme === 'dark' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            <FaUser className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-light text-[.8rem] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {userName}
            </div>
            <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {userEmail}
            </div>
            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Meu Perfil
            </div>
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
                  className={`
                    group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium sidebar-hover
                    ${isActive(item.href) || isSubmenuActive(item)
                      ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-white border border-red-400/30'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                                  <div className="flex items-center justify-center w-5 h-5 mr-3 sidebar-transition-fast">
                    {item.icon}
                  </div>
                  <div className={`sidebar-transition overflow-hidden ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleSubmenu(item.id)
                        }}
                        className={`ml-2 p-1 rounded transition-all duration-300 ease-in-out hover:scale-110 ${
                          theme === 'dark' 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-gray-100'
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
                      className={`
                        group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive(subItem.href)
                          ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 text-white border border-red-400/20'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
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
      <div className={`p-4 border-t space-y-2 transition-all duration-500 ease-in-out ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Theme Toggle */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden pointer ${
          isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
        }`}>
          <ThemeToggle 
            className="w-full pointer"
            showLabel={true}
          />
        </div>

        {/* Notifications */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
        }`}>
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
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
              <span>Notificações</span>
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
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
              <span>Notificações</span>
            </Link>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 w-full ${
            theme === 'dark'
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          <FaSignOutAlt className="w-5 h-5 mr-3" />
          <span className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>Sair</span>
        </button>
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
