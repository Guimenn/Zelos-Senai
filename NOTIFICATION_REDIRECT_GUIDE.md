# Guia de Redirecionamento de Notificações

## Visão Geral

Este sistema implementa redirecionamento inteligente de notificações baseado no tipo de notificação e seus metadados. Quando um usuário clica em uma notificação, ele é automaticamente direcionado para a página correspondente ao contexto da notificação.

## Funcionalidades Implementadas

### 1. Redirecionamento Baseado em Tipo de Notificação

O sistema suporta os seguintes tipos de redirecionamento:

#### Chamados (Tickets)
- **Tipos suportados**: `TICKET_CREATED`, `TICKET_UPDATED`, `TICKET_ASSIGNED`, `TICKET_ACCEPTED`, `TICKET_COMPLETED`, `TICKET_ON_HOLD`, `TICKET_REJECTED`, `TICKET_REOPENED`, `TICKET_EXPIRED`, `COMMENT_ADDED`
- **Redirecionamento**: Para `/called?ticketId={id}` - abre o modal de visualização do chamado
- **Metadados necessários**: `ticketId`

#### Atribuições de Tickets
- **Tipos suportados**: `ASSIGNMENT_REQUEST`, `ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_REJECTED`
- **Redirecionamento**: Para `/called?ticketId={id}` - abre o modal de visualização do chamado
- **Metadados necessários**: `ticketId`

#### Usuários
- **Tipos suportados**: `USER_CREATED`, `USER_DELETED`, `USER_STATUS_CHANGED`, `USER_ROLE_CHANGED`
- **Redirecionamento**: Para `/employees/{userId}` - página do funcionário específico
- **Metadados necessários**: `userId`

#### Equipe
- **Tipos suportados**: `TEAM_MEMBER_ADDED`, `TEAM_MEMBER_REMOVED`
- **Redirecionamento**: Para `/employees` - lista de funcionários

#### Avaliações
- **Tipos suportados**: `AGENT_EVALUATION`
- **Redirecionamento**: Para `/perfil` - página de perfil

#### Alertas Administrativos
- **Tipos suportados**: `UNASSIGNED_TICKETS_ALERT`, `HIGH_VOLUME_ALERT`
- **Redirecionamento**: Para `/reports` - página de relatórios

### 2. Fallback para Notificações Sem Redirecionamento

Se uma notificação não tiver um tipo de redirecionamento específico ou metadados necessários, o sistema:
1. Marca a notificação como lida
2. Abre um modal com os detalhes completos da notificação

## Arquivos Modificados

### Frontend (sistema-senai/)

1. **`types/index.ts`**
   - Adicionada interface `Notification` com suporte a metadados

2. **`utils/notificationRedirect.ts`** (novo)
   - Função centralizada para redirecionamento de notificações
   - Lógica de mapeamento de tipos para URLs

3. **`components/notification-popup.tsx`**
   - Atualizada para incluir metadados das notificações
   - Integrada com função de redirecionamento
   - Suporte a fallback para modal de detalhes

4. **`app/pages/notifications/page.tsx`**
   - Atualizada para incluir metadados das notificações
   - Integrada com função de redirecionamento
   - Suporte a fallback para modal de detalhes

5. **`app/pages/called/page.tsx`**
   - Adicionado suporte a parâmetro `ticketId` na URL
   - Abertura automática do modal de visualização do chamado
   - Carregamento de detalhes completos do chamado

## Como Funciona

### 1. Criação de Notificações (Backend)

As notificações são criadas com metadados específicos:

```javascript
// Exemplo: Notificação de chamado criado
await createNotification({
  user_id: userId,
  type: 'TICKET_CREATED',
  title: 'Novo chamado criado',
  message: `Chamado #${ticket.ticket_number} foi criado`,
  category: 'info',
  metadata: { 
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number 
  }
})
```

### 2. Carregamento de Notificações (Frontend)

As notificações são carregadas incluindo os metadados:

```typescript
const items = notifications.map((n: any) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.category,
  isRead: !!n.is_read,
  date: new Date(n.created_at),
  category: n.type,
  metadata: n.metadata || {} // Incluindo metadados
}))
```

### 3. Clique na Notificação

Quando o usuário clica em uma notificação:

```typescript
const openNotificationDetails = (notification: Notification) => {
  markAsRead(notification.id)
  
  // Tentar redirecionar baseado no tipo
  const wasRedirected = redirectToNotificationTarget(notification, onClose)
  
  // Se não foi redirecionado, mostrar modal
  if (!wasRedirected) {
    setSelectedNotification(notification)
    setIsModalOpen(true)
  }
}
```

### 4. Redirecionamento Inteligente

A função `redirectToNotificationTarget` analisa o tipo e metadados:

```typescript
switch (category) {
  case 'TICKET_CREATED':
    if (metadata?.ticketId) {
      window.location.href = `/called?ticketId=${metadata.ticketId}`
      return true
    }
    break
  // ... outros casos
}
```

### 5. Abertura Automática do Modal

A página de chamados detecta o parâmetro `ticketId` e abre o modal:

```typescript
useEffect(() => {
  const ticketId = searchParams?.get('ticketId')
  if (ticketId && tickets.length > 0) {
    // Abrir modal e carregar detalhes
    setViewModal({ open: true, loading: true, ticket: null })
    // ... carregar detalhes do ticket
  }
}, [searchParams, tickets])
```

## Benefícios

1. **Experiência do Usuário Melhorada**: Redirecionamento direto para o contexto relevante
2. **Navegação Intuitiva**: O usuário vai direto para onde precisa estar
3. **Flexibilidade**: Suporte a diferentes tipos de notificação
4. **Fallback Seguro**: Modal de detalhes para notificações sem redirecionamento
5. **Código Centralizado**: Lógica de redirecionamento reutilizável

## Exemplos de Uso

### Notificação de Chamado Criado
- **Tipo**: `TICKET_CREATED`
- **Metadados**: `{ ticketId: 123 }`
- **Resultado**: Usuário é redirecionado para `/called?ticketId=123` e o modal do chamado abre automaticamente

### Notificação de Usuário Criado
- **Tipo**: `USER_CREATED`
- **Metadados**: `{ userId: 456 }`
- **Resultado**: Usuário é redirecionado para `/employees/456`

### Notificação Sem Redirecionamento
- **Tipo**: `SYSTEM_MAINTENANCE`
- **Metadados**: `{}`
- **Resultado**: Modal de detalhes é aberto com a notificação completa

## Manutenção e Extensibilidade

Para adicionar novos tipos de redirecionamento:

1. Adicione o novo caso no `utils/notificationRedirect.ts`
2. Defina os metadados necessários
3. Especifique a URL de redirecionamento
4. Atualize a documentação

O sistema é facilmente extensível e mantém a consistência através da função centralizada.
