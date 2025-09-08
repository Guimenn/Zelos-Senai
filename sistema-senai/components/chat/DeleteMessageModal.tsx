'use client'

import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa'

interface Message {
  id: string
  content?: string
  sender: {
    name: string
  }
}

interface DeleteMessageModalProps {
  isOpen: boolean
  message: Message | null
  onClose: () => void
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
}

export default function DeleteMessageModal({
  isOpen,
  message,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone
}: DeleteMessageModalProps) {
  const { theme } = useTheme()

  if (!isOpen || !message) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-red-900' : 'bg-red-100'
            }`}>
              <FaExclamationTriangle className={`text-lg ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Excluir mensagem
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className={`mb-4 p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Mensagem de <span className="font-medium">{message.sender.name}</span>
            </p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {message.content?.substring(0, 100)}
              {message.content && message.content.length > 100 && '...'}
            </p>
          </div>

          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Como você gostaria de excluir esta mensagem?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {/* Excluir só para mim */}
            <button
              onClick={onDeleteForMe}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`p-2 rounded-full ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <FaTrash className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Excluir só para mim
                </p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  A mensagem será removida apenas do seu chat
                </p>
              </div>
            </button>

            {/* Excluir para todos */}
            <button
              onClick={onDeleteForEveryone}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-red-600 text-red-400 hover:bg-red-900'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              }`}
            >
              <div className={`p-2 rounded-full ${
                theme === 'dark' ? 'bg-red-900' : 'bg-red-100'
              }`}>
                <FaTrash className={`text-sm ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
              <div className="text-left">
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>
                  Excluir para todos
                </p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-red-300' : 'text-red-500'
                }`}>
                  A mensagem será substituída por "Mensagem apagada" para todos
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
