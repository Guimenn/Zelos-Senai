# 🔗 Exemplo de Integração - ChatButton

## 📋 Como Adicionar o ChatButton em Páginas Existentes

### 1. **Em Páginas de Lista de Tickets**

```tsx
// Em qualquer página que lista tickets
import ChatButton from '../components/chat/ChatButton'

function TicketListPage() {
  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id} className="ticket-card">
          <h3>{ticket.title}</h3>
          <p>#{ticket.ticket_number}</p>
          
          {/* Adicionar o botão de chat */}
          <div className="flex justify-end mt-4">
            <ChatButton 
              ticketId={ticket.id}
              size="sm"
              variant="outline"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. **Em Páginas de Detalhes do Ticket**

```tsx
// Em páginas de detalhes do ticket
import ChatButton from '../components/chat/ChatButton'

function TicketDetailPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header do ticket */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Título do Chamado</h1>
            <p className="text-gray-600">#TK-2024-001</p>
          </div>
          
          {/* Botão de chat no header */}
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

### 3. **Em Cards de Ticket**

```tsx
// Em cards de ticket
import ChatButton from '../components/chat/ChatButton'

function TicketCard({ ticket }: { ticket: any }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{ticket.title}</h3>
          <p className="text-sm text-gray-600">#{ticket.ticket_number}</p>
        </div>
        
        {/* Botão de chat no card */}
        <ChatButton 
          ticketId={ticket.id}
          size="sm"
          variant="secondary"
        />
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{ticket.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${
          ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
          ticket.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {ticket.status}
        </span>
      </div>
    </div>
  )
}
```

### 4. **Em Modais de Ticket**

```tsx
// Em modais que mostram detalhes do ticket
import ChatButton from '../components/chat/ChatButton'

function TicketModal({ ticket, isOpen, onClose }: { ticket: any, isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{ticket.title}</h2>
              <p className="text-gray-600">#{ticket.ticket_number}</p>
            </div>
            
            {/* Botão de chat no modal */}
            <div className="flex items-center space-x-3">
              <ChatButton 
                ticketId={ticket.id}
                size="sm"
                variant="primary"
              />
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo do modal */}
        <div className="p-6">
          <p>{ticket.description}</p>
        </div>
      </div>
    </div>
  )
}
```

## 🎯 Posicionamentos Recomendados

### 1. **Header do Ticket** (Mais Visível)
```tsx
<div className="flex items-center justify-between">
  <h1>Título do Ticket</h1>
  <ChatButton ticketId={ticketId} />
</div>
```

### 2. **Barra de Ações** (Com Outros Botões)
```tsx
<div className="flex items-center space-x-3">
  <button>Editar</button>
  <button>Fechar</button>
  <ChatButton ticketId={ticketId} />
</div>
```

### 3. **Sidebar** (Para Informações)
```tsx
<div className="sidebar">
  <div className="info-section">
    <h3>Informações</h3>
    <p>Cliente: João Silva</p>
    <p>Técnico: Maria Santos</p>
  </div>
  
  <div className="actions-section">
    <ChatButton ticketId={ticketId} />
  </div>
</div>
```

### 4. **Footer do Card** (Discreto)
```tsx
<div className="card-footer">
  <div className="flex items-center justify-between">
    <span>Status: {ticket.status}</span>
    <ChatButton ticketId={ticketId} size="sm" />
  </div>
</div>
```

## 🎨 Estilos por Contexto

### **Páginas Principais** (Destaque)
```tsx
<ChatButton 
  ticketId={ticketId}
  size="md"
  variant="primary"
/>
```

### **Listas** (Discreto)
```tsx
<ChatButton 
  ticketId={ticketId}
  size="sm"
  variant="outline"
/>
```

### **Cards** (Secundário)
```tsx
<ChatButton 
  ticketId={ticketId}
  size="sm"
  variant="secondary"
/>
```

### **Modais** (Compacto)
```tsx
<ChatButton 
  ticketId={ticketId}
  size="sm"
  variant="primary"
/>
```

## 🔧 Integração com Estados Existentes

### **Com Loading States**
```tsx
function TicketPage({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <div>Carregando ticket...</div>
  }

  return (
    <div>
      <h1>{ticket.title}</h1>
      
      {/* O ChatButton tem seu próprio loading state */}
      <ChatButton ticketId={ticketId} />
    </div>
  )
}
```

### **Com Error States**
```tsx
function TicketPage({ ticketId }: { ticketId: string }) {
  const [error, setError] = useState(null)

  if (error) {
    return <div>Erro ao carregar ticket</div>
  }

  return (
    <div>
      <h1>Ticket</h1>
      
      {/* O ChatButton trata seus próprios erros */}
      <ChatButton ticketId={ticketId} />
    </div>
  )
}
```

## 📱 Responsividade

### **Desktop**
```tsx
<div className="hidden md:flex items-center space-x-3">
  <button>Editar</button>
  <ChatButton ticketId={ticketId} size="md" />
</div>
```

### **Mobile**
```tsx
<div className="md:hidden flex items-center space-x-2">
  <ChatButton ticketId={ticketId} size="sm" />
  <button>Menu</button>
</div>
```

## 🎯 Dicas de UX

### 1. **Sempre no Topo**
- Coloque o botão onde é fácil de encontrar
- Evite esconder em menus ou dropdowns

### 2. **Feedback Visual**
- O botão já tem estados visuais
- Use cores que contrastem com o fundo

### 3. **Contexto**
- Mostre informações do técnico quando disponível
- Indique quando o chat não está disponível

### 4. **Acessibilidade**
- O botão já tem títulos (tooltips)
- Use tamanhos adequados para touch

---

🎉 **Agora você pode integrar o chat em qualquer página do sistema!**
