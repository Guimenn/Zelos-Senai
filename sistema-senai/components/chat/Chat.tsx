'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useRequireAuth } from '../../hooks/useAuth'
import { authCookies } from '../../utils/cookies'
import { toast } from 'react-toastify'
import { getSupabaseClient } from '../../lib/supabase'
import { 
  FaPaperPlane, 
  FaPaperclip, 
  FaDownload, 
  FaImage, 
  FaFile,
  FaSpinner,
  FaTimes,
  FaCheck
} from 'react-icons/fa'

interface Message {
  id: string
  ticket_id: string
  sender_id: string
  content?: string
  attachment_url?: string
  created_at: string
  sender: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

interface ChatProps {
  ticketId: string
  className?: string
}

export default function Chat({ ticketId, className = '' }: ChatProps) {
  const { theme } = useTheme()
  const { user } = useRequireAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseClient()
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar mensagens iniciais
  useEffect(() => {
    if (ticketId && user) {
      loadMessages()
    }
  }, [ticketId, user])

  // Configurar Realtime
  useEffect(() => {
    if (!ticketId || !user) return

    // Criar canal para o ticket específico
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          console.log('Nova mensagem recebida:', payload)
          
          // Buscar dados do remetente
          try {
            const token = authCookies.getToken()
            const response = await fetch(`/user/${payload.new.sender_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (response.ok) {
              const senderData = await response.json()
              
              const newMessage: Message = {
                id: payload.new.id,
                ticket_id: payload.new.ticket_id,
                sender_id: payload.new.sender_id,
                content: payload.new.content,
                attachment_url: payload.new.attachment_url,
                created_at: payload.new.created_at,
                sender: {
                  id: senderData.id,
                  name: senderData.name,
                  email: senderData.email,
                  avatar: senderData.avatar
                }
              }

              // Adicionar mensagem apenas se não for do usuário atual (para evitar duplicatas)
              if (newMessage.sender_id !== user.id?.toString()) {
                setMessages(prev => [...prev, newMessage])
                
                // Mostrar notificação se a janela não estiver em foco
                if (document.hidden) {
                  toast.info(`Nova mensagem de ${newMessage.sender.name}`)
                }
              }
            }
          } catch (error) {
            console.error('Erro ao buscar dados do remetente:', error)
          }
        }
      )
      .subscribe()

    setRealtimeChannel(channel)

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [ticketId, user, supabase])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const token = authCookies.getToken()
      
      const response = await fetch(`/api/messages/list?ticket_id=${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending) return

    try {
      setIsSending(true)
      const token = authCookies.getToken()

      let attachmentUrl = null

      // Upload do arquivo se houver
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/messages/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Erro no upload do arquivo')
        }

        const uploadData = await uploadResponse.json()
        attachmentUrl = uploadData.data.url
      }

      // Enviar mensagem
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          content: newMessage.trim() || null,
          attachment_url: attachmentUrl
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      const messageData = await response.json()
      
      // Adicionar mensagem à lista local
      setMessages(prev => [...prev, messageData])
      
      // Limpar campos
      setNewMessage('')
      setSelectedFile(null)
      setPreviewUrl(null)
      
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.')
        return
      }

      setSelectedFile(file)
      
      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FaImage className="text-blue-500" />
    }
    
    return <FaFile className="text-gray-500" />
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id?.toString()
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header do Chat */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Chat do Chamado #{ticketId}
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Conversa em tempo real entre criador e técnico
        </p>
      </div>

      {/* Área de Mensagens */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <FaSpinner className="animate-spin text-2xl text-red-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                {/* Avatar e nome (apenas para mensagens dos outros) */}
                {!isOwnMessage(message) && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {message.sender.name}
                    </span>
                  </div>
                )}

                {/* Bolha da mensagem */}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwnMessage(message)
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {/* Conteúdo da mensagem */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  {/* Anexo */}
                  {message.attachment_url && (
                    <div className="mt-2">
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isOwnMessage(message)
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {getFileIcon(message.attachment_url)}
                        <span>Ver anexo</span>
                        <FaDownload className="text-xs" />
                      </a>
                    </div>
                  )}

                  {/* Horário */}
                  <div className={`text-xs mt-1 ${
                    isOwnMessage(message)
                      ? 'text-red-100'
                      : theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className={`p-3 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  {getFileIcon(selectedFile.name)}
                </div>
              )}
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedFile.name}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className={`p-1 rounded-full ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Input de Mensagem */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-end space-x-3">
          {/* Botão de anexo */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Anexar arquivo"
          >
            <FaPaperclip className="text-lg" />
          </button>

          {/* Input de texto */}
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              rows={1}
              className={`w-full px-4 py-2 rounded-2xl border resize-none transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          {/* Botão de enviar */}
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
            className={`p-2 rounded-full transition-colors ${
              (!newMessage.trim() && !selectedFile) || isSending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title="Enviar mensagem"
          >
            {isSending ? (
              <FaSpinner className="text-lg animate-spin" />
            ) : (
              <FaPaperPlane className="text-lg" />
            )}
          </button>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
          className="hidden"
        />
      </div>
    </div>
  )
}
