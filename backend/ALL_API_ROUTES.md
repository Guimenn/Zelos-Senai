# Todas as Rotas da API - Sistema de Helpdesk SENAI

## 📋 Visão Geral

Este documento lista **TODAS** as rotas disponíveis na API do sistema de helpdesk SENAI, organizadas por funcionalidade e tipo de usuário.

## 🔐 Autenticação

**Base URL**: `http://localhost:3000`

**Headers obrigatórios** (exceto login):
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🔑 Autenticação e Usuários

### Login e Perfil
```
POST   /login                    # Login de usuário
GET    /login                    # Obter perfil do usuário autenticado
POST   /login/recovery           # Solicitar recuperação de senha
PUT    /login/new-password       # Definir nova senha
```

### Gerenciamento de Usuários
```
GET    /user                     # Listar todos os usuários
GET    /user/:userId             # Buscar usuário específico
PUT    /user/:userId             # Atualizar dados do usuário
```

---

## 👨‍💼 Administrador (Admin)

### Gerenciamento de Usuários
```
PUT    /admin/user/:userId/status    # Ativar/desativar conta
PUT    /admin/user/:userId/role      # Alterar papel do usuário
```

### Gerenciamento de Agentes
```
GET    /admin/agent                  # Listar todos os agentes
GET    /admin/agent/:agentId         # Buscar agente específico
POST   /admin/agent                  # Criar novo agente
PUT    /admin/agents/:agentId        # Atualizar agente
DELETE /admin/agent/:agentId         # Deletar agente
```

### Gerenciamento de Clientes
```
GET    /admin/client                 # Listar todos os clientes
GET    /admin/client/:clientId       # Buscar cliente específico
POST   /admin/client                 # Criar novo cliente
PUT    /admin/client/:clientId       # Atualizar cliente
DELETE /admin/client/:clientId       # Deletar cliente
```

### Gerenciamento de Tickets
```
PUT    /admin/ticket/:ticketId/reassign  # Reatribuir ticket
PUT    /admin/ticket/:ticketId/close     # Fechar/cancelar ticket
```

### Categorias e Configurações
```
POST   /admin/category              # Criar categoria
POST   /admin/template              # Criar template de resposta
POST   /admin/sla                   # Criar SLA
PUT    /admin/settings              # Atualizar configurações do sistema
```

### Relatórios e Estatísticas
```
GET    /admin/status                # Estatísticas gerais
GET    /admin/reports               # Relatórios detalhados
```

---

## 👷 Profissional (Client)

### Gerenciamento de Tickets
```
GET    /helpdesk/client/my-tickets      # Meus tickets
GET    /helpdesk/client/my-history      # Histórico de tickets
POST   /helpdesk/client/ticket          # Criar novo ticket
GET    /helpdesk/client/ticket/:ticketId # Visualizar ticket
```

### Interação com Tickets
```
POST   /helpdesk/client/ticket/:ticketId/rate     # Avaliar atendimento
POST   /helpdesk/client/ticket/:ticketId/comment  # Adicionar comentário público
```

### Estatísticas Pessoais
```
GET    /helpdesk/client/my-statistics   # Estatísticas pessoais
```

---

## 🔧 Técnico (Agent)

### Gerenciamento de Tickets Atribuídos
```
GET    /helpdesk/agents/my-tickets      # Tickets atribuídos
GET    /helpdesk/agents/my-history      # Histórico de atendimentos
GET    /helpdesk/agents/ticket/:ticketId # Visualizar ticket
```

### Controle de Status
```
PUT    /helpdesk/agents/ticket/:ticketId/status   # Alterar status do ticket
```

### Comunicação
```
POST   /helpdesk/agents/ticket/:ticketId/comment      # Adicionar comentário técnico
POST   /helpdesk/agents/ticket/:ticketId/request-info # Solicitar informações
```

### Estatísticas Pessoais
```
GET    /helpdesk/agents/my-statistics   # Estatísticas pessoais
```

---

## 🎫 Sistema de Tickets (Geral)

### Operações CRUD
```
POST   /helpdesk/tickets              # Criar ticket (Admin, Agent, Client)
GET    /helpdesk/tickets              # Listar tickets (Admin, Agent, Client)
GET    /helpdesk/tickets/:ticketId    # Buscar ticket (Admin, Agent, Client)
PUT    /helpdesk/tickets/:ticketId    # Atualizar ticket (Admin, Agent, Client)
```

### Operações Específicas
```
POST   /helpdesk/tickets/:ticketId/assign  # Atribuir ticket (Admin, Agent)
POST   /helpdesk/tickets/:ticketId/close   # Fechar ticket (Admin, Agent, Client)
```

---

## 💬 Sistema de Comentários

### Comentários de Tickets
```
POST   /helpdesk/tickets/:ticketId/comments    # Adicionar comentário
GET    /helpdesk/tickets/:ticketId/comments    # Listar comentários de um ticket
```

### Comentários Individuais
```
GET    /helpdesk/comments/:commentId    # Buscar comentário específico
PUT    /helpdesk/comments/:commentId    # Atualizar comentário
DELETE /helpdesk/comments/:commentId    # Deletar comentário
```

---

## 📂 Sistema de Categorias

### Categorias
```
POST   /helpdesk/categories                    # Criar categoria (Admin)
GET    /helpdesk/categories                     # Listar categorias (Admin, Agent, Client)
GET    /helpdesk/categories/:categoryId         # Buscar categoria específica (Admin, Agent, Client)
PUT    /helpdesk/categories/:categoryId         # Atualizar categoria (Admin)
DELETE /helpdesk/categories/:categoryId         # Deletar categoria (Admin)
```

### Subcategorias
```
POST   /helpdesk/subcategories                  # Criar subcategoria (Admin)
GET    /helpdesk/categories/:categoryId/subcategories  # Listar subcategorias por categoria (Admin, Agent, Client)
GET    /helpdesk/subcategories/:subcategoryId   # Buscar subcategoria específica (Admin, Agent, Client)
PUT    /helpdesk/subcategories/:subcategoryId   # Atualizar subcategoria (Admin)
DELETE /helpdesk/subcategories/:subcategoryId   # Deletar subcategoria (Admin)
```

---

## 📊 Resumo por Método HTTP

### GET (Leitura)
```
GET    /login                    # Perfil do usuário
GET    /user                     # Listar usuários
GET    /user/:userId             # Buscar usuário
GET    /admin/agent              # Listar agentes
GET    /admin/agent/:agentId     # Buscar agente
GET    /admin/client             # Listar clientes
GET    /admin/client/:clientId   # Buscar cliente
GET    /admin/status             # Estatísticas admin
GET    /admin/reports            # Relatórios admin
GET    /helpdesk/client/my-tickets      # Meus tickets (Client)
GET    /helpdesk/client/my-history      # Histórico (Client)
GET    /helpdesk/client/ticket/:ticketId # Ver ticket (Client)
GET    /helpdesk/client/my-statistics   # Estatísticas (Client)
GET    /helpdesk/agents/my-tickets      # Tickets atribuídos (Agent)
GET    /helpdesk/agents/my-history      # Histórico (Agent)
GET    /helpdesk/agents/ticket/:ticketId # Ver ticket (Agent)
GET    /helpdesk/agents/my-statistics   # Estatísticas (Agent)
GET    /helpdesk/tickets                # Listar tickets
GET    /helpdesk/tickets/:ticketId      # Buscar ticket
GET    /helpdesk/tickets/:ticketId/comments # Comentários do ticket
GET    /helpdesk/comments/:commentId    # Buscar comentário
GET    /helpdesk/categories             # Listar categorias
GET    /helpdesk/categories/:categoryId # Buscar categoria
GET    /helpdesk/categories/:categoryId/subcategories # Subcategorias
GET    /helpdesk/subcategories/:subcategoryId # Buscar subcategoria
```

### POST (Criação)
```
POST   /login                    # Login
POST   /login/recovery           # Recuperar senha
POST   /admin/agent              # Criar agente
POST   /admin/client             # Criar cliente
POST   /admin/category           # Criar categoria
POST   /admin/template           # Criar template
POST   /admin/sla                # Criar SLA
POST   /helpdesk/client/ticket   # Criar ticket (Client)
POST   /helpdesk/client/ticket/:ticketId/rate     # Avaliar (Client)
POST   /helpdesk/client/ticket/:ticketId/comment  # Comentário (Client)
POST   /helpdesk/agents/ticket/:ticketId/comment  # Comentário (Agent)
POST   /helpdesk/agents/ticket/:ticketId/request-info # Solicitar info (Agent)
POST   /helpdesk/tickets         # Criar ticket
POST   /helpdesk/tickets/:ticketId/assign # Atribuir ticket
POST   /helpdesk/tickets/:ticketId/close  # Fechar ticket
POST   /helpdesk/tickets/:ticketId/comments # Adicionar comentário
POST   /helpdesk/categories      # Criar categoria
POST   /helpdesk/subcategories   # Criar subcategoria
```

### PUT (Atualização)
```
PUT    /login/new-password       # Nova senha
PUT    /user/:userId             # Atualizar usuário
PUT    /admin/user/:userId/status # Ativar/desativar usuário
PUT    /admin/user/:userId/role  # Alterar papel
PUT    /admin/agents/:agentId    # Atualizar agente
PUT    /admin/client/:clientId   # Atualizar cliente
PUT    /admin/ticket/:ticketId/reassign # Reatribuir ticket
PUT    /admin/ticket/:ticketId/close    # Fechar ticket
PUT    /admin/settings           # Configurações do sistema
PUT    /helpdesk/agents/ticket/:ticketId/status # Alterar status (Agent)
PUT    /helpdesk/tickets/:ticketId      # Atualizar ticket
PUT    /helpdesk/comments/:commentId    # Atualizar comentário
PUT    /helpdesk/categories/:categoryId # Atualizar categoria
PUT    /helpdesk/subcategories/:subcategoryId # Atualizar subcategoria
```

### DELETE (Exclusão)
```
DELETE /admin/agent/:agentId     # Deletar agente
DELETE /admin/client/:clientId   # Deletar cliente
DELETE /helpdesk/comments/:commentId    # Deletar comentário
DELETE /helpdesk/categories/:categoryId # Deletar categoria
DELETE /helpdesk/subcategories/:subcategoryId # Deletar subcategoria
```

---

## 🔒 Permissões por Rota

### Rotas Públicas
- `POST /login` - Login
- `POST /login/recovery` - Recuperação de senha
- `PUT /login/new-password` - Nova senha

### Rotas Admin (Apenas Admin)
- Todas as rotas `/admin/*`
- `POST /helpdesk/categories` - Criar categoria
- `PUT /helpdesk/categories/:id` - Atualizar categoria
- `DELETE /helpdesk/categories/:id` - Deletar categoria
- `POST /helpdesk/subcategories` - Criar subcategoria
- `PUT /helpdesk/subcategories/:id` - Atualizar subcategoria
- `DELETE /helpdesk/subcategories/:id` - Deletar subcategoria

### Rotas Agent (Admin + Agent)
- `POST /helpdesk/tickets/:id/assign` - Atribuir ticket
- `GET /helpdesk/categories` - Listar categorias
- `GET /helpdesk/categories/:id` - Ver categoria
- `GET /helpdesk/categories/:id/subcategories` - Subcategorias

### Rotas Client (Admin + Agent + Client)
- `POST /helpdesk/tickets` - Criar ticket
- `GET /helpdesk/tickets` - Listar tickets
- `GET /helpdesk/tickets/:id` - Ver ticket
- `PUT /helpdesk/tickets/:id` - Atualizar ticket
- `POST /helpdesk/tickets/:id/close` - Fechar ticket
- `POST /helpdesk/tickets/:id/comments` - Adicionar comentário
- `GET /helpdesk/tickets/:id/comments` - Ver comentários
- `GET /helpdesk/comments/:id` - Ver comentário
- `PUT /helpdesk/comments/:id` - Atualizar comentário
- `DELETE /helpdesk/comments/:id` - Deletar comentário

---

## 📝 Exemplos de Uso

### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@admin.com", "password": "admin123"}'
```

### Criar Ticket (Client)
```bash
curl -X POST http://localhost:3000/helpdesk/client/ticket \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema com projetor",
    "description": "O projetor da sala 101 não está funcionando",
    "priority": "High",
    "category_id": 1
  }'
```

### Alterar Status (Agent)
```bash
curl -X PUT http://localhost:3000/helpdesk/agents/ticket/123/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "InProgress",
    "notes": "Iniciando diagnóstico"
  }'
```

### Avaliar Atendimento (Client)
```bash
curl -X POST http://localhost:3000/helpdesk/client/ticket/123/rate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "satisfaction_rating": 5,
    "feedback": "Atendimento excelente!"
  }'
```

---

## 🎯 Total de Rotas: 67 Endpoints

- **GET**: 25 rotas
- **POST**: 18 rotas  
- **PUT**: 15 rotas
- **DELETE**: 9 rotas

**Organização por funcionalidade:**
- Autenticação: 4 rotas
- Usuários: 3 rotas
- Admin: 18 rotas
- Client: 6 rotas
- Agent: 6 rotas
- Tickets: 6 rotas
- Comentários: 5 rotas
- Categorias: 10 rotas
- Subcategorias: 5 rotas 