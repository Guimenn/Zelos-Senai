'use client'

import React from 'react'
import Sidebar from './sidebar'
import MainContent from './main-content'
import { useSidebar } from '../contexts/SidebarContext'

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
  notifications = 3,
  className = ''
}: ResponsiveLayoutProps) {
  const { isMobile } = useSidebar()

  return (
    <div className={`flex h-screen min-h-screen ${className}`}>
      {/* Sidebar - será renderizada como navbar móvel se necessário */}
      <Sidebar
        userType={userType}
        userName={userName}
        userEmail={userEmail}
        notifications={notifications}
      />

      {/* Main Content */}
      <MainContent className={isMobile ? 'mobile-content' : ''}>
        {children}
      </MainContent>
    </div>
  )
}
