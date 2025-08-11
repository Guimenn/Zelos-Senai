'use client'

import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaExclamationTriangle, FaTimes, FaTrash } from 'react-icons/fa'
import { PrimaryButton, SecondaryButton } from '../ui/button'

type ConfirmDeleteModalProps = {
  isOpen: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Excluir registro',
  description = 'Esta ação não pode ser desfeita. Tem certeza que deseja excluir?',
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const { theme } = useTheme()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-md w-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                <FaExclamationTriangle className="text-red-500" />
              </div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-2 rounded-lg`}
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{description}</p>
        </div>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <PrimaryButton
              onClick={onConfirm}
              isLoading={confirming}
              loadingText="Excluindo..."
              icon={<FaTrash />}
            >
              {confirmText}
            </PrimaryButton>
            <SecondaryButton onClick={onCancel}>{cancelText}</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}

