'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { 
  FaEllipsisV, 
  FaEdit, 
  FaTrash, 
  FaReply, 
  FaCopy,
  FaCheck,
  FaTimes
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import DeleteMessageModal from './DeleteMessageModal'

interface Message {
  id: string
  ticket_id: string
  sender_id: string
  content?: string
  attachment_url?: string
  created_at: string
  edited_at?: string
  is_deleted?: boolean
  deleted_at?: string
  deleted_by?: number
  reply_to_id?: string
  FROM_Me?: boolean
  isTemporary?: boolean
  isDeletedForMe?: boolean
  sender: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

interface MessageMenuProps {
  message: Message
  isOwnMessage: boolean
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string, deleteForAll: boolean) => void
  onReply?: (message: Message) => void
  onCopy?: (content: string) => void
  className?: string
}

export default function MessageMenu({ 
  message, 
  isOwnMessage, 
  onEdit, 
  onDelete, 
  onReply, 
  onCopy,
  className = '' 
}: MessageMenuProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowDeleteModal(false)
        setIsEditing(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
    setShowDeleteModal(false)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(message.content || '')
    setIsOpen(false)
  }

  const handleEditSave = () => {
    if (!editContent.trim()) {
      toast.error('Mensagem não pode estar vazia')
      return
    }

    if (editContent.trim() === message.content) {
      setIsEditing(false)
      return
    }

    onEdit?.(message.id, editContent.trim())
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditContent(message.content || '')
    setIsEditing(false)
  }

  const handleDeleteForMe = () => {
    onDelete?.(message.id, false)
    setShowDeleteModal(false)
    setIsOpen(false)
  }

  const handleDeleteForEveryone = () => {
    onDelete?.(message.id, true)
    setShowDeleteModal(false)
    setIsOpen(false)
  }

  const handleShowDeleteModal = () => {
    setShowDeleteModal(true)
    setIsOpen(false)
  }

  const handleReply = () => {
    onReply?.(message)
    setIsOpen(false)
  }

  const handleCopy = () => {
    if (message.content) {
      onCopy?.(message.content)
      toast.success('Mensagem copiada!')
    }
    setIsOpen(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Se estiver em modo de edição, mostrar input
  if (isEditing) {
    return (
      <div className={`flex items-start space-x-2 ${className}`}>
        <textarea
          ref={editInputRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyPress}
          className={`flex-1 px-3 py-2 rounded-lg border resize-none ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
          }`}
          rows={Math.min(editContent.split('\n').length, 4)}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleEditSave}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-green-400 hover:text-green-300 hover:bg-gray-700'
                : 'text-green-500 hover:text-green-600 hover:bg-gray-100'
            }`}
            title="Salvar"
          >
            <FaCheck className="text-sm" />
          </button>
          <button
            onClick={handleEditCancel}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                : 'text-red-500 hover:text-red-600 hover:bg-gray-100'
            }`}
            title="Cancelar"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Botão do menu */}
      <button
        onClick={handleMenuToggle}
        className={`p-1 rounded-full transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
        } ${isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        title="Opções da mensagem"
      >
        <FaEllipsisV className="text-sm" />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className={`absolute right-0 top-8 z-50 min-w-48 rounded-lg shadow-lg border ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1">
            {/* Opções para mensagens próprias */}
            {isOwnMessage && !message.is_deleted && (
              <>
                {/* Editar */}
                <button
                  onClick={handleEdit}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaEdit className="text-xs" />
                  <span>Editar mensagem</span>
                </button>

                {/* Excluir */}
                <button
                  onClick={handleShowDeleteModal}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaTrash className="text-xs" />
                  <span>Excluir mensagem</span>
                </button>
              </>
            )}

            {/* Responder - para todas as mensagens */}
            {!message.is_deleted && (
              <button
                onClick={handleReply}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaReply className="text-xs" />
                <span>Responder</span>
              </button>
            )}

            {/* Copiar - para todas as mensagens com conteúdo */}
            {message.content && !message.is_deleted && (
              <button
                onClick={handleCopy}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCopy className="text-xs" />
                <span>Copiar mensagem</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <DeleteMessageModal
        isOpen={showDeleteModal}
        message={message}
        onClose={() => setShowDeleteModal(false)}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />
    </div>
  )
}
