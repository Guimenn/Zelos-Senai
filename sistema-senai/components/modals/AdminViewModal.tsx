'use client'

import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaTimes, FaUserShield, FaEnvelope, FaPhone, FaCalendar, FaUserCheck, FaUserTimes } from 'react-icons/fa'
import { PrimaryButton } from '../ui/button'

type AdminViewModalProps = {
  isOpen: boolean
  admin: any | null
  onClose: () => void
}

export default function AdminViewModal({
  isOpen,
  admin,
  onClose,
}: AdminViewModalProps) {
  const { theme } = useTheme()
  
  if (!isOpen || !admin) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-2xl w-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                <FaUserShield className="text-red-500" />
              </div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Detalhes do Administrador
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-2 rounded-lg`}
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center">
              {admin.avatar ? (
                <img src={admin.avatar} alt={admin.name} className="w-full h-full object-cover" />
              ) : (
                <FaUserShield size={32} />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {admin.name}
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {admin.position || 'Administrador'}
              </p>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                admin.is_active 
                  ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-600 border border-red-500/30'
              }`}>
                {admin.is_active ? <FaUserCheck /> : <FaUserTimes />}
                {admin.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Informações de Contato
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaEnvelope className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {admin.email}
                  </span>
                </div>
                {admin.phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {admin.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Informações do Sistema
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaCalendar className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Criado em: {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUserShield className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    ID: {admin.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <PrimaryButton onClick={onClose} className="w-full">
            Fechar
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
