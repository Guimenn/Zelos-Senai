'use client'

import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { useSidebar } from '../contexts/SidebarContext'

interface MainContentProps {
  children: React.ReactNode
  className?: string
}

export default function MainContent({ children, className = '' }: MainContentProps) {
  const { theme } = useTheme()
  const { isCollapsed, isMobile } = useSidebar()

  return (
    <div className={`flex-1 sidebar-transition ${
      isMobile ? 'ml-0' : isCollapsed ? 'ml-16' : 'ml-64'
    } ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    } ${className}`}>
         <main className={`sidebar-transition ${
        isMobile ? 'p-4 pb-20' : 'p-6'
      }`}>
        {children}
      </main>
    </div>
  )
} 
