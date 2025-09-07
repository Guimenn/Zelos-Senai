'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useRequireAuth } from '../../hooks/useAuth'
import { authCookies } from '../../utils/cookies'
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
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)
  const [shouldLoadMessages, setShouldLoadMessages] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)
  const isSendingRef = useRef(false)

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
        content: messageContent || undefined,
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
          content: messageContent || undefined,
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
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FaImage className="text-blue-500" />
    }
    
    return <FaFile className="text-gray-500" />
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
      {/* Header do Chat */}
      <div className={`flex items-center justify-between p-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Mensagens
        </span>
        <button
            onClick={() => {
              const debugInfo = {
                totalMessages: messages.length,
                tempMessages: messages.filter(m => m.isTemporary).length,
                permanentMessages: messages.filter(m => !m.isTemporary).length,
                connectionStatus,
                realtimeChannel: realtimeChannel ? 'Ativo' : 'Inativo',
                messages: messages.map(m => ({
                  id: m.id,
                  content: m.content?.substring(0, 20),
                  isTemporary: m.isTemporary,
                  sender: m.sender?.name,
                  created_at: m.created_at
                })),
                timestamp: new Date().toISOString()
              }
              console.log('🔍 DEBUG Chat:', debugInfo)
              alert('Debug Chat enviado para console!')
            }}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'text-green-400 hover:text-green-300 hover:bg-gray-700'
              : 'text-green-500 hover:text-green-600 hover:bg-gray-100'
          }`}
          title="Debug Chat"
        >
          💬
        </button>
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
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
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
              className={`p-2 mb-[11px] rounded-full transition-colors ${
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
                onChange={handleInputChange}
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
            {/* Botão de Debug de Envio */}
            <button
              onClick={() => {
                const debugInfo = {
                  newMessage: newMessage,
                  newMessageLength: newMessage.length,
                  selectedFile: selectedFile?.name,
                  selectedFileSize: selectedFile?.size,
                  isSending,
                  ticketId,
                  user: user?.userId,
                  userEmail: user?.email,
                  canSend: canSend,
                  timestamp: new Date().toISOString()
                }
                console.log('🔍 DEBUG Envio:', debugInfo)
                alert('Debug Envio enviado para console!')
              }}
              className={`p-2 mb-[11px] rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700'
                  : 'text-yellow-500 hover:text-yellow-600 hover:bg-gray-100'
              }`}
              title="Debug Envio"
            >
              🚀
            </button>
            
            {/* Botão de Teste de Envio */}
            <button
              onClick={() => {
                const testMessage = `Teste ${new Date().toLocaleTimeString()}`
                setNewMessage(testMessage)
                console.log('🧪 Mensagem de teste definida:', testMessage)
                alert('Mensagem de teste definida! Agora clique em enviar.')
              }}
              className={`p-2 mb-[11px] rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700'
                  : 'text-purple-500 hover:text-purple-600 hover:bg-gray-100'
              }`}
              title="Teste de Envio"
            >
              🧪
            </button>
            
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
              className={`p-2 mb-[11px] rounded-full transition-colors ${
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

