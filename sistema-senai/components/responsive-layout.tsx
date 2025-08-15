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

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? authCookies.getToken() : null
      if (!token) return
      const decoded: any = jwtDecode(token)
      if (decoded?.name) setDecodedName(decoded.name)
      if (decoded?.email) setDecodedEmail(decoded.email)
      const role: string = (decoded?.role ?? decoded?.userRole ?? '').toString()
      const mapRoleToType = (r: string): 'admin' | 'profissional' | 'tecnico' | undefined => {
        switch ((r || '').toLowerCase()) {
          case 'admin':
            return 'admin'
          case 'agent':
            return 'tecnico'
          case 'client':
            return 'profissional'
          default:
            return undefined
        }
      }
      const mapped = mapRoleToType(role)
      if (mapped) setDecodedUserType(mapped)
    } catch {
      // Silencioso: se falhar, mantém props/fallbacks
    }
  }, [])

  const finalUserType = decodedUserType ?? userType
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
