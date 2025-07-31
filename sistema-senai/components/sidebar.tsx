'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  userName = 'Usuário SENAI',
  userEmail = 'usuario@senai.com',
  notifications = 3
}: SidebarProps) {
  const { isCollapsed, setIsCollapsed, toggleSidebar } = useSidebar()
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const pathname = usePathname()
  const { theme } = useTheme()

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
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FaTachometerAlt />,
      href: '/dashboard'
    },
    {
      id: 'chamados',
      label: 'Chamados',
      icon: <FaClipboardList />,
      href: '/chamados',
      badge: 5,
      subItems: [
        {
          id: 'novos-chamados',
          label: 'Novos Chamados',
          icon: <FaExclamationTriangle />,
          href: '/chamados/novos'
        },
        {
          id: 'em-andamento',
          label: 'Em Andamento',
          icon: <FaClock />,
          href: '/chamados/andamento'
        },
        {
          id: 'concluidos',
          label: 'Concluídos',
          icon: <FaCheckCircle />,
          href: '/chamados/concluidos'
        },
        {
          id: 'historico',
          label: 'Histórico',
          icon: <FaHistory />,
          href: '/chamados/historico'
        }
      ]
    },
    {
      id: 'manutencao',
      label: 'Manutenção',
      icon: <FaWrench />,
      href: '/manutencao',
      subItems: [
        {
          id: 'equipamentos',
          label: 'Equipamentos',
          icon: <FaTools />,
          href: '/manutencao/equipamentos'
        },
        {
          id: 'preventiva',
          label: 'Preventiva',
          icon: <FaClipboardCheck />,
          href: '/manutencao/preventiva'
        },
        {
          id: 'corretiva',
          label: 'Corretiva',
          icon: <FaWrench />,
          href: '/manutencao/corretiva'
        }
      ]
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: <FaUsers />,
      href: '/usuarios',
      subItems: [
        {
          id: 'administradores',
          label: 'Administradores',
          icon: <FaShieldAlt />,
          href: '/usuarios/admin'
        },
        {
          id: 'profissionais',
          label: 'Profissionais',
          icon: <FaGraduationCap />,
          href: '/usuarios/profissionais'
        },
        {
          id: 'tecnicos',
          label: 'Técnicos',
          icon: <FaTools />,
          href: '/usuarios/tecnicos'
        }
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <FaChartBar />,
      href: '/relatorios'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: <FaCog />,
      href: '/configuracoes',
      subItems: [
        {
          id: 'sistema',
          label: 'Sistema',
          icon: <FaCogs />,
          href: '/configuracoes/sistema'
        },
        {
          id: 'unidade',
          label: 'Unidade',
          icon: <FaBuilding />,
          href: '/configuracoes/unidade'
        },
        {
          id: 'perfil',
          label: 'Perfil',
          icon: <FaUserCog />,
          href: '/configuracoes/perfil'
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
  }

  return (
    <div className={`
      fixed left-0 top-0 h-full z-50 sidebar-transition
      ${isCollapsed ? 'w-16' : 'w-64'}
      ${theme === 'dark' 
        ? 'bg-gray-900 shadow-lg border-r border-gray-700' 
        : 'bg-white shadow-lg border-r border-gray-200'
      }
    `}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <FaBuilding className="text-white text-sm" />
              </div>
              <div>
                <h2 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  SENAI
                </h2>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sistema de Chamados
                </p>
              </div>
            </div>
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

      {/* User Profile */}
      <div className={`p-4 border-b overflow-hidden sidebar-transition ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      } ${isCollapsed ? 'h-0 p-0 opacity-0' : 'h-auto opacity-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              bg-gradient-to-br ${userTypeInfo.color}
            `}>
              {userTypeInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {userName}
              </p>
              <p className={`text-xs truncate ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {userEmail}
              </p>
              <div className="flex items-center mt-1">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  bg-gradient-to-r ${userTypeInfo.color} text-white
                `}>
                  {userTypeInfo.icon}
                  <span className="ml-1">{userTypeInfo.label}</span>
                </span>
              </div>
            </div>
          </div>
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
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
        }`}>
          <ThemeToggle 
            className="w-full"
            showLabel={true}
          />
        </div>

        {/* Notifications */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
        }`}>
          <Link
            href="/notificacoes"
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
        </div>

        {/* Logout */}
        <Link
          href="/logout"
          className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 ${
            theme === 'dark'
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          <FaSignOutAlt className="w-5 h-5 mr-3" />
          <span className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>Sair</span>
        </Link>
      </div>

      {/* Collapsed Tooltips */}
      {isCollapsed && (
        <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Tooltip
        </div>
      )}
    </div>
  )
}
