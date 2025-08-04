# Sistema de Helpdesk SENAI - Backend

## Visão Geral

Este é o backend do sistema de helpdesk do SENAI, implementado com Node.js, Express e Prisma. O sistema suporta três tipos de usuários com funcionalidades específicas:

### 👨‍💼 Administrador (Admin)
- **Controle Total**: Gerenciamento completo do sistema
- **Usuários**: Criar, editar, excluir e ativar/desativar contas
- **Tickets**: Visualizar todos, atribuir, reatribuir e fechar tickets
- **Configurações**: Gerenciar categorias, templates, SLA e configurações do sistema
- **Relatórios**: Gerar estatísticas e relatórios detalhados

### 👷 Profissional (Client)
- **Chamados**: Criar tickets informando problemas e anexar arquivos
- **Acompanhamento**: Consultar status dos tickets criados
- **Comunicação**: Adicionar comentários públicos aos tickets
- **Avaliação**: Avaliar atendimento após conclusão
- **Histórico**: Visualizar histórico de tickets criados

### 🔧 Técnico (Agent)
- **Tickets Atribuídos**: Visualizar e gerenciar tickets atribuídos
- **Controle de Status**: Alterar status dos tickets (Em andamento, Resolvido, etc.)
- **Comunicação**: Adicionar comentários técnicos e solicitar informações
- **Anexos**: Fazer upload de relatórios e fotos
- **Histórico**: Visualizar histórico dos tickets atendidos

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Zod** - Validação de dados

## Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/          # Controladores da aplicação
│   │   ├── AdminController.js
│   │   ├── AgentController.js
│   │   ├── ClientController.js
│   │   ├── TicketController.js
│   │   └── ...
│   ├── routes/              # Definição das rotas
│   │   ├── adminRoute.js
│   │   ├── agentRoute.js
│   │   ├── clientRoute.js
│   │   └── ...
│   ├── middlewares/         # Middlewares de autenticação
│   ├── models/              # Modelos de dados
│   ├── schemas/             # Schemas de validação
│   └── utils/               # Utilitários
├── prisma/
│   └── schema.prisma        # Schema do banco de dados
└── server.js                # Arquivo principal
```

## Instalação e Configuração

### Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL
- npm ou yarn

### Configuração

1. **Clone o repositório**
```bash
git clone <repository-url>
cd backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/helpdesk_db"
DIRECT_URL="postgresql://username:password@localhost:5432/helpdesk_db"
JWT_SECRET="your-secret-key"
```

4. **Configure o banco de dados**
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular dados iniciais (opcional)
npm run seed
```

5. **Inicie o servidor**
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## API Endpoints

### Autenticação
- `POST /login` - Login de usuário

### Administrador
- `GET /admin/status` - Estatísticas gerais
- `GET /admin/reports` - Relatórios detalhados
- `PUT /admin/user/:userId/status` - Ativar/desativar usuário
- `PUT /admin/user/:userId/role` - Alterar papel do usuário
- `PUT /admin/ticket/:ticketId/reassign` - Reatribuir ticket
- `POST /admin/category` - Criar categoria
- `POST /admin/template` - Criar template de resposta
- `POST /admin/sla` - Criar SLA

### Profissional (Client)
- `GET /helpdesk/client/my-tickets` - Meus tickets
- `GET /helpdesk/client/my-history` - Histórico de tickets
- `POST /helpdesk/client/ticket` - Criar novo ticket
- `POST /helpdesk/client/ticket/:ticketId/rate` - Avaliar atendimento
- `POST /helpdesk/client/ticket/:ticketId/comment` - Adicionar comentário
- `GET /helpdesk/client/my-statistics` - Estatísticas pessoais

### Técnico (Agent)
- `GET /helpdesk/agents/my-tickets` - Tickets atribuídos
- `GET /helpdesk/agents/my-history` - Histórico de atendimentos
- `PUT /helpdesk/agents/ticket/:ticketId/status` - Alterar status
- `POST /helpdesk/agents/ticket/:ticketId/comment` - Comentário técnico
- `POST /helpdesk/agents/ticket/:ticketId/request-info` - Solicitar informações
- `GET /helpdesk/agents/my-statistics` - Estatísticas pessoais

## Modelos de Dados

### User
- `id` - ID único
- `name` - Nome do usuário
- `email` - Email único
- `role` - Papel (Admin, Agent, Client)
- `is_active` - Status da conta

### Ticket
- `ticket_number` - Número único do ticket
- `title` - Título do problema
- `description` - Descrição detalhada
- `priority` - Prioridade (Low, Medium, High, Critical)
- `status` - Status atual
- `satisfaction_rating` - Avaliação do cliente (1-5)

### Agent
- `employee_id` - ID do funcionário
- `department` - Departamento
- `skills` - Habilidades técnicas
- `max_tickets` - Máximo de tickets simultâneos

### Client
- `company` - Empresa
- `client_type` - Tipo de cliente

## Funcionalidades Implementadas

### ✅ Gerenciamento de Usuários
- [x] Criar, editar e excluir usuários
- [x] Ativar/desativar contas
- [x] Alterar papéis (Admin, Agent, Client)
- [x] Controle de permissões por papel

### ✅ Sistema de Tickets
- [x] Criar tickets com informações detalhadas
- [x] Atribuir tickets a técnicos
- [x] Alterar status dos tickets
- [x] Sistema de comentários (públicos e internos)
- [x] Upload de anexos
- [x] Histórico de mudanças

### ✅ Comunicação
- [x] Comentários públicos para clientes
- [x] Comentários técnicos internos
- [x] Solicitação de informações adicionais
- [x] Notificações de mudanças de status

### ✅ Avaliação e Feedback
- [x] Sistema de avaliação (1-5 estrelas)
- [x] Feedback textual opcional
- [x] Estatísticas de satisfação

### ✅ Relatórios e Estatísticas
- [x] Estatísticas por usuário
- [x] Relatórios por período
- [x] Métricas de tempo de resolução
- [x] Análise por categoria e prioridade

### ✅ Configurações do Sistema
- [x] Gerenciamento de categorias
- [x] Templates de resposta
- [x] Configuração de SLA
- [x] Configurações gerais do sistema

## Segurança

- **Autenticação JWT**: Tokens seguros para autenticação
- **Autorização por Papel**: Controle de acesso baseado em roles
- **Validação de Dados**: Validação rigorosa com Zod
- **Sanitização**: Proteção contra injeção de dados
- **Controle de Sessão**: Verificação de tokens expirados

## Desenvolvimento

### Scripts Disponíveis

```bash
npm start          # Iniciar servidor
npm run dev        # Modo desenvolvimento
npm run seed       # Popular banco com dados de teste
npm run migrate    # Executar migrações
npm run generate   # Gerar cliente Prisma
```

### Estrutura de Desenvolvimento

1. **Controllers**: Lógica de negócio
2. **Routes**: Definição de endpoints
3. **Middlewares**: Autenticação e autorização
4. **Schemas**: Validação de dados
5. **Models**: Interação com banco de dados

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

