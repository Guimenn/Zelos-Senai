# Guia de Redirecionamento de Notificações

## Visão Geral

O sistema de notificações agora suporta redirecionamento automático quando o usuário clica em uma notificação. Dependendo do tipo de notificação e dos metadados disponíveis, o usuário será redirecionado para a página relevante.

## Como Funciona

### 1. Clique na Notificação
Quando o usuário clica em uma notificação na página `/pages/notifications`, a função `openNotificationDetails` é chamada.

### 2. Verificação de Redirecionamento
A função `redirectToNotificationTarget` verifica:
- O tipo/categoria da notificação
- Os metadados disponíveis (ticketId, userId, etc.)
- Se há uma página correspondente para redirecionar

### 3. Redirecionamento ou Modal
- **Se houver redirecionamento**: O usuário é levado para a página correspondente
- **Se não houver redirecionamento**: Um modal é aberto com os detalhes da notificação

## Tipos de Notificações e Redirecionamentos

### Chamados (Tickets)
**Categorias:**
- `TICKET_CREATED`
- `TICKET_UPDATED`
- `TICKET_ASSIGNED`
- `TICKET_ACCEPTED`
- `TICKET_COMPLETED`
- `TICKET_ON_HOLD`
- `TICKET_REJECTED`
- `TICKET_REOPENED`
- `TICKET_EXPIRED`
- `COMMENT_ADDED`
- `ASSIGNMENT_REQUEST`
- `ASSIGNMENT_ACCEPTED`
- `ASSIGNMENT_REJECTED`

**Redirecionamento:** `/pages/called?ticketId={ticketId}`
**Metadados necessários:** `metadata.ticketId`

### Usuários/Funcionários
**Categorias:**
- `USER_CREATED`
- `USER_DELETED`
- `USER_STATUS_CHANGED`
- `USER_ROLE_CHANGED`

**Redirecionamento:** `/pages/employees/{userId}`
**Metadados necessários:** `metadata.userId`

### Equipe/Técnicos
**Categorias:**
- `TEAM_MEMBER_ADDED`
- `TEAM_MEMBER_REMOVED`

**Redirecionamento:** `/pages/maintenance`
**Metadados necessários:** Nenhum (redirecionamento direto)

### Avaliações de Agentes
**Categoria:** `AGENT_EVALUATION`

**Redirecionamento:** `/pages/perfil?tab=avaliacoes`
**Metadados necessários:** Nenhum (redirecionamento direto)

### Alertas Gerais
**Categorias:**
- `UNASSIGNED_TICKETS_ALERT` → `/pages/called`
- `HIGH_VOLUME_ALERT` → `/pages/reports`

## Estrutura de Metadados

```typescript
interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  date: Date
  category: string
  metadata?: {
    ticketId?: number
    userId?: number
    // outros metadados específicos
  }
}
```

## Páginas de Destino

### Página de Chamados (`/pages/called`)
- **Parâmetro:** `ticketId` na URL
- **Comportamento:** Abre automaticamente o modal de visualização do chamado
- **Implementação:** Já existente na página

### Página de Funcionários (`/pages/employees/[id]`)
- **Parâmetro:** `id` na rota
- **Comportamento:** Carrega os dados do funcionário específico
- **Implementação:** Já existente na página

### Página de Perfil (`/pages/perfil`)
- **Parâmetro:** `tab=avaliacoes` na URL
- **Comportamento:** Abre automaticamente a aba de avaliações
- **Implementação:** Adicionada suporte para parâmetros de URL

## Exemplos de Uso

### Notificação de Chamado Criado
```javascript
{
  id: 1,
  title: 'Novo chamado criado',
  message: 'Chamado #123 foi criado',
  category: 'TICKET_CREATED',
  metadata: { ticketId: 123 }
}
```
**Resultado:** Redireciona para `/pages/called?ticketId=123`

### Notificação de Avaliação
```javascript
{
  id: 2,
  title: 'Avaliação recebida',
  message: 'Você recebeu uma nova avaliação',
  category: 'AGENT_EVALUATION',
  metadata: {}
}
```
**Resultado:** Redireciona para `/pages/perfil?tab=avaliacoes`

### Notificação sem Metadados
```javascript
{
  id: 3,
  title: 'Sistema atualizado',
  message: 'O sistema foi atualizado com novas funcionalidades',
  category: 'SYSTEM_UPDATE',
  metadata: {}
}
```
**Resultado:** Abre modal com detalhes da notificação

## Arquivos Modificados

1. **`/app/pages/notifications/page.tsx`**
   - Adicionado import do utilitário de redirecionamento
   - Modificada função `openNotificationDetails`

2. **`/app/pages/perfil/page.tsx`**
   - Adicionado suporte para parâmetro `tab` na URL
   - Implementada lógica para abrir aba automaticamente

3. **`/utils/notificationRedirect.ts`**
   - Utilitário principal de redirecionamento
   - Lógica para diferentes tipos de notificação

## Testando

Para testar o redirecionamento:

1. Acesse a página de notificações
2. Clique em uma notificação que tenha metadados específicos
3. Verifique se foi redirecionado para a página correta
4. Para notificações sem metadados, verifique se o modal abre

## Debug

O sistema inclui logs de debug que podem ser vistos no console do navegador:
- `Redirecting notification:` - Mostra os dados da notificação
- `Redirecting to ticket:` - Mostra a URL de redirecionamento
- `No redirection for category:` - Indica quando não há redirecionamento
