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
  FaUserCircle,
  FaSun,
  FaMoon
} from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import Logo from './logo'

interface MobileNavbarProps {
  userType?: 'admin' | 'profissional' | 'tecnico'
  userName?: string
  notifications?: number
}

export default function MobileNavbar({ 
  userType = 'admin', 
  userName = 'Usuário SENAI',
  notifications = 3
}: MobileNavbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Itens do menu principal
  const menuItems = [
    { id: 'chamados', label: 'Chamados', icon: <FaClipboardList />, href: '/chamados', badge: 5 },
    { id: 'usuarios', label: 'Usuários', icon: <FaUsers />, href: '/usuarios' },
    { id: 'home', label: 'Home', icon: <FaHome />, href: '/home', isMain: true },
    { id: 'manutencao', label: 'Manutenção', icon: <FaWrench />, href: '/manutencao' },
    { id: 'relatorios', label: 'Relatórios', icon: <FaChartBar />, href: '/relatorios' }
  ]
  
  // Itens do menu de perfil
  const profileMenuItems = [
    { id: 'configuracoes', label: 'Configurações', icon: <FaCog />, href: '/configuracoes' },
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
          : 'bg-white/95 shadow-lg border-b border-gray-200'
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
            <Link href="/notificacoes" className="relative">
              <FaBell className="text-lg" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Link>
            
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
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fadeIn z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
                  </div>
                  
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleItemClick()
                      }}
                      className={`
                        flex items-center px-4 py-2 text-sm
                        ${item.danger
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }
                      `}
                    >
                      <div className="w-5 h-5 mr-3">{item.icon}</div>
                      <span>{item.label}</span>
                    </Link>
                  ))}
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
             : 'bg-white/95 shadow-lg border-t border-gray-200'
           }
           h-16
         `}
       >
         {/* Círculo cortado para o Home */}
         <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-16 h-10 overflow-hidden">
           <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}></div>
         </div>
        <div className="flex items-center justify-around h-16 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleItemClick}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                ${item.isMain ? 'scale-125 -mt-5' : ''}
                ${isActive(item.href)
                  ? item.isMain 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
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
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-16"></div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Carregando...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay para fechar o dropdown quando clicar fora */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileDropdownOpen(false)}
        ></div>
      )}
    </>
   )
 }