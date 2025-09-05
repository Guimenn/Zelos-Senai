# Sistema de Chat em Tempo Real

Sistema completo de chat em tempo real para helpdesk, integrado com Supabase e Next.js.

## Funcionalidades

- ✅ Chat em tempo real entre criador do chamado e técnico
- ✅ Envio de mensagens de texto
- ✅ Upload e compartilhamento de anexos
- ✅ Interface moderna e responsiva
- ✅ Notificações em tempo real
- ✅ Suporte a temas (claro/escuro)
- ✅ Validação de permissões
- ✅ Integração com Supabase Realtime
- ✅ **Botão de chat que só aparece quando técnico aceita**
- ✅ **Modal bonito e responsivo para o chat**
- ✅ **Verificação automática de disponibilidade**
- ✅ **Estados visuais (carregando, erro, indisponível)**

## Estrutura do Sistema

### 1. Banco de Dados (Supabase)

```sql
-- Tabela messages criada com:
- id (uuid, primary key)
- ticket_id (uuid, foreign key)
- sender_id (uuid, foreign key)
- content (text, opcional)
- attachment_url (text, opcional)
- created_at (timestamp)
```

### 2. API Routes (Backend)

- `POST /api/messages/send` - Enviar mensagem
- `GET /api/messages/list` - Listar mensagens
- `POST /api/messages/upload` - Upload de anexos

### 3. Frontend

- `components/chat/Chat.tsx` - Componente principal do chat
- `components/chat/ChatModal.tsx` - Modal bonito para o chat
- `components/chat/ChatButton.tsx` - Botão que só aparece quando técnico aceita
- `hooks/useChatAvailability.ts` - Hook para verificar disponibilidade do chat
- `lib/supabase.ts` - Configuração do Supabase com Realtime

## Como Usar

### 1. Usar o Botão de Chat (Recomendado)

```tsx
import ChatButton from '../components/chat/ChatButton'

function TicketPage({ ticketId }: { ticketId: string }) {
  return (
    <div>
      {/* O botão só aparece quando o técnico aceita o chamado */}
      <ChatButton 
        ticketId={ticketId}
        size="md"
        variant="primary"
      />
    </div>
  )
}
```

### 2. Usar o Modal de Chat Diretamente

```tsx
import ChatModal from '../components/chat/ChatModal'

function TicketPage({ ticketId }: { ticketId: string }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  return (
    <div>
      <button onClick={() => setIsChatOpen(true)}>
        Abrir Chat
      </button>
      
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        ticketId={ticketId}
        ticketData={ticketData}
      />
    </div>
  )
}
```

### 3. Usar o Chat Diretamente (Sem Modal)

```tsx
import Chat from '../components/chat/Chat'

function TicketPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="h-screen">
      <Chat ticketId={ticketId} />
    </div>
  )
}
```

### 2. Configurar Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_API_URL=https://pyrxlymsoidmjxjenesb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 3. Executar SQL no Supabase

Execute o arquivo `database/messages_table.sql` no Supabase SQL Editor.

## Configuração do Supabase

### 1. Criar Bucket para Anexos

```sql
-- No Supabase Storage, criar bucket 'attachments'
-- Configurar políticas RLS para o bucket
```

### 2. Habilitar Realtime

```sql
-- Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 3. Configurar Políticas RLS

As políticas já estão incluídas no SQL fornecido:
- Usuários só podem ver mensagens de tickets que têm acesso
- Usuários só podem inserir mensagens em tickets autorizados
- Usuários só podem editar/deletar suas próprias mensagens

## Interface do Chat

### Cores e Temas

- **Mensagens próprias**: Vermelho (#e50914)
- **Mensagens dos outros**: Cinza escuro (#2c2c2c)
- **Tema escuro**: Suporte completo
- **Tema claro**: Suporte completo

### Funcionalidades da Interface

- **Bolhas de mensagem**: Design moderno com bordas arredondadas
- **Anexos**: Preview de imagens e ícones para outros arquivos
- **Horário**: Exibido em cada mensagem
- **Scroll automático**: Para a última mensagem
- **Input responsivo**: Textarea que cresce conforme o conteúdo
- **Upload de arquivos**: Drag & drop e botão de anexo

## Segurança

### Validações

- ✅ Verificação de permissões por ticket
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho de arquivo (10MB)
- ✅ Autenticação JWT obrigatória
- ✅ Políticas RLS no Supabase

### Tipos de Arquivo Permitidos

- Imagens: jpg, jpeg, png, gif, webp
- Documentos: pdf, doc, docx, txt
- Planilhas: xls, xlsx

## Realtime

### Como Funciona

1. **Canal por Ticket**: Cada ticket tem seu próprio canal Realtime
2. **Filtro de Mensagens**: Apenas mensagens do ticket específico
3. **Notificações**: Toast quando janela não está em foco
4. **Prevenção de Duplicatas**: Mensagens próprias não são exibidas novamente

### Configuração

```tsx
// O Realtime é configurado automaticamente no componente
// Canal: ticket-{ticketId}
// Evento: INSERT na tabela messages
// Filtro: ticket_id = {ticketId}
```

## Troubleshooting

### Problemas Comuns

1. **Mensagens não aparecem em tempo real**
   - Verificar se Realtime está habilitado no Supabase
   - Verificar políticas RLS
   - Verificar console para erros

2. **Upload de arquivos falha**
   - Verificar bucket 'attachments' no Supabase Storage
   - Verificar políticas do bucket
   - Verificar tamanho do arquivo (máx 10MB)

3. **Permissões negadas**
   - Verificar se usuário tem acesso ao ticket
   - Verificar autenticação JWT
   - Verificar políticas RLS

### Logs e Debug

```tsx
// Habilitar logs no console
console.log('Nova mensagem recebida:', payload)
console.log('Erro ao buscar dados do remetente:', error)
```

## Performance

### Otimizações

- ✅ Índices no banco de dados
- ✅ Paginação de mensagens
- ✅ Limite de eventos por segundo (10)
- ✅ Cleanup automático de canais
- ✅ Lazy loading de imagens

### Limites

- Máximo 10MB por arquivo
- Máximo 50 mensagens por página
- Máximo 10 eventos por segundo no Realtime

## Extensões Futuras

### Funcionalidades Planejadas

- [ ] Mensagens com formatação (markdown)
- [ ] Emojis e reações
- [ ] Status de leitura
- [ ] Mensagens temporárias
- [ ] Busca em mensagens
- [ ] Exportação de conversas

### Melhorias Técnicas

- [ ] Cache de mensagens
- [ ] Compressão de imagens
- [ ] WebRTC para chamadas
- [ ] Mensagens de voz
- [ ] Tradução automática
