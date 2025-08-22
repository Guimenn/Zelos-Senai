'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { authCookies } from '../utils/cookies'
import {
  FaTimes,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaThermometerHalf,
  FaTag,
  FaFileAlt,
  FaComments
} from 'react-icons/fa'

interface TicketEditModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: any
  onTicketUpdated: () => void
}

interface Category {
  id: number
  name: string
}

interface Subcategory {
  id: number
  name: string
  category_id: number
}

interface User {
  id: number
  name: string
  email: string
  role: string
  user?: {
    id: number
    name: string
    email: string
    is_active: boolean
    role: string
  }
}

export default function TicketEditModal({ isOpen, onClose, ticket, onTicketUpdated }: TicketEditModalProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    category_id: 0,
    subcategory_id: 0,
    assigned_to: 0,
    due_date: ''
  })

  // Estados para carregar dados
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [agents, setAgents] = useState<User[]>([])
  const [clients, setClients] = useState<User[]>([])

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen && ticket) {
      console.log('🎯 Ticket recebido no modal:', ticket)
      console.log('🎯 ID do ticket:', ticket.id)
      console.log('🎯 Backend ID do ticket:', ticket.backendId)
      console.log('🎯 Tipo do backendId:', typeof ticket.backendId)
      console.log('🎯 Valor exato do backendId:', ticket.backendId)
      console.log('🎯 Estrutura completa do ticket:', JSON.stringify(ticket, null, 2))
      
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Open',
        category_id: ticket.category?.id || ticket.category_id || 0,
        subcategory_id: ticket.subcategory?.id || ticket.subcategory_id || 0,
        assigned_to: ticket.assignee?.id || ticket.assigned_to || 0,
        due_date: ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '',
      })
      loadFormData()
      
      // Carregar subcategorias se já houver categoria selecionada
      if (ticket.category?.id || ticket.category_id) {
        loadSubcategories(ticket.category?.id || ticket.category_id)
      }
    }
  }, [isOpen, ticket])

  const loadFormData = async () => {
    try {
      setIsLoading(true)
      const token = authCookies.getToken()
      if (!token) throw new Error('Token não encontrado')

                     // Carregar categorias
        const categoriesRes = await fetch('/helpdesk/categories', {
         headers: { Authorization: `Bearer ${token}` }
       })
       if (categoriesRes.ok) {
         const categoriesData = await categoriesRes.json()
         setCategories(categoriesData)
       }

               // Carregar agentes
        const agentsRes = await fetch('/admin/agent', {
         headers: { Authorization: `Bearer ${token}` }
       })
       if (agentsRes.ok) {
         const agentsData = await agentsRes.json()
         const agentsList = agentsData.agents || agentsData
         // Filtrar apenas agentes ativos
         setAgents(agentsList.filter((agent: any) => agent.user?.is_active && agent.user?.role === 'Agent'))
       }

               // Carregar clientes
        const clientsRes = await fetch('/admin/client', {
         headers: { Authorization: `Bearer ${token}` }
       })
       if (clientsRes.ok) {
         const clientsData = await clientsRes.json()
         const clientsList = clientsData.clients || clientsData
         // Filtrar apenas clientes ativos
         setClients(clientsList.filter((client: any) => client.user?.is_active && client.user?.role === 'Client'))
       }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados do formulário')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }

    try {
      const token = authCookies.getToken()
      if (!token) return

             const res = await fetch(`/helpdesk/categories/${categoryId}/subcategories`, {
         headers: { Authorization: `Bearer ${token}` }
       })
      if (res.ok) {
        const data = await res.json()
        setSubcategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error)
    }
  }

  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => ({ ...prev, category_id: categoryId, subcategory_id: 0 }))
    loadSubcategories(categoryId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Token não encontrado')

      // Preparar dados para envio - apenas campos que têm valores válidos
      const updateData: any = {}
      
      // Campos obrigatórios sempre enviados
      if (formData.title && formData.title.trim()) {
        updateData.title = formData.title.trim()
      }
      if (formData.description && formData.description.trim()) {
        updateData.description = formData.description.trim()
      }
      if (formData.priority) {
        updateData.priority = formData.priority
      }
      if (formData.status) {
        updateData.status = formData.status
      }
      
      // Campos opcionais apenas se tiverem valores válidos
      if (formData.category_id && formData.category_id > 0) {
        updateData.category_id = formData.category_id
      }
      if (formData.subcategory_id && formData.subcategory_id > 0) {
        updateData.subcategory_id = formData.subcategory_id
      }
      if (formData.assigned_to && formData.assigned_to > 0) {
        updateData.assigned_to = formData.assigned_to
      }
      if (formData.due_date && formData.due_date.trim()) {
        updateData.due_date = formData.due_date
      }
      
      console.log('Dados sendo enviados:', updateData)
      console.log('ID do ticket:', ticket.backendId || ticket.id)
      
      // Garantir que temos um ID válido - extrair apenas o número
      let ticketId = ticket.backendId || ticket.id
      if (!ticketId) {
        throw new Error('ID do ticket não encontrado')
      }
      
      // Se o ID contém ":", extrair apenas a parte numérica
      if (typeof ticketId === 'string' && ticketId.includes(':')) {
        ticketId = ticketId.split(':')[0]
      }
      
      // Converter para número
      ticketId = parseInt(ticketId)
      if (isNaN(ticketId)) {
        throw new Error('ID do ticket inválido')
      }

      console.log('Dados completos sendo enviados:', updateData)
      console.log('ID do ticket processado:', ticketId)
      console.log('URL da requisição:', `/helpdesk/tickets/${ticketId}`)
      console.log('Tipo do ticketId:', typeof ticketId)
      console.log('Valor exato do ticketId:', ticketId)

             const res = await fetch(`/helpdesk/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
       })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('Erro da API:', errorData)
        throw new Error(errorData.message || 'Erro ao atualizar ticket')
      }

      setSuccess('Ticket atualizado com sucesso!')
      setTimeout(() => {
        onTicketUpdated()
        onClose()
      }, 1500)

    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar ticket')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FaFileAlt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Editar Chamado
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                ID: {ticket?.id || ticket?.ticket_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
              <span className={`ml-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Carregando dados...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alertas */}
              {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">{success}</span>
                </div>
              )}

                             {/* Informações Básicas */}
               <div>
                 <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   Título *
                 </label>
                 <input
                   type="text"
                   value={formData.title}
                   onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                   required
                   className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                     theme === 'dark' 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                 />
               </div>

              {/* Descrição */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Categoria e Subcategoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Categoria
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={0}>Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subcategoria
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: Number(e.target.value) }))}
                    disabled={!formData.category_id}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${!formData.category_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={0}>Selecione uma subcategoria</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prioridade e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Low">Baixa</option>
                    <option value="Medium">Média</option>
                    <option value="High">Alta</option>
                    <option value="Critical">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Open">Aberto</option>
                    <option value="InProgress">Em Andamento</option>
                    <option value="WaitingForClient">Aguardando Cliente</option>
                    <option value="WaitingForThirdParty">Aguardando Terceiros</option>
                    <option value="Resolved">Resolvido</option>
                    <option value="Closed">Fechado</option>
                    <option value="Cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Atribuição e Prazo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Atribuir para
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: Number(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                                         <option value={0}>Não atribuído</option>
                     {agents.map(agent => (
                       <option key={agent.id} value={agent.user?.id || agent.id}>
                         {agent.user?.name || agent.name} ({agent.user?.email || agent.email})
                       </option>
                     ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              

              {/* Botões */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
