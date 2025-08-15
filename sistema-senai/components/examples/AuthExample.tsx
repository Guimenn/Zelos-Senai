'use client'

import React from 'react'
import { useAuth, useRequireAuth, useRequireRole } from '../../hooks/useAuth'

/**
 * Exemplo de componente que demonstra diferentes usos do hook de autenticação
 */
export default function AuthExample() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Exemplos de Uso do Hook de Autenticação</h1>
      
      <PublicPageExample />
      <ProtectedPageExample />
      <AdminOnlyExample />
      <ConditionalContentExample />
    </div>
  )
}

/**
 * Exemplo 1: Página pública com conteúdo condicional
 */
function PublicPageExample() {
  const { user, isAuthenticated, hasRole } = useAuth({ requireAuth: false })

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">1. Página Pública</h2>
      <p className="text-gray-600 mb-3">Esta página é acessível a todos, mas mostra conteúdo diferente para usuários logados.</p>
      
      {isAuthenticated ? (
        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
          <p className="text-green-800">✅ Logado como: <strong>{user?.name}</strong></p>
          <p className="text-green-700">Role: {user?.role || user?.userRole}</p>
          {hasRole('Admin') && (
            <p className="text-blue-600 font-medium">🔧 Você tem acesso administrativo!</p>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
          <p className="text-gray-700">👤 Você não está logado</p>
          <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Fazer Login
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Exemplo 2: Página que requer autenticação
 */
function ProtectedPageExample() {
  const { user, isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">2. Página Protegida</h2>
        <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">2. Página Protegida</h2>
      <p className="text-gray-600 mb-3">Esta página só é acessível para usuários autenticados.</p>
      
      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
        <p className="text-blue-800">🔒 Área protegida acessada com sucesso!</p>
        <p className="text-blue-700">Bem-vindo, <strong>{user?.name}</strong>!</p>
        <p className="text-blue-600">Email: {user?.email}</p>
      </div>
    </div>
  )
}

/**
 * Exemplo 3: Página exclusiva para administradores
 */
function AdminOnlyExample() {
  const { user, isLoading } = useRequireRole(['Admin'])

  if (isLoading) {
    return (
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">3. Área Administrativa</h2>
        <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
        <div className="animate-pulse bg-gray-200 h-4 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">3. Área Administrativa</h2>
      <p className="text-gray-600 mb-3">Esta página só é acessível para administradores.</p>
      
      <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
        <p className="text-red-800">⚡ Painel Administrativo</p>
        <p className="text-red-700">Olá, Admin <strong>{user?.name}</strong>!</p>
        <p className="text-red-600">Você tem acesso total ao sistema.</p>
        
        <div className="mt-3 space-x-2">
          <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
            Gerenciar Usuários
          </button>
          <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
            Configurações
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Exemplo 4: Conteúdo condicional baseado em roles
 */
function ConditionalContentExample() {
  const { user, hasRole, hasAnyRole, getUserRole, logout } = useRequireAuth()

  const userRole = getUserRole()
  const isAdmin = hasRole('Admin')
  const canManageTickets = hasAnyRole(['Admin', 'Agent'])
  const isClient = hasRole('Client')

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">4. Conteúdo Condicional por Role</h2>
      <p className="text-gray-600 mb-3">Diferentes conteúdos baseados na role do usuário.</p>
      
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded">
          <p><strong>Usuário:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {userRole}</p>
        </div>
        
        {isAdmin && (
          <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
            <p className="text-purple-800 font-medium">👑 Seção Administrativa</p>
            <p className="text-purple-700">Apenas administradores veem esta seção</p>
          </div>
        )}
        
        {canManageTickets && (
          <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            <p className="text-yellow-800 font-medium">🎫 Gerenciamento de Tickets</p>
            <p className="text-yellow-700">Admins e Agentes podem gerenciar tickets</p>
          </div>
        )}
        
        {isClient && (
          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
            <p className="text-green-800 font-medium">📝 Área do Cliente</p>
            <p className="text-green-700">Clientes podem criar e acompanhar tickets</p>
          </div>
        )}
        
        <div className="pt-3 border-t">
          <button 
            onClick={logout}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Exemplo de loading state personalizado
 */
export function CustomLoadingExample() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
          <p className="text-sm text-gray-500">Por favor, aguarde</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1>Página carregada!</h1>
      <p>Usuário: {user?.name}</p>
    </div>
  )
}