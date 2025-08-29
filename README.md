# Sistema de Helpdesk SENAI - Documentação Completa

## 📋 Índice

1. [Introdução](#-introdução)
2. [Visão Geral do Sistema](#️-visão-geral-do-sistema)
3. [Casos de Uso](#-casos-de-uso)
4. [Modelo Entidade-Relacionamento (MER)](#-modelo-entidade-relacionamento-mer)
5. [Requisitos Funcionais](#️-requisitos-funcionais)
6. [Requisitos Não Funcionais](#-requisitos-não-funcionais)
7. [Histórias de Usuário](#-histórias-de-usuário)
8. [Histórico de Desenvolvimento](#-histórico-de-desenvolvimento)
9. [Arquitetura do Sistema](#️-arquitetura-do-sistema)
10. [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
11. [Instalação e Configuração](#-instalação-e-configuração)
12. [API Endpoints](#-api-endpoints)
13. [Segurança](#-segurança)
14. [Manutenção e Suporte](#-manutenção-e-suporte)

---

## 🎯 Introdução

O **Sistema de Helpdesk SENAI** é uma plataforma web moderna desenvolvida para gerenciar tickets de suporte técnico e atendimento ao cliente. O sistema foi projetado para atender às necessidades específicas do SENAI (Serviço Nacional de Aprendizagem Industrial), oferecendo uma solução completa para gestão de chamados técnicos, com interface responsiva e funcionalidades avançadas.

### Objetivos do Sistema

- **Centralizar** o gerenciamento de tickets de suporte técnico
- **Automatizar** o processo de atribuição de chamados
- **Melhorar** a comunicação entre clientes e técnicos
- **Fornecer** relatórios e métricas de performance
- **Garantir** rastreabilidade completa dos atendimentos
- **Otimizar** o tempo de resolução dos problemas

### Público-Alvo

- **Administradores**: Gestores do sistema com controle total
- **Técnicos (Agents)**: Profissionais responsáveis pela resolução dos tickets
- **Clientes**: Usuários que solicitam suporte técnico

---

## 🏗️ Visão Geral do Sistema

### Estrutura Modular

O sistema é composto por dois módulos principais:

1. **Frontend (sistema-senai/)**: Interface web desenvolvida em Next.js
2. **Backend (backend/)**: API REST desenvolvida em Node.js

### Funcionalidades Principais

#### 👨‍💼 **Administrador (Admin)**
- Gerenciamento completo de usuários
- Visualização e atribuição de tickets
- Configuração de categorias e templates
- Geração de relatórios e estatísticas
- Controle de SLA e configurações do sistema

#### 🔧 **Técnico (Agent)**
- Visualização de tickets atribuídos
- Alteração de status dos tickets
- Adição de comentários técnicos
- Upload de anexos e relatórios
- Solicitação de informações adicionais

#### 👷 **Cliente (Client)**
- Criação de novos tickets
- Acompanhamento do status
- Adição de comentários públicos
- Avaliação do atendimento
- Visualização do histórico

---

## 📋 Casos de Uso

### UC01 - Autenticação de Usuário
**Ator**: Todos os usuários
**Pré-condições**: Usuário possui conta válida
**Fluxo Principal**:
1. Usuário acessa a página de login
2. Informa email e senha
3. Sistema valida credenciais
4. Sistema redireciona para dashboard específico

### UC02 - Criação de Ticket
**Ator**: Cliente
**Pré-condições**: Cliente está autenticado
**Fluxo Principal**:
1. Cliente acessa "Novo Ticket"
2. Preenche informações do problema
3. Seleciona categoria e prioridade
4. Anexa arquivos (opcional)
5. Sistema cria ticket e notifica técnicos

### UC03 - Atribuição de Ticket
**Ator**: Administrador
**Pré-condições**: Ticket existe e está aberto
**Fluxo Principal**:
1. Administrador visualiza tickets não atribuídos
2. Seleciona ticket e técnico disponível
3. Sistema atribui ticket ao técnico
4. Técnico recebe notificação

### UC04 - Atendimento de Ticket
**Ator**: Técnico
**Pré-condições**: Ticket está atribuído ao técnico
**Fluxo Principal**:
1. Técnico visualiza tickets atribuídos
2. Altera status para "Em Andamento"
3. Adiciona comentários técnicos
4. Solicita informações (se necessário)
5. Resolve problema e fecha ticket

### UC05 - Avaliação de Atendimento
**Ator**: Cliente
**Pré-condições**: Ticket foi fechado
**Fluxo Principal**:
1. Cliente recebe solicitação de avaliação
2. Avalia atendimento (1-5 estrelas)
3. Adiciona comentários (opcional)
4. Sistema registra avaliação

### UC06 - Geração de Relatórios
**Ator**: Administrador
**Pré-condições**: Administrador está autenticado
**Fluxo Principal**:
1. Administrador acessa seção de relatórios
2. Seleciona período e filtros
3. Sistema gera relatório
4. Administrador exporta dados

---

## 🗄️ Modelo Entidade-Relacionamento (MER)

### Entidades Principais

#### **User** (Usuário)
- `id` (PK) - Identificador único
- `name` - Nome completo
- `email` - Email único
- `phone` - Telefone
- `role` - Papel (Admin/Agent/Client)
- `is_active` - Status da conta
- `position` - Cargo/Função
- `hashed_password` - Senha criptografada

#### **Ticket** (Chamado)
- `id` (PK) - Identificador único
- `ticket_number` - Número do ticket
- `title` - Título do problema
- `description` - Descrição detalhada
- `priority` - Prioridade (Low/Medium/High/Critical)
- `status` - Status atual
- `category_id` (FK) - Categoria
- `client_id` (FK) - Cliente solicitante
- `assigned_to` (FK) - Técnico responsável
- `satisfaction_rating` - Avaliação do cliente

#### **Agent** (Técnico)
- `id` (PK) - Identificador único
- `user_id` (FK) - Referência ao usuário
- `employee_id` - ID do funcionário
- `department` - Departamento
- `skills` - Habilidades técnicas
- `max_tickets` - Máximo de tickets simultâneos

#### **Client** (Cliente)
- `id` (PK) - Identificador único
- `user_id` (FK) - Referência ao usuário
- `company` - Empresa
- `client_type` - Tipo de cliente
- `cpf` - CPF (para pessoa física)

#### **Category** (Categoria)
- `id` (PK) - Identificador único
- `name` - Nome da categoria
- `description` - Descrição
- `color` - Cor para identificação
- `is_active` - Status ativo

#### **Comment** (Comentário)
- `id` (PK) - Identificador único
- `ticket_id` (FK) - Ticket relacionado
- `user_id` (FK) - Usuário que comentou
- `content` - Conteúdo do comentário
- `is_internal` - Comentário interno

#### **Attachment** (Anexo)
- `id` (PK) - Identificador único
- `filename` - Nome do arquivo
- `file_path` - Caminho do arquivo
- `file_size` - Tamanho do arquivo
- `mime_type` - Tipo MIME

### Relacionamentos

- **User** → **Agent** (1:1)
- **User** → **Client** (1:1)
- **User** → **Ticket** (1:N) - Criador
- **User** → **Ticket** (1:N) - Responsável
- **Ticket** → **Category** (N:1)
- **Ticket** → **Comment** (1:N)
- **Ticket** → **Attachment** (1:N)
- **Agent** → **Category** (N:N) - Via AgentCategory

---

## ⚙️ Requisitos Funcionais

### RF01 - Gestão de Usuários
- **RF01.1**: Sistema deve permitir criação de usuários
- **RF01.2**: Sistema deve permitir edição de dados de usuários
- **RF01.3**: Sistema deve permitir ativação/desativação de contas
- **RF01.4**: Sistema deve controlar acesso por papéis (Admin/Agent/Client)

### RF02 - Gestão de Tickets
- **RF02.1**: Sistema deve permitir criação de tickets
- **RF02.2**: Sistema deve permitir atribuição de tickets a técnicos
- **RF02.3**: Sistema deve permitir alteração de status dos tickets
- **RF02.4**: Sistema deve registrar histórico de mudanças
- **RF02.5**: Sistema deve permitir anexar arquivos aos tickets

### RF03 - Sistema de Comentários
- **RF03.1**: Sistema deve permitir comentários públicos
- **RF03.2**: Sistema deve permitir comentários técnicos internos
- **RF03.3**: Sistema deve notificar sobre novos comentários

### RF04 - Avaliação de Atendimento
- **RF04.1**: Sistema deve solicitar avaliação após fechamento
- **RF04.2**: Sistema deve registrar avaliação de 1 a 5 estrelas
- **RF04.3**: Sistema deve permitir comentários na avaliação

### RF05 - Relatórios e Estatísticas
- **RF05.1**: Sistema deve gerar relatórios por período
- **RF05.2**: Sistema deve calcular métricas de tempo de resolução
- **RF05.3**: Sistema deve gerar estatísticas de satisfação
- **RF05.4**: Sistema deve permitir exportação de dados

### RF06 - Notificações
- **RF06.1**: Sistema deve notificar sobre novos tickets
- **RF06.2**: Sistema deve notificar sobre mudanças de status
- **RF06.3**: Sistema deve notificar sobre comentários

### RF07 - Gestão de Categorias
- **RF07.1**: Sistema deve permitir criação de categorias
- **RF07.2**: Sistema deve permitir subcategorias
- **RF07.3**: Sistema deve associar técnicos a categorias

---

## 🔧 Requisitos Não Funcionais

### RNF01 - Performance
- **RNF01.1**: Sistema deve responder em menos de 3 segundos
- **RNF01.2**: Sistema deve suportar 100 usuários simultâneos
- **RNF01.3**: Sistema deve processar 1000 tickets por dia

### RNF02 - Segurança
- **RNF02.1**: Senhas devem ser criptografadas com bcrypt
- **RNF02.2**: Autenticação deve usar JWT
- **RNF02.3**: Dados sensíveis devem ser protegidos
- **RNF02.4**: Sistema deve validar entrada de dados

### RNF03 - Usabilidade
- **RNF03.1**: Interface deve ser responsiva
- **RNF03.2**: Interface deve suportar tema claro/escuro
- **RNF03.3**: Sistema deve ser intuitivo para usuários
- **RNF03.4**: Sistema deve ter feedback visual claro

### RNF04 - Disponibilidade
- **RNF04.1**: Sistema deve estar disponível 99% do tempo
- **RNF04.2**: Sistema deve ter backup automático
- **RNF04.3**: Sistema deve ter recuperação de falhas

### RNF05 - Escalabilidade
- **RNF05.1**: Sistema deve suportar crescimento de usuários
- **RNF05.2**: Banco de dados deve ser otimizado
- **RNF05.3**: Sistema deve usar cache quando apropriado

### RNF06 - Compatibilidade
- **RNF06.1**: Sistema deve funcionar em navegadores modernos
- **RNF06.2**: Sistema deve ser compatível com dispositivos móveis
- **RNF06.3**: Sistema deve suportar diferentes resoluções

---

## 👥 Histórias de Usuário

### Como **Administrador**, eu quero:
- **HU01**: Gerenciar todos os usuários do sistema para controlar o acesso
- **HU02**: Visualizar relatórios de performance para tomar decisões estratégicas
- **HU03**: Configurar categorias e templates para padronizar atendimentos
- **HU04**: Atribuir tickets a técnicos específicos para otimizar o trabalho
- **HU05**: Monitorar métricas de satisfação para melhorar o serviço

### Como **Técnico**, eu quero:
- **HU06**: Visualizar meus tickets atribuídos para organizar meu trabalho
- **HU07**: Alterar status dos tickets para manter o cliente informado
- **HU08**: Adicionar comentários técnicos para documentar soluções
- **HU09**: Anexar arquivos para compartilhar relatórios e fotos
- **HU10**: Solicitar informações adicionais quando necessário

### Como **Cliente**, eu quero:
- **HU11**: Criar tickets facilmente para solicitar suporte
- **HU12**: Acompanhar o status do meu ticket para saber o progresso
- **HU13**: Adicionar comentários para fornecer mais informações
- **HU14**: Avaliar o atendimento para dar feedback
- **HU15**: Visualizar histórico dos meus tickets para referência

---

## 📅 Histórico de Desenvolvimento

### Versão 1.0.0 (Atual)
**Data**: Janeiro 2025
**Principais Funcionalidades**:
- ✅ Sistema completo de autenticação
- ✅ Gestão de usuários (Admin/Agent/Client)
- ✅ Sistema de tickets com workflow completo
- ✅ Sistema de comentários e anexos
- ✅ Avaliação de atendimento
- ✅ Relatórios e estatísticas
- ✅ Interface responsiva com tema claro/escuro
- ✅ API REST completa
- ✅ Banco de dados PostgreSQL com Prisma

### Funcionalidades Implementadas

#### ✅ **Backend (Node.js + Express)**
- Autenticação JWT
- Controle de acesso por papéis
- API REST completa
- Validação com Zod
- Upload de arquivos
- Sistema de notificações
- Relatórios e estatísticas

#### ✅ **Frontend (Next.js + HeroUI)**
- Interface moderna e responsiva
- Tema claro/escuro
- Componentes reutilizáveis
- Gráficos e dashboards
- Exportação de dados
- Notificações em tempo real

#### ✅ **Banco de Dados (PostgreSQL)**
- Schema completo com Prisma
- Relacionamentos otimizados
- Índices para performance
- Migrações automáticas

### Próximas Versões Planejadas

#### Versão 1.1.0 (Planejada)
- 🔄 Sistema de SLA automático
- 🔄 Integração com WhatsApp
- 🔄 Dashboard avançado com métricas
- 🔄 Sistema de templates de resposta

#### Versão 1.2.0 (Futura)
- 🔄 IA para sugestão de categorias
- 🔄 Sistema de conhecimento base
- 🔄 Integração com sistemas externos
- 🔄 Mobile app nativo

---

## 🏛️ Arquitetura do Sistema

### Arquitetura Geral
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React         │    │ - Express       │    │ - Prisma ORM    │
│ - HeroUI        │    │ - JWT Auth      │    │ - Migrations    │
│ - TypeScript    │    │ - REST API      │    │ - Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estrutura de Pastas

#### Frontend (sistema-senai/)
```
sistema-senai/
├── app/                    # Páginas da aplicação
│   ├── pages/             # Páginas específicas por papel
│   │   ├── admin/         # Páginas do administrador
│   │   ├── agent/         # Páginas do técnico
│   │   └── client/        # Páginas do cliente
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de interface
│   ├── charts/           # Componentes de gráficos
│   └── modals/           # Modais
├── hooks/                # Hooks customizados
├── contexts/             # Contextos React
├── utils/                # Utilitários
└── types/                # Definições TypeScript
```

#### Backend (backend/)
```
backend/
├── src/
│   ├── controllers/      # Controladores da aplicação
│   ├── routes/          # Definição das rotas
│   ├── middlewares/     # Middlewares
│   ├── models/          # Modelos de dados
│   ├── schemas/         # Schemas de validação
│   └── utils/           # Utilitários
├── prisma/
│   └── schema.prisma    # Schema do banco
└── scripts/             # Scripts utilitários
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15.4.6** - Framework React
- **React 18.3.1** - Biblioteca de interface
- **TypeScript 5.6.3** - Linguagem tipada
- **HeroUI 2.8.2** - Biblioteca de componentes
- **Tailwind CSS 4.1.11** - Framework CSS
- **Framer Motion 11.18.2** - Animações
- **Chart.js 4.5.0** - Gráficos
- **React Icons 5.5.0** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express 4.18.2** - Framework web
- **Prisma 6.15.0** - ORM
- **PostgreSQL** - Banco de dados
- **JWT 9.0.2** - Autenticação
- **Zod 3.25.7** - Validação
- **Multer 2.0.2** - Upload de arquivos
- **bcrypt 6.0.0** - Criptografia

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação
- **Nodemon** - Hot reload
- **Git** - Controle de versão

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### Instalação do Backend

```bash
# 1. Clone o repositório
git clone <repository-url>
cd backend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Configure o banco de dados
npx prisma generate
npx prisma migrate dev

# 5. Popule dados iniciais (opcional)
npm run seed:helpdesk

# 6. Inicie o servidor
npm run dev
```

### Instalação do Frontend

```bash
# 1. Navegue para o diretório do frontend
cd sistema-senai

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/helpdesk_db"
DIRECT_URL="postgresql://username:password@localhost:5432/helpdesk_db"
JWT_SECRET="your-secret-key"
PORT=3000
```

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Sistema de Helpdesk SENAI"
```

---

## 🔌 API Endpoints

### Autenticação
```
POST /login                    # Login de usuário
POST /logout                   # Logout
GET  /me                       # Dados do usuário atual
```

### Administrador
```
GET    /admin/status           # Estatísticas gerais
GET    /admin/users            # Listar usuários
POST   /admin/users            # Criar usuário
PUT    /admin/users/:id        # Atualizar usuário
DELETE /admin/users/:id        # Excluir usuário
GET    /admin/tickets          # Listar todos os tickets
PUT    /admin/tickets/:id/reassign # Reatribuir ticket
GET    /admin/reports          # Relatórios
POST   /admin/categories       # Criar categoria
```

### Técnico (Agent)
```
GET    /helpdesk/agents/my-tickets     # Meus tickets
PUT    /helpdesk/agents/tickets/:id/status # Alterar status
POST   /helpdesk/agents/tickets/:id/comments # Comentário técnico
GET    /helpdesk/agents/my-statistics  # Minhas estatísticas
```

### Cliente (Client)
```
GET    /helpdesk/client/my-tickets     # Meus tickets
POST   /helpdesk/client/tickets        # Criar ticket
POST   /helpdesk/client/tickets/:id/comments # Comentário público
POST   /helpdesk/client/tickets/:id/rate # Avaliar atendimento
```

### Comum
```
GET    /categories             # Listar categorias
GET    /tickets/:id            # Detalhes do ticket
POST   /tickets/:id/attachments # Upload de anexo
GET    /notifications          # Notificações
PUT    /notifications/:id/read # Marcar como lida
```

---

## 🔒 Segurança

### Autenticação
- **JWT (JSON Web Tokens)** para autenticação
- **Tokens de acesso** com tempo de expiração
- **Refresh tokens** para renovação automática
- **Logout** com invalidação de tokens

### Autorização
- **Controle de acesso baseado em papéis (RBAC)**
- **Middleware de autorização** em todas as rotas
- **Verificação de permissões** por funcionalidade
- **Isolamento de dados** por papel do usuário

### Validação de Dados
- **Zod** para validação de schemas
- **Sanitização** de entrada de dados
- **Prevenção de SQL Injection** via Prisma
- **Validação de tipos** no frontend e backend

### Proteção de Arquivos
- **Upload seguro** com validação de tipos
- **Armazenamento** em diretório seguro
- **Controle de acesso** aos arquivos
- **Limite de tamanho** de upload

### Criptografia
- **bcrypt** para hash de senhas
- **HTTPS** para comunicação segura
- **Headers de segurança** configurados
- **CORS** configurado adequadamente

---

## 🔧 Manutenção e Suporte

### Monitoramento
- **Logs estruturados** para debugging
- **Métricas de performance** do sistema
- **Monitoramento de erros** em produção
- **Alertas automáticos** para problemas críticos

### Backup
- **Backup automático** do banco de dados
- **Versionamento** de código com Git
- **Documentação** atualizada
- **Scripts de migração** automatizados

### Atualizações
- **Dependências** atualizadas regularmente
- **Patches de segurança** aplicados
- **Testes automatizados** antes do deploy
- **Rollback** em caso de problemas

### Suporte Técnico
- **Documentação** completa do sistema
- **Guia de troubleshooting** para problemas comuns
- **Contato** da equipe de desenvolvimento
- **FAQ** com perguntas frequentes

---

## 📞 Contato e Suporte

Para suporte técnico ou dúvidas sobre o sistema:

- **Email**: suporte@senai.com
- **Telefone**: (11) 1234-5678
- **Horário**: Segunda a Sexta, 8h às 18h

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

*Documentação gerada em Janeiro de 2025*
*Versão do Sistema: 1.0.0*


