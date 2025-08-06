'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  FaUser
} from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import Logo from './logo'
import NotificationModal from './notification-modal'

interface MobileNavbarProps {
  userType?: 'admin' | 'profissional' | 'tecnico'
  userName?: string
  userEmail?: string
  notifications?: number
}

export default function MobileNavbar({ 
  userType = 'admin', 
  userName,
  userEmail,
  notifications = 3
}: MobileNavbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Itens do menu principal
  const menuItems = [
    { id: 'chamados', label: 'Chamados', icon: <FaClipboardList />, href: '/pages/called', badge: 5 },
    { id: 'maintenance', label: 'Técnicos', icon: <FaWrench />, href: '/pages/maintenance' },
    { id: 'home', label: 'Início', icon: <FaHome />, href: '/pages/home', isMain: true },
    { id: 'employees', label: 'Colaboradores', icon: <FaUsers />, href: '/pages/employees' },
    { id: 'relatorios', label: 'Relatórios', icon: <FaChartBar />, href: '/pages/reports' }
  ]
  
  // Itens do menu de perfil
  const profileMenuItems = [
    { id: 'config', label: 'Configurações', icon: <FaCog />, href: '/pages/config' },
    { id: 'sair', label: 'Sair', icon: <FaSignOutAlt />, href: '/logout', danger: true }
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
        fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-md
        ${theme === 'dark' 
          ? 'bg-gray-900/95 shadow-lg border-b border-gray-700' 
          : 'bg-gray-50/95 shadow-lg border-b border-gray-200'
        }
        h-14
      `}>
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center">
          
            <Logo size="md" showBackground={false} className="mx-auto" />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Botão de tema */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center rounded-full"
            >
              {theme === 'dark' ? (
                <FaSun className="text-white" />
              ) : (
                <FaMoon className="text-gray-600" />
              )}
            </button>
            
            {/* Botão de notificações */}
            <button 
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative"
            >
              <FaBell className="text-lg" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Dropdown de perfil */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"
              >
                <FaUserCircle className="text-lg text-gray-600 dark:text-gray-300" />
              </button>
              
              {/* Menu dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fadeIn z-50">
                  
                  {/* Seção do Perfil Integrada */}
                  <div className="px-2 pb-2  border-b border-gray-200 dark:border-gray-700">
                    <Link
                      href="/pages/perfil"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`
                        group flex items-center w-full p-3 rounded-lg transition-all duration-200
                        ${theme === 'dark'
                          ? 'hover:bg-gray-700/50'
                          : 'hover:bg-gray-100'
                        }
                      `}
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
                          {userEmail || 'admin@senai.com'}
                        </div>
                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Meu Perfil
                        </div>
                      </div>
                      
                      <FaChevronRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </Link>
                  </div>
                  
                  {/* Outros itens do menu */}
                  <div className="py-2">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          handleItemClick()
                        }}
                        className={`
                          flex items-center px-4 py-1.5 text-sm transition-all duration-200
                          ${item.danger
                            ? 'mt-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }
                        `}
                      >
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">{item.icon}</div>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Padding */}
      <div className="h-14"></div>

      {/* Bottom Navigation */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-md
          ${theme === 'dark' 
            ? 'bg-gray-900/95 shadow-lg border-t border-gray-700' 
            : 'bg-gray-50/95 shadow-lg border-t border-gray-200'
          }
          h-16
        `}
      >
        {/* Background destacado para o botão Home */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-10 h-10 rounded-full bg-gradient-to-br from-red-400/20 to-red-600/20 blur-sm pointer-events-none"></div>
        
        <div className="grid grid-cols-5 items-center h-16 gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleItemClick}
                              className={`
                  flex flex-col items-center justify-center py-2 transition-all duration-200 rounded-lg
                  ${item.isMain ? 'scale-115 -mt-3 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl ring-4 ring-white/20 dark:ring-gray-800/20 px-1' : 'px-1'}
                ${isActive(item.href)
                  ? item.isMain 
                    ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl ring-red-500/30' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : theme === 'dark'
                    ? item.isMain
                      ? 'text-white hover:shadow-xl hover:ring-red-500/20 hover:scale-110'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    : item.isMain
                      ? 'text-white hover:shadow-xl hover:ring-red-500/20 hover:scale-110'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <div className="relative">
                <div className={`text-lg mb-1 transition-all duration-200 ${isActive(item.href) ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive(item.href) && !item.isMain && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-center leading-tight font-medium ${
                item.id === 'employees' ? 'text-[.55rem]' : 'text-xs'
              }`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-16"></div>
      
      
      
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
