'use client'

import React, { useEffect, useState } from 'react'
import Sidebar from './sidebar'
import MainContent from './main-content'
import { useSidebar } from '../contexts/SidebarContext'
import { jwtDecode } from 'jwt-decode'
import { authCookies } from '../utils/cookies'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  userType?: 'admin' | 'profissional' | 'tecnico'
  userName?: string
  userEmail?: string
  notifications?: number
  className?: string
}

export default function ResponsiveLayout({
  children,
  userType = 'admin',
  userName,
  userEmail,
  notifications = 0,
  className = ''
}: ResponsiveLayoutProps) {
  const { isMobile } = useSidebar()
  const [decodedName, setDecodedName] = useState<string | undefined>(undefined)
  const [decodedEmail, setDecodedEmail] = useState<string | undefined>(undefined)
  const [decodedUserType, setDecodedUserType] = useState<'admin' | 'profissional' | 'tecnico' | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeUserData = () => {
      try {
        const token = typeof window !== 'undefined' ? authCookies.getToken() : null
        if (!token) {
          setIsInitialized(true)
          return
        }
        
        const decoded: any = jwtDecode(token)
       
        if (decoded?.name) setDecodedName(decoded.name)
        if (decoded?.email) setDecodedEmail(decoded.email)
        
        const role: string = (decoded?.role ?? decoded?.userRole ?? '').toString()
        const mapRoleToType = (r: string): 'admin' | 'profissional' | 'tecnico' | undefined => {
          const normalizedRole = (r || '').toLowerCase()
          
          switch (normalizedRole) {
            case 'admin':
              return 'admin'
            case 'agent':
            case 'tecnico':
              return 'tecnico'
            case 'client':
            case 'profissional':
              return 'profissional'
            default:
              console.warn('⚠️ ResponsiveLayout - Unknown role:', normalizedRole)
              return undefined
          }
        }
        
        const mapped = mapRoleToType(role)
 
        if (mapped) {
          setDecodedUserType(mapped)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('❌ ResponsiveLayout - Error decoding token:', error)
        setIsInitialized(true)
      }
    }

    // Inicializar imediatamente
    initializeUserData()

    // Escutar mudanças no localStorage (quando o token é atualizado)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
      
        initializeUserData()
      }
    }

    // Escutar eventos customizados de atualização de perfil
    const handleProfileUpdate = () => {
    
      initializeUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profile-updated', handleProfileUpdate)
    window.addEventListener('auth-updated', handleProfileUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profile-updated', handleProfileUpdate)
      window.removeEventListener('auth-updated', handleProfileUpdate)
    }
  }, [])

  // Priorizar sempre o userType decodificado do token, mesmo que seja undefined inicialmente
  // Isso força o componente a usar o role correto do token em vez do hardcoded das páginas
  const finalUserType = isInitialized ? (decodedUserType ?? userType) : userType
  const finalUserName = decodedName ?? userName
  const finalUserEmail = decodedEmail ?? userEmail


  return (
    <div className={`flex h-screen min-h-screen ${className}`}>
      {/* Sidebar - será renderizada como navbar móvel se necessário */}
      <Sidebar
        userType={finalUserType}
        userName={finalUserName}
        userEmail={finalUserEmail}
        notifications={notifications}
      />

      {/* Main Content */}
      <MainContent className={isMobile ? 'mobile-content' : ''}>
        {children}
      </MainContent>
    </div>
  )
}
