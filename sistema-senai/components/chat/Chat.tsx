'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useRequireAuth } from '../../hooks/useAuth'
import { authCookies } from '../../utils/cookies'
import { useI18n } from '../../contexts/I18nContext'
import { toast } from 'react-toastify'
import { getSupabaseClient, chatService } from '../../lib/supabase'
import { 
  FaPaperPlane, 
  FaPaperclip, 
  FaDownload, 
  FaImage, 
  FaFile,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaExpand,
  FaCompress
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
  isHistoryMode?: boolean
}

export default function Chat({ ticketId, className = '', canSend = true, isHistoryMode = false }: ChatProps) {
  const { theme } = useTheme()
  const { user } = useRequireAuth()
  const { t } = useI18n()
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
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)
  const [shouldLoadMessages, setShouldLoadMessages] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)
  const isSendingRef = useRef(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  // Função estabilizada para setMessages com debounce
  const setMessagesStable = useCallback((updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const result = updater(prev)
      console.log('🔄 setMessages chamado - Total:', result.length)
      return result
    })
  }, [])

  // Debounce para evitar múltiplas chamadas
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const setMessagesDebounced = useCallback((updater: (prev: Message[]) => Message[]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setMessagesStable(updater)
    }, 50) // 50ms de debounce
  }, [setMessagesStable])

  // Função para adicionar mensagem temporária sem debounce
  const addTempMessage = useCallback((tempMessage: any) => {
    setMessages(prev => {
      const updated = [...prev, tempMessage]
      console.log('📝 Mensagem temporária adicionada diretamente, total:', updated.length)
      return updated
    })
  }, [])

  // Função para substituir mensagem temporária sem debounce
  const replaceTempMessage = useCallback((tempId: string, realMessage: any) => {
    setMessages(prev => {
      const found = prev.find(msg => msg.id === tempId)
      if (found) {
        const updated = prev.map(msg => {
          if (msg.id === tempId) {
            return { ...realMessage, isTemporary: false }
          }
          return msg
        })
        console.log('✅ Mensagem temporária substituída diretamente, total:', updated.length)
        return updated
      } else {
        console.log('❌ Mensagem temporária não encontrada para substituição')
        return [...prev, { ...realMessage, isTemporary: false }]
      }
    })
  }, [])

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detectar mudanças de visibilidade da aba (sem recarregar mensagens - Realtime cuida disso)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // console.log('👁️ Aba ficou ativa - Realtime já está cuidando das mensagens')
      }
    }

    const handleFocus = () => {
      // console.log('👁️ Janela ganhou foco - Realtime já está cuidando das mensagens')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Fechar modal de imagem com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedImage) {
        setExpandedImage(null)
      }
    }

    if (expandedImage) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [expandedImage])

  // Carregar mensagens iniciais
  useEffect(() => {
    if (ticketId && user) {
      console.log('🔄 Carregando mensagens iniciais para ticket:', ticketId)
      loadMessages()
    }
  }, [ticketId, user])

  // Configurar polling para mensagens em tempo real (até Supabase estar configurado)
  useEffect(() => {
    if (!ticketId || !user) return

    // Limpar polling anterior se existir
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    // console.log('🔄 Iniciando polling para o chat (Supabase Realtime temporariamente desabilitado)')
    setConnectionStatus('connecting')
    
    // Polling simples para buscar novas mensagens
    pollingRef.current = setInterval(async () => {
      try {
        // Pausar polling se estiver processando mensagem
        if (isProcessingRef.current) {
          console.log('⏸️ Polling pausado - processando mensagem (useRef)')
          return
        }
        
        // Pausar polling se estiver enviando mensagem
        if (isSendingRef.current) {
          console.log('⏸️ Polling pausado - enviando mensagem (useRef)')
          return
        }
        
        // Pausar polling se não deve carregar mensagens
        if (!shouldLoadMessages) {
          console.log('⏸️ Polling pausado - shouldLoadMessages = false')
          return
        }
        
        console.log('🔄 Polling executando - carregando mensagens...')
        await loadMessages(true) // Carregamento silencioso
        setConnectionStatus('connected')
      } catch (error) {
        console.error('Erro no polling:', error)
        setConnectionStatus('disconnected')
      }
    }, 3000) // Verificar a cada 3 segundos
    
    setConnectionStatus('connected')
    // console.log('✅ Polling configurado com sucesso')

    // Cleanup
    return () => {
      // console.log('🧹 Limpando polling')
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      setConnectionStatus('disconnected')
    }
  }, [ticketId, user]) // Removido isSending e shouldLoadMessages das dependências

  // Efeito para pausar/reativar polling baseado no estado de envio
  useEffect(() => {
    console.log('🔄 useEffect polling - isSending:', isSending, 'shouldLoadMessages:', shouldLoadMessages, 'ticketId:', ticketId, 'user:', !!user)
    
    if (pollingRef.current) {
      if (isSending || !shouldLoadMessages) {
        console.log('⏸️ Polling pausado via useEffect')
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    } else if (!isSending && shouldLoadMessages && ticketId && user) {
      console.log('🔄 Polling reativado via useEffect')
      pollingRef.current = setInterval(async () => {
        try {
          // Verificar se ainda deve carregar mensagens
          if (!shouldLoadMessages || isSendingRef.current || isProcessingRef.current) {
            console.log('⏸️ Polling pausado - condições não atendidas')
            return
          }
          await loadMessages(true)
          setConnectionStatus('connected')
        } catch (error) {
          console.error('Erro no polling:', error)
          setConnectionStatus('disconnected')
        }
      }, 3000)
    }
  }, [isSending, shouldLoadMessages, ticketId, user])

  const loadMessages = async (silent = false) => {
    try {
      // Não carregar mensagens se não deve carregar
      if (!shouldLoadMessages) {
        console.log('⏸️ LoadMessages pausado - shouldLoadMessages = false')
        return
      }
      
      // Não carregar mensagens se estiver processando
      if (isProcessingRef.current) {
        console.log('⏸️ LoadMessages pausado - isProcessingRef = true')
        return
      }
      
      // Não carregar mensagens se estiver enviando
      if (isSendingRef.current) {
        console.log('⏸️ LoadMessages pausado - isSendingRef = true')
        return
      }
      
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
      
      // Lógica inteligente: mesclar mensagens existentes com novas, preservando temporárias
      setMessagesStable(prevMessages => {
        const tempMessages = prevMessages.filter(msg => msg.isTemporary)
        const permanentMessages = prevMessages.filter(msg => !msg.isTemporary)
        
        console.log('🔍 LoadMessages - Temp:', tempMessages.length, 'Permanent:', permanentMessages.length, 'New:', newMessages.length)
        console.log('🔍 LoadMessages - IDs das temporárias:', tempMessages.map(m => m.id))
        
        // Se há mensagens temporárias, não fazer nada para evitar interferência
        if (tempMessages.length > 0) {
          console.log('⏸️ LoadMessages - Preservando mensagens temporárias, não atualizando')
          return prevMessages
        }
        
        // Se é o carregamento inicial (sem mensagens permanentes), carregar todas as mensagens
        if (permanentMessages.length === 0 && newMessages.length > 0) {
          console.log('🔄 LoadMessages - Carregamento inicial, adicionando todas as mensagens:', newMessages.length)
          console.log('🔄 LoadMessages - Primeiras 3 mensagens:', newMessages.slice(0, 3).map((m: any) => ({ id: m.id, content: m.content, sender: m.sender?.name })))
          return newMessages
        }
        
        // Se não há mensagens temporárias, verificar se há mensagens novas
        const hasNewMessages = permanentMessages.length !== newMessages.length || 
          permanentMessages[permanentMessages.length - 1]?.id !== newMessages[newMessages.length - 1]?.id
        
        if (hasNewMessages) {
          console.log('🔄 LoadMessages - Há mensagens novas, mesclando com as existentes')
          console.log('🔄 LoadMessages - Mensagens permanentes:', permanentMessages.length, 'Novas do servidor:', newMessages.length)
          
          // Verificar se a última mensagem permanente está nas novas mensagens
          const lastPermanentId = permanentMessages[permanentMessages.length - 1]?.id
          const lastPermanentInNew = newMessages.find((msg: any) => msg.id === lastPermanentId)
          
          if (lastPermanentInNew) {
            // Se a última mensagem permanente está nas novas, apenas adicionar as novas
            const newMessagesToAdd = newMessages.filter((msg: any) => 
              !permanentMessages.some((perm: any) => perm.id === msg.id)
            )
            
            if (newMessagesToAdd.length > 0) {
              console.log('🔄 LoadMessages - Adicionando', newMessagesToAdd.length, 'mensagens novas')
              const updatedMessages = [...permanentMessages, ...newMessagesToAdd]
              return updatedMessages
            }
          } else {
            // Se não encontrou a última mensagem, fazer merge completo
            const allMessages = [...permanentMessages, ...newMessages]
            
            // Remover duplicatas baseado no ID
            const uniqueMessages = allMessages.filter((msg, index, self) => 
              index === self.findIndex(m => m.id === msg.id)
            )
            
            // Ordenar por data de criação
            const sortedMessages = uniqueMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            
            console.log('🔄 LoadMessages - Mensagens mescladas:', sortedMessages.length)
            return sortedMessages
          }
        }
        
        console.log('⏭️ LoadMessages - Nenhuma mensagem nova, mantendo atual')
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
    console.log('🚀 INÍCIO sendMessage - newMessage:', newMessage, 'selectedFile:', selectedFile?.name, 'isSending:', isSending)
    
    if ((!newMessage.trim() && !selectedFile) || isSending) {
      console.log('❌ sendMessage cancelado - sem conteúdo ou já enviando')
      return
    }
    
    const messageContent = newMessage.trim()
    const messageFile = selectedFile
    let tempMessage: any = null

    console.log('📝 Preparando envio - conteúdo:', messageContent, 'arquivo:', messageFile?.name)

    try {
      setIsSending(true)
      setIsProcessingMessage(true)
      setShouldLoadMessages(false)
      isProcessingRef.current = true
      isSendingRef.current = true
      console.log('⏳ Estado isSending, isProcessingMessage, shouldLoadMessages, isProcessingRef e isSendingRef definidos')
      const token = authCookies.getToken()
      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não')
      console.log('🔑 Token completo:', token)

      let attachmentUrl = null

      // Upload do arquivo se houver
      if (messageFile) {
        console.log('📎 Iniciando upload de arquivo:', messageFile.name)
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
        console.log('📎 Upload concluído:', attachmentUrl)
      } else {
        console.log('📎 Nenhum arquivo para upload')
      }

      // Criar mensagem temporária para feedback imediato
      console.log('📝 Criando mensagem temporária...')
      tempMessage = {
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
        console.log('📝 Adicionando mensagem temporária ao estado...')
        addTempMessage(tempMessage)
      
      // Limpar campos imediatamente
      setNewMessage('')
      setSelectedFile(null)
      setPreviewUrl(null)

      // Enviar mensagem para o servidor
      console.log('🌐 Enviando mensagem para o servidor...')
      console.log('🌐 Dados enviados:', {
        ticket_id: ticketId,
        content: messageContent || null,
        attachment_url: attachmentUrl
      })
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          content: messageContent || null,
          attachment_url: attachmentUrl
        })
      })

      console.log('🌐 Resposta do servidor recebida:', response.status, response.ok)
      console.log('🌐 Headers da resposta:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.log('❌ Erro na resposta do servidor:', response.status)
        const errorText = await response.text()
        console.log('❌ Texto do erro:', errorText)
        throw new Error(`Erro ao enviar mensagem: ${response.status} - ${errorText}`)
      }

      const messageData = await response.json()
      console.log('🌐 Dados da mensagem recebidos:', messageData.id)
      console.log('🌐 Mensagem completa recebida:', messageData)
      
      // Substituir mensagem temporária pela real
      console.log('🔄 Substituindo mensagem temporária - ID temporário:', tempMessage.id)
      replaceTempMessage(tempMessage.id, messageData)
      
      // Disparar evento para atualizar contadores de mensagens não lidas
      const messageEvent = new CustomEvent('messageSent', {
        detail: { ticketId: ticketId }
      })
      window.dispatchEvent(messageEvent)
      
      toast.success('Mensagem enviada!')
      // console.log('✅ sendMessage concluído com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      
        // Remover mensagem temporária em caso de erro (usar o ID correto)
        if (tempMessage) {
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        }
      
      // Restaurar campos em caso de erro
      setNewMessage(messageContent)
      if (messageFile) {
        setSelectedFile(messageFile)
        if (messageFile.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(messageFile))
        }
      }
      
      // Mensagem temporária já foi removida acima
      
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
      setIsProcessingMessage(false)
      isProcessingRef.current = false
      isSendingRef.current = false
      
      // Reativar carregamento após um delay para evitar interferência
      setTimeout(() => {
        setShouldLoadMessages(true)
        console.log('🔄 shouldLoadMessages reativado após delay')
        console.log('🔄 Estados finais - isSending:', isSending, 'shouldLoadMessages:', true, 'isProcessingRef:', isProcessingRef.current)
      }, 2000) // 2 segundos de delay para garantir que a mensagem seja processada
      
      console.log('🔄 Estados isSending, isProcessingMessage, isProcessingRef e isSendingRef definidos como false')
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

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setNewMessage(value)
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
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'bmp', 'tiff', 'svg'].includes(extension || '')) {
      return <FaImage className="text-blue-500" />
    }
    
    return <FaFile className="text-gray-500" />
  }

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'bmp', 'tiff', 'svg'].includes(extension || '')
  }

  const isOwnMessage = (message: Message) => {
    // Se o campo FROM_Me estiver definido, usar ele
    if (message.FROM_Me !== undefined) {
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
      

      {/* Área de Mensagens */}
      <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex flex-col items-center space-y-3">
              <FaSpinner className="animate-spin text-2xl text-red-500" />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Carregando mensagens...
              </span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FaPaperPlane className="text-2xl text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
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
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {message.sender.avatar ? (
                        <img 
                          src={message.sender.avatar} 
                          alt={message.sender.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('❌ Erro ao carregar avatar da mensagem:', message.sender.avatar)
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                          onLoad={() => {
                            console.log('✅ Avatar da mensagem carregado:', message.sender.avatar)
                          }}
                        />
                      ) : null}
                      <div className={`${message.sender.avatar ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                      {message.sender.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {message.sender.name}
                    </span>
                  </div>
                )}

                {/* Bolha da mensagem */}
                <div
                  className={`rounded-2xl px-4 py-3 relative shadow-sm ${
                    isOwnMessage(message)
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-white text-gray-900 border border-gray-200'
                  } ${message.isTemporary ? 'opacity-70' : ''}`}
                >
                  {/* Indicador de mensagem temporária */}
                  {message.isTemporary && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-xs text-white" />
                      </div>
                    </div>
                  )}
                  {/* Conteúdo da mensagem */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                  )}

                  {/* Anexo */}
                  {message.attachment_url && (
                    <div className="mt-3">
                      {isImageFile(message.attachment_url) ? (
                        // Exibir imagem inline
                        <div className="relative group">
                          <img
                            src={message.attachment_url}
                            alt="Imagem anexada"
                            className="max-w-full h-auto rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 shadow-sm"
                            style={{ maxHeight: '300px', maxWidth: '250px' }}
                            onClick={() => setExpandedImage(message.attachment_url!)}
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', message.attachment_url)
                              // Mostrar fallback em vez de esconder
                              const target = e.currentTarget as HTMLImageElement
                              target.style.display = 'none'
                              
                              // Verificar se já existe uma mensagem de erro
                              const existingError = target.parentNode?.querySelector('.image-error-message')
                              if (existingError) return
                              
                              // Mostrar mensagem de erro
                              const errorDiv = document.createElement('div')
                              errorDiv.className = `image-error-message p-3 rounded-lg border text-sm ${
                                isOwnMessage(message)
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : theme === 'dark'
                                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`
                              errorDiv.innerHTML = `
                                <div class="flex items-center space-x-2">
                                  <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                  </svg>
                                  <span>Imagem não encontrada</span>
                                </div>
                              `
                              target.parentNode?.insertBefore(errorDiv, target.nextSibling)
                            }}
                          />
                          {/* Overlay com botão de expansão */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => setExpandedImage(message.attachment_url!)}
                              className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
                              title="Expandir imagem"
                            >
                              <FaExpand className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Exibir botão de download para outros arquivos
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 ${
                            isOwnMessage(message)
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                              : theme === 'dark'
                              ? 'bg-gray-600 hover:bg-gray-500 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm'
                          }`}
                        >
                          {getFileIcon(message.attachment_url)}
                          <span>Ver anexo</span>
                          <FaDownload className="text-xs" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Horário */}
                  <div className={`text-xs mt-2 ${
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
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Visualização"
                  className="w-12 h-12 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
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
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
              title="Remover arquivo"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Input de Mensagem */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {!canSend ? (
          <div className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FaPaperPlane className="text-lg text-gray-400" />
            </div>
            <p className="text-sm font-medium">Chat em modo somente leitura</p>
            <p className="text-xs mt-1">Você pode visualizar as mensagens, mas não pode enviar novas</p>
          </div>
        ) : (
          <div className="flex items-end space-x-3">
            {/* Botão de anexo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className={`p-3 mb-[11px] rounded-full transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Anexar arquivo"
            >
              <FaPaperclip className="text-lg" />
            </button>

            {/* Input de texto */}
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.typeMessage')}
                disabled={isSending}
                rows={1}
                className={`w-full px-4 py-3 rounded-2xl border resize-none transition-all duration-200 shadow-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Botão de enviar */}
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
              className={`p-3 mb-[11px] rounded-full transition-all duration-200 hover:scale-105 ${
                (!newMessage.trim() && !selectedFile) || isSending
                  ? 'text-gray-400 cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                  : 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
              }`}
              title="Enviar mensagem"
            >
              {isSending ? (
                <FaSpinner className="animate-spin text-lg" />
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

      {/* Modal de Expansão de Imagem */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          />
          
          {/* Modal da Imagem */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {/* Botão de fechar */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              title="Fechar"
            >
              <FaTimes className="text-xl" />
            </button>
            
            {/* Imagem expandida */}
            <img
              src={expandedImage}
              alt="Imagem expandida"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Erro ao carregar imagem expandida:', expandedImage)
                e.currentTarget.style.display = 'none'
              }}
            />
            
            {/* Botão de download */}
            <a
              href={expandedImage}
              download
              className="absolute bottom-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              title="Baixar imagem"
              onClick={(e) => e.stopPropagation()}
            >
              <FaDownload className="text-xl" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

