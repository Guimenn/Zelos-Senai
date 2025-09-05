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
  FROM_Me?: boolean
  isTemporary?: boolean
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
  canSend?: boolean
}

export default function Chat({ ticketId, className = '', canSend = true }: ChatProps) {
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [lastMessageTime, setLastMessageTime] = useState<number>(0)

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

  // Configurar sistema de atualizações otimizado
  useEffect(() => {
    if (!ticketId || !user) return

    console.log('🔄 Iniciando sistema de atualizações do chat')
    setConnectionStatus('connecting')
    
    // Polling adaptativo baseado na atividade
    let pollInterval: NodeJS.Timeout
    
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        try {
          await loadMessages(true) // true = carregamento silencioso
          setConnectionStatus('connected')
        } catch (error) {
          console.error('Erro no polling:', error)
          setConnectionStatus('disconnected')
        }
      }, 2000) // Verificar a cada 2 segundos
    }
    
    startPolling()

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      setConnectionStatus('disconnected')
    }
  }, [ticketId, user])

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }
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
      const newMessages = data.messages || []
      
      // Verificar se há mensagens novas para evitar re-renderizações desnecessárias
      setMessages(prevMessages => {
        if (prevMessages.length !== newMessages.length || 
            prevMessages[prevMessages.length - 1]?.id !== newMessages[newMessages.length - 1]?.id) {
          return newMessages
        }
        return prevMessages
      })
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      if (!silent) {
        toast.error('Erro ao carregar mensagens')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending) return
    
    const messageContent = newMessage.trim()
    const messageFile = selectedFile

    try {
      setIsSending(true)
      const token = authCookies.getToken()

      let attachmentUrl = null

      // Upload do arquivo se houver
      if (messageFile) {
        const formData = new FormData()
        formData.append('file', messageFile)

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

      // Criar mensagem temporária para feedback imediato
      const tempMessage = {
        id: `temp-${Date.now()}`,
        ticket_id: ticketId,
        sender_id: user?.userId?.toString() || '',
        content: messageContent || undefined,
        attachment_url: attachmentUrl,
        created_at: new Date().toISOString(),
        FROM_Me: true,
        sender: {
          id: user?.userId || 0,
          name: user?.name || 'Você',
          email: user?.email || '',
          avatar: undefined
        },
        isTemporary: true
      }

      // Adicionar mensagem temporária imediatamente
      setMessages(prev => [...prev, tempMessage])
      
      // Limpar campos imediatamente
      setNewMessage('')
      setSelectedFile(null)
      setPreviewUrl(null)

      // Enviar mensagem para o servidor
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          content: messageContent || undefined,
          attachment_url: attachmentUrl
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      const messageData = await response.json()
      
      // Substituir mensagem temporária pela real
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...messageData, isTemporary: false } : msg
      ))
      
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`))
      
      // Restaurar campos em caso de erro
      setNewMessage(messageContent)
      if (messageFile) {
        setSelectedFile(messageFile)
        if (messageFile.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(messageFile))
        }
      }
      
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
    // Se o campo FROM_Me estiver definido, usar ele
    if (message.FROM_Me !== undefined) {
      console.log('🔍 Usando FROM_Me:', {
        FROM_Me: message.FROM_Me,
        messageSender: message.sender?.name
      })
      return message.FROM_Me
    }
    
    // Fallback: comparar de forma mais robusta, lidando com string/number
    const messageSenderId = message.sender_id?.toString()
    const currentUserId = user?.userId?.toString()
    
    console.log('🔍 Comparando mensagem (fallback):', {
      messageSenderId,
      currentUserId,
      isEqual: messageSenderId === currentUserId,
      messageSender: message.sender?.name
    })
    
    return messageSenderId === currentUserId
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header do Chat */}

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
                  className={`rounded-2xl px-4 py-2 relative ${
                    isOwnMessage(message)
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-900'
                  } ${message.isTemporary ? 'opacity-70' : ''}`}
                >
                  {/* Indicador de mensagem temporária */}
                  {message.isTemporary && (
                    <div className="absolute -top-1 -right-1">
                      <FaSpinner className="animate-spin text-xs text-yellow-400" />
                    </div>
                  )}
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
        {!canSend ? (
          <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">Chat em modo somente leitura</p>
            <p className="text-xs mt-1">Você pode visualizar as mensagens, mas não pode enviar novas</p>
          </div>
        ) : (
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
        )}

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
