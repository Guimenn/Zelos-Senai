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
  const { isCollapsed } = useSidebar()

  return (
    <div className={`flex-1 sidebar-transition ${
      isCollapsed ? 'ml-16' : 'ml-64'
    } ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    } ${className}`}>
      <main className="p-6 sidebar-transition">
        {children}
      </main>
    </div>
  )
} 