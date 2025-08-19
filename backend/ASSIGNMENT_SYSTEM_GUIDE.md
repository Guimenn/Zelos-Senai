# Sistema de Atribuição de Tickets

## Visão Geral

O sistema de atribuição de tickets permite que quando um chamado é criado e atribuído a uma categoria e subcategoria, ele seja automaticamente mostrado para os técnicos da área, que podem aceitar ou recusar a atribuição.

## Como Funciona

### 1. Criação de Ticket
Quando um ticket é criado:
- O sistema identifica a categoria e subcategoria do ticket
- Busca todos os agentes que trabalham com essa categoria
- Cria automaticamente solicitações de atribuição para cada agente
- Envia notificações para os agentes sobre a nova solicitação

### 2. Processo de Atribuição
- Os agentes recebem notificações sobre novas solicitações
- Podem visualizar detalhes do ticket (título, descrição, prioridade, cliente, etc.)
- Podem aceitar ou recusar a solicitação
- Quando um agente aceita, o ticket é automaticamente atribuído a ele
- As outras solicitações pendentes são automaticamente rejeitadas

## Estrutura do Banco de Dados

### Novas Tabelas

#### `ticket_assignment_request`
- `id`: ID único da solicitação
- `ticket_id`: ID do ticket
- `agent_id`: ID do agente
- `status`: Status da solicitação (Pending, Accepted, Rejected)
- `requested_at`: Data/hora da solicitação
- `responded_at`: Data/hora da resposta (opcional)
- `response_note`: Nota da resposta (opcional)

#### `agent_category`
- `id`: ID único da associação
- `agent_id`: ID do agente
- `category_id`: ID da categoria
- `created_at`: Data de criação

## APIs Disponíveis

### Para Agentes

#### Listar Solicitações Pendentes
```
GET /api/agent/pending-requests
Authorization: Bearer <token>
```

#### Aceitar Solicitação
```
PUT /api/assignment-requests/:request_id/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "response_note": "Aceito o chamado"
}
```

#### Recusar Solicitação
```
PUT /api/assignment-requests/:request_id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "response_note": "Recusado por estar sobrecarregado"
}
```

### Para Administradores

#### Listar Todas as Solicitações de um Ticket
```
GET /api/tickets/:ticket_id/assignment-requests
Authorization: Bearer <token>
```

#### Criar Solicitações Manualmente
```
POST /api/tickets/:ticket_id/assignment-requests
Authorization: Bearer <token>
```

## Configuração

### 1. Associar Agentes a Categorias

Para que um agente receba solicitações de uma categoria, é necessário associá-lo:

```javascript
// Exemplo de associação
await prisma.agentCategory.create({
  data: {
    agent_id: agentId,
    category_id: categoryId
  }
});
```

### 2. Configurar Limite de Tickets

Cada agente tem um limite máximo de tickets simultâneos:

```javascript
// Ao criar um agente
await prisma.agent.create({
  data: {
    user_id: userId,
    employee_id: 'TEC001',
    department: 'TI',
    skills: ['Manutenção', 'Suporte'],
    max_tickets: 10 // Limite máximo
  }
});
```

## Fluxo de Notificações

### 1. Nova Solicitação
- Agente recebe notificação sobre nova solicitação
- Inclui detalhes do ticket (número, categoria, subcategoria)

### 2. Aceitação
- Agente que aceitou recebe confirmação
- Cliente é notificado sobre a atribuição
- Administradores são notificados sobre a atribuição

### 3. Rejeição
- Agente recebe confirmação da rejeição

## Interface do Usuário

### Página de Solicitações de Atribuição
- Localizada em: `/pages/agent/assignment-requests`
- Mostra todas as solicitações pendentes do agente
- Permite aceitar ou recusar solicitações
- Exibe detalhes completos do ticket

### Navegação
- Acessível através do sidebar para agentes
- Menu: Chamados > Solicitações de Atribuição

## Validações

### Ao Aceitar uma Solicitação
- Verifica se o agente não excedeu o limite de tickets
- Verifica se o ticket ainda está disponível
- Rejeita automaticamente outras solicitações pendentes

### Ao Recusar uma Solicitação
- Apenas o próprio agente pode recusar suas solicitações
- Solicitação deve estar pendente

## Teste do Sistema

Execute o script de teste para verificar se tudo está funcionando:

```bash
cd backend
node scripts/test-assignment-system.js
```

Este script irá:
1. Criar um usuário agente
2. Criar uma categoria
3. Associar o agente à categoria
4. Criar um ticket
5. Verificar se as solicitações foram criadas
6. Simular uma aceitação

## Logs e Monitoramento

O sistema registra logs importantes:
- Criação de solicitações de atribuição
- Aceitações e rejeições
- Erros de notificação
- Agentes não encontrados para categorias

## Considerações de Performance

- As solicitações são criadas de forma assíncrona para não impactar a criação do ticket
- Notificações são enviadas em background
- Índices no banco de dados para consultas eficientes

## Próximos Passos

1. Implementar interface para administradores gerenciarem associações agente-categoria
2. Adicionar relatórios de performance dos agentes
3. Implementar sistema de priorização baseado em carga de trabalho
4. Adicionar notificações em tempo real via WebSocket
