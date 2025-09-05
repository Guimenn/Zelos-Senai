# 🎯 Guia do Botão de Chat Inteligente

## ✨ Funcionalidades do Novo Sistema

### 🎯 **Botão Inteligente**
- ✅ **Só aparece quando o técnico aceita o chamado**
- ✅ **Estados visuais diferentes** (carregando, erro, indisponível)
- ✅ **Informações do técnico** no botão
- ✅ **Múltiplos tamanhos e estilos**

### 🎨 **Modal Bonito**
- ✅ **Design moderno** com backdrop blur
- ✅ **Informações do ticket** no header
- ✅ **Participantes** (cliente e técnico)
- ✅ **Status e prioridade** visíveis
- ✅ **Responsivo** para mobile e desktop
- ✅ **Fechar com ESC** ou clique fora

## 🚀 Como Implementar

### 1. **Importar o Componente**

```tsx
import ChatButton from '../components/chat/ChatButton'
```

### 2. **Usar em Qualquer Página de Ticket**

```tsx
function TicketDetailPage({ ticketId }: { ticketId: string }) {
  return (
    <div>
      {/* Seu conteúdo do ticket */}
      
      {/* Botão de chat - só aparece quando técnico aceita */}
      <ChatButton 
        ticketId={ticketId}
        size="md"
        variant="primary"
      />
    </div>
  )
}
```

### 3. **Personalizar o Botão**

```tsx
// Tamanhos disponíveis
<ChatButton ticketId="123" size="sm" />   // Pequeno
<ChatButton ticketId="123" size="md" />   // Médio (padrão)
<ChatButton ticketId="123" size="lg" />   // Grande

// Estilos disponíveis
<ChatButton ticketId="123" variant="primary" />   // Vermelho (padrão)
<ChatButton ticketId="123" variant="secondary" /> // Cinza
<ChatButton ticketId="123" variant="outline" />   // Contorno
```

## 🎭 Estados do Botão

### 1. **Carregando**
```tsx
// Mostra spinner enquanto verifica disponibilidade
<button disabled>
  <FaSpinner className="animate-spin" />
  Verificando...
</button>
```

### 2. **Indisponível**
```tsx
// Não renderiza nada quando técnico não aceitou
// Ou mostra "Aguardando técnico" se quiser feedback visual
```

### 3. **Disponível**
```tsx
// Mostra botão com nome do técnico
<button>
  <FaComments />
  Chat
  <FaUserTie />
  Maria Santos
</button>
```

### 4. **Erro**
```tsx
// Mostra botão de erro que pode ser clicado para tentar novamente
<button onClick={refreshAvailability}>
  <FaExclamationTriangle />
  Erro
</button>
```

## 🎨 Modal do Chat

### **Header do Modal**
- Ícone do chat
- Título "Chat do Chamado"
- Número do ticket
- Título do chamado
- Botão de fechar

### **Informações dos Participantes**
- **Cliente**: Nome e email
- **Técnico**: Nome e email
- **Status**: Open, InProgress, Resolved, etc.
- **Prioridade**: High, Medium, Low

### **Área do Chat**
- Chat completo em tempo real
- Mensagens com bolhas
- Upload de arquivos
- Scroll automático

### **Footer**
- Informações sobre o chat
- Número do chamado

## 🔧 Hook useChatAvailability

### **Funcionalidades**
- ✅ Verifica se o chat está disponível
- ✅ Busca dados do ticket automaticamente
- ✅ Atualiza quando o ticket muda
- ✅ Trata erros de forma elegante

### **Uso**
```tsx
import { useChatAvailability } from '../hooks/useChatAvailability'

function MyComponent({ ticketId }: { ticketId: string }) {
  const { 
    isAvailable, 
    isLoading, 
    error, 
    ticketData, 
    refreshAvailability 
  } = useChatAvailability(ticketId)

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  if (!isAvailable) return <div>Chat não disponível</div>

  return <div>Chat disponível!</div>
}
```

## 📱 Responsividade

### **Desktop**
- Modal com largura máxima de 4xl
- Altura de 80vh
- Layout em duas colunas

### **Mobile**
- Modal ocupa toda a tela
- Altura de 90vh
- Layout em uma coluna
- Botões maiores para touch

## 🎯 Condições para o Chat Aparecer

### **Chat Disponível Quando:**
1. ✅ Ticket tem técnico atribuído (`assigned_to`)
2. ✅ Status não é 'Closed' ou 'Cancelled'
3. ✅ Usuário tem permissão para acessar o ticket

### **Chat Indisponível Quando:**
1. ❌ Nenhum técnico atribuído
2. ❌ Ticket fechado ou cancelado
3. ❌ Usuário sem permissão
4. ❌ Erro na verificação

## 🚀 Exemplo Completo

```tsx
'use client'

import React from 'react'
import ChatButton from '../components/chat/ChatButton'

export default function TicketPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header do ticket */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meu Chamado</h1>
          
          {/* Botão de chat - só aparece quando técnico aceita */}
          <ChatButton 
            ticketId={ticketId}
            size="md"
            variant="primary"
          />
        </div>
      </div>

      {/* Conteúdo do ticket */}
      <div className="bg-white rounded-xl p-6">
        <p>Descrição do problema...</p>
      </div>
    </div>
  )
}
```

## 🎨 Personalização

### **Cores do Botão**
```tsx
// Primary (padrão) - Vermelho
className="bg-gradient-to-r from-red-500 to-red-600"

// Secondary - Cinza
className="bg-gray-100 text-gray-900"

// Outline - Contorno
className="border border-gray-300"
```

### **Tamanhos**
```tsx
// Small
className="px-3 py-2 text-sm"

// Medium (padrão)
className="px-4 py-3 text-base"

// Large
className="px-6 py-4 text-lg"
```

## 🔍 Debugging

### **Verificar Estados**
```tsx
const { isAvailable, isLoading, error, ticketData } = useChatAvailability(ticketId)

console.log('Chat disponível:', isAvailable)
console.log('Carregando:', isLoading)
console.log('Erro:', error)
console.log('Dados do ticket:', ticketData)
```

### **Logs Úteis**
- Verificar se ticket tem `assigned_to`
- Verificar status do ticket
- Verificar permissões do usuário
- Verificar resposta da API

---

🎉 **Agora você tem um sistema de chat completo e inteligente!**
