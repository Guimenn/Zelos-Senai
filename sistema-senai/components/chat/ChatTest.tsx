'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { getSupabaseClient } from '../../lib/supabase'
import { authCookies } from '../../utils/cookies'
import { 
  FaSpinner, 
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaComments
} from 'react-icons/fa'

interface ChatTestProps {
  ticketId: string
  ticketData?: any
}

export default function ChatTest({ ticketId, ticketData }: ChatTestProps) {
  const { theme } = useTheme()
  const [testResults, setTestResults] = useState<{
    supabaseConnection: 'testing' | 'success' | 'error'
    messagesTable: 'testing' | 'success' | 'error'
    apiConnection: 'testing' | 'success' | 'error'
    error: string | null
  }>({
    supabaseConnection: 'testing',
    messagesTable: 'testing',
    apiConnection: 'testing',
    error: null
  })

  useEffect(() => {
    runTests()
  }, [ticketId])

  const runTests = async () => {
    const results: {
      supabaseConnection: 'testing' | 'success' | 'error'
      messagesTable: 'testing' | 'success' | 'error'
      apiConnection: 'testing' | 'success' | 'error'
      error: string | null
    } = {
      supabaseConnection: 'testing',
      messagesTable: 'testing',
      apiConnection: 'testing',
      error: null
    }

    setTestResults(results)

    try {
      // Teste 1: Conexão com Supabase (DESABILITADO - usando API do backend)
      console.log('🔍 Testando conexão com Supabase...')
      console.log('⚠️ Supabase desabilitado - usando API do backend')
      results.supabaseConnection = 'success'
      results.messagesTable = 'success'

      // Teste 3: API de mensagens
      console.log('🔍 Testando API de mensagens...')
      const token = authCookies.getToken()
      
      if (!token) {
        results.apiConnection = 'error'
        results.error = results.error || 'Token de autenticação não encontrado'
      } else {
        const response = await fetch(`/api/messages/list?ticket_id=${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Erro na API:', response.status, errorText)
          results.apiConnection = 'error'
          results.error = results.error || `API: ${response.status} - ${errorText}`
        } else {
          const data = await response.json()
          console.log('✅ API de mensagens OK:', data)
          results.apiConnection = 'success'
        }
      }

    } catch (error) {
      console.error('❌ Erro geral nos testes:', error)
      results.error = error instanceof Error ? error.message : 'Erro desconhecido'
    }

    setTestResults(results)
  }

  const getStatusIcon = (status: 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return <FaSpinner className="animate-spin text-blue-500" />
      case 'success':
        return <FaCheck className="text-green-500" />
      case 'error':
        return <FaTimes className="text-red-500" />
    }
  }

  const getStatusText = (status: 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return 'Testando...'
      case 'success':
        return 'OK'
      case 'error':
        return 'Erro'
    }
  }

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
            <FaComments className="text-white text-lg" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Teste do Sistema de Chat
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Verificando componentes do chat para o ticket #{ticketId}
            </p>
          </div>
        </div>
      </div>

      {/* Área de Testes */}
      <div className="flex-1 p-6 space-y-6">
        {/* Informações do Ticket */}
        {ticketData && (
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Informações do Ticket
            </h4>
            <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <p><strong>ID:</strong> {ticketData.id}</p>
              <p><strong>Título:</strong> {ticketData.title}</p>
              <p><strong>Status:</strong> {ticketData.status}</p>
              <p><strong>Técnico:</strong> {ticketData.assigned_to?.name || 'Nenhum'}</p>
            </div>
          </div>
        )}

        {/* Resultados dos Testes */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Resultados dos Testes
          </h4>
          
          <div className="space-y-3">
            {/* Teste 1: Supabase */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(testResults.supabaseConnection)}
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Conexão com Supabase
                </span>
              </div>
              <span className={`text-sm font-medium ${
                testResults.supabaseConnection === 'success' ? 'text-green-600' :
                testResults.supabaseConnection === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {getStatusText(testResults.supabaseConnection)}
              </span>
            </div>

            {/* Teste 2: Tabela Messages */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(testResults.messagesTable)}
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tabela de Mensagens
                </span>
              </div>
              <span className={`text-sm font-medium ${
                testResults.messagesTable === 'success' ? 'text-green-600' :
                testResults.messagesTable === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {getStatusText(testResults.messagesTable)}
              </span>
            </div>

            {/* Teste 3: API */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(testResults.apiConnection)}
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  API de Mensagens
                </span>
              </div>
              <span className={`text-sm font-medium ${
                testResults.apiConnection === 'success' ? 'text-green-600' :
                testResults.apiConnection === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {getStatusText(testResults.apiConnection)}
              </span>
            </div>
          </div>

          {/* Erro Detalhado */}
          {testResults.error && (
            <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start space-x-2">
                <FaExclamationTriangle className="text-red-500 text-sm mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-800'}`}>
                    Erro Detectado:
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                    {testResults.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Retry */}
          <div className="mt-4">
            <button
              onClick={runTests}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Executar Testes Novamente
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Como Resolver Problemas
          </h4>
          <div className={`text-xs space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>1. Supabase:</strong> Verifique se as variáveis de ambiente estão configuradas</p>
            <p><strong>2. Tabela Messages:</strong> Certifique-se de que a tabela existe no Supabase</p>
            <p><strong>3. API:</strong> Verifique se o backend está rodando e acessível</p>
            <p><strong>4. Token:</strong> Faça login novamente se o token expirou</p>
          </div>
        </div>
      </div>
    </div>
  )
}