'use client'

import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { FaSun, FaMoon } from 'react-icons/fa'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
        ${theme === 'dark'
          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
        ${className}
      `}
      aria-label={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      {theme === 'dark' ? (
        <FaSun className="w-5 h-5 mr-3" />
      ) : (
        <FaMoon className="w-5 h-5 mr-3" />
      )}
      {showLabel && (
        <span>
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  )
} 
