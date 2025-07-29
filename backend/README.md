# Zelos - Sistema de Helpdesk

Este é um sistema de helpdesk completo desenvolvido para gerenciar tickets de suporte técnico, desenvolvido com Node.js, Express.js, Prisma ORM e PostgreSQL.

## 🚀 Sobre o Projeto

O Zelos é um sistema robusto de helpdesk que permite:

- **Gestão de Tickets**: Criação, acompanhamento e resolução de tickets de suporte
- **Sistema de Usuários**: Administradores, Agentes e Clientes com diferentes níveis de acesso
- **Categorização**: Sistema de categorias e subcategorias para organização dos tickets
- **Comentários**: Sistema de comentários públicos e internos
- **Anexos**: Suporte para upload de arquivos
- **Histórico**: Rastreamento completo de mudanças nos tickets
- **SLA**: Acordos de nível de serviço configuráveis
- **Relatórios**: Estatísticas e relatórios do sistema

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Zod
- **Criptografia**: bcryptjs

## 📋 Pré-requisitos

- Node.js (versão >= 14.x)
- PostgreSQL
- npm ou yarn

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd api-studdy
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
   - Crie um banco PostgreSQL
   - Configure a variável de ambiente `DATABASE_URL` no arquivo `.env`
   - Exemplo: `DATABASE_URL="postgresql://usuario:senha@localhost:5432/zelos"`

4. **Execute as migrações do Prisma**
```bash
npx prisma migrate dev
```

5. **Gere o cliente Prisma**
```bash
npx prisma generate
```

6. **Execute o seed do sistema**
```bash
npm run seed:helpdesk
```

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📊 Estrutura do Banco de Dados

### Principais Tabelas

- **User**: Usuários do sistema (Admin, Agent, Client)
- **Agent**: Agentes de suporte com habilidades específicas
- **Client**: Clientes que abrem tickets
- **Category**: Categorias de tickets
- **Subcategory**: Subcategorias dentro das categorias
- **Ticket**: Tickets de suporte
- **Comment**: Comentários nos tickets
- **Attachment**: Anexos dos tickets
- **TicketHistory**: Histórico de mudanças
- **SLA**: Acordos de nível de serviço

## 🔐 Autenticação e Autorização

O sistema utiliza JWT para autenticação e possui três níveis de usuário:

- **Admin**: Acesso total ao sistema
- **Agent**: Pode gerenciar tickets atribuídos
- **Client**: Pode criar e acompanhar seus próprios tickets

## 📡 Principais Endpoints

### Autenticação
- `POST /login` - Login de usuário

### Tickets
- `GET /helpdesk/tickets` - Listar tickets
- `POST /helpdesk/tickets` - Criar ticket
- `GET /helpdesk/tickets/:id` - Obter ticket específico
- `PUT /helpdesk/tickets/:id` - Atualizar ticket
- `POST /helpdesk/tickets/:id/assign` - Atribuir ticket
- `POST /helpdesk/tickets/:id/close` - Fechar ticket

### Comentários
- `GET /helpdesk/comments/:ticketId` - Listar comentários
- `POST /helpdesk/comments` - Criar comentário

### Categorias
- `GET /helpdesk/categories` - Listar categorias
- `POST /helpdesk/categories` - Criar categoria

### Agentes
- `GET /helpdesk/agents` - Listar agentes
- `POST /helpdesk/agents` - Criar agente

## 👥 Usuários Padrão (Seed)

Após executar o seed, os seguintes usuários estarão disponíveis:

### Administrador
- **Email**: admin@helpdesk.com
- **Senha**: 123456

### Agentes
- **João Silva**: joao@helpdesk.com / 123456
- **Maria Santos**: maria@helpdesk.com / 123456
- **Pedro Costa**: pedro@helpdesk.com / 123456

### Clientes
- **Carlos Oliveira**: cliente1@empresa.com / 123456
- **Ana Pereira**: cliente2@empresa.com / 123456

## 📁 Estrutura do Projeto

```
src/
├── controllers/          # Controladores da API
├── middlewares/          # Middlewares de autenticação e autorização
├── models/              # Modelos de dados
├── routes/              # Definição das rotas
├── schemas/             # Schemas de validação (Zod)
├── utils/               # Utilitários
└── server.js            # Arquivo principal do servidor

prisma/
├── schema.prisma        # Schema do banco de dados
└── client.js           # Cliente Prisma

scripts/
└── seed-helpdesk.js    # Script para popular o banco
```

## 🔧 Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/zelos"
JWT_SECRET="sua-chave-secreta-jwt"
PORT=3000
```

## 📈 Funcionalidades Avançadas

### Sistema de SLA
- Configuração de tempos de resposta e resolução
- Diferentes SLAs por prioridade
- Monitoramento automático de prazos

### Histórico de Mudanças
- Rastreamento completo de alterações nos tickets
- Registro de quem fez cada mudança
- Histórico de atribuições

### Templates de Resposta
- Templates pré-definidos para respostas rápidas
- Categorização de templates
- Sistema de ativação/desativação

### Estatísticas
- Relatórios de performance
- Métricas de resolução
- Análise de satisfação

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através dos canais oficiais do projeto.

