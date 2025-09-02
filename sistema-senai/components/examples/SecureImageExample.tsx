'use client'

import React from 'react'
import SecureImage from '../common/SecureImage'
import { SupabaseImage, useSupabaseImage } from '../../utils/supabaseImage'

/**
 * Exemplo de como usar o SecureImage para resolver problemas SSL
 * Substitua suas tags <img> por este componente
 */

export default function SecureImageExample() {
  // Exemplo de URL problemática do Supabase
  const problematicImageUrl = 'https://pyrxlymsoidmjxjenesb.supabase.co/storage/v1/object/public/avatars/user-1756324628127.jpg'
  
  // Hook para gerenciar estado da imagem
  const { isLoading, url, error, retry } = useSupabaseImage(problematicImageUrl)

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Exemplo de Uso do SecureImage</h2>
      
      {/* ❌ ANTES: Tag img normal (pode dar erro SSL) */}
      <div>
        <h3 className="text-lg font-semibold mb-2">❌ Antes (pode dar erro SSL):</h3>
        <img 
          src={problematicImageUrl}
          alt="Avatar (pode falhar)"
          className="w-16 h-16 rounded-full object-cover"
        />
        <p className="text-sm text-gray-600 mt-1">
          Esta imagem pode falhar com erro SSL no navegador
        </p>
      </div>

      {/* ✅ DEPOIS: Usando SecureImage */}
      <div>
        <h3 className="text-lg font-semibold mb-2">✅ Depois (com fallback automático):</h3>
        <SecureImage
          src={problematicImageUrl}
          alt="Avatar seguro"
          fallbackIcon="user"
          size="lg"
          onError={() => console.log('Erro ao carregar imagem')}
          onLoad={() => console.log('Imagem carregada com sucesso')}
        />
        <p className="text-sm text-gray-600 mt-1">
          Esta imagem tem fallback automático e retry em caso de erro
        </p>
      </div>

      {/* 🔧 Usando SupabaseImage (mais específico para Supabase) */}
      <div>
        <h3 className="text-lg font-semibold mb-2">🔧 Usando SupabaseImage:</h3>
        <SupabaseImage
          src={problematicImageUrl}
          alt="Avatar Supabase"
          fallbackIcon="user"
          size="lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Componente específico para imagens do Supabase com estratégias de retry
        </p>
      </div>

      {/* 📊 Estado da imagem usando hook */}
      <div>
        <h3 className="text-lg font-semibold mb-2">📊 Estado da imagem (usando hook):</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            {isLoading && <span className="text-blue-500">🔄 Carregando...</span>}
            {error && <span className="text-red-500">❌ Erro: {error}</span>}
            {url && !isLoading && !error && <span className="text-green-500">✅ Carregada</span>}
          </div>
          
          {url && (
            <div className="flex items-center space-x-2">
              <span>URL:</span>
              <span className="text-sm text-gray-600 font-mono">{url}</span>
            </div>
          )}
          
          {error && (
            <button
              onClick={retry}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Tentar Novamente
            </button>
          )}
        </div>
      </div>

      {/* 📝 Como implementar em seus componentes */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📝 Como implementar:</h3>
        <div className="space-y-2 text-sm">
          <p><strong>1.</strong> Substitua suas tags &lt;img&gt;:</p>
          <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// ❌ ANTES
<img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />

// ✅ DEPOIS
<SecureImage 
  src={user.avatar} 
  alt={user.name} 
  fallbackIcon="user"
  size="md"
/>`}
          </pre>
          
          <p><strong>2.</strong> Para componentes específicos do Supabase:</p>
          <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// ✅ Para imagens do Supabase
<SupabaseImage 
  src={user.avatar} 
  alt={user.name} 
  fallbackIcon="user"
  size="md"
/>`}
          </pre>
          
          <p><strong>3.</strong> Usando o hook para lógica customizada:</p>
          <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`const { isLoading, url, error, retry } = useSupabaseImage(user.avatar)

if (isLoading) return <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full" />
if (error) return <button onClick={retry}>🔄 Tentar Novamente</button>
if (url) return <img src={url} alt={user.name} className="w-12 h-12 rounded-full" />`}
          </pre>
        </div>
      </div>

      {/* 🎯 Benefícios */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-green-800">🎯 Benefícios:</h3>
        <ul className="space-y-1 text-sm text-green-700">
          <li>✅ Resolve automaticamente problemas SSL</li>
          <li>✅ Fallback para ícones quando imagem falha</li>
          <li>✅ Retry automático com diferentes estratégias</li>
          <li>✅ Loading states e error handling</li>
          <li>✅ Cache e otimizações automáticas</li>
          <li>✅ Suporte a diferentes tamanhos e tipos</li>
        </ul>
      </div>
    </div>
  )
}
