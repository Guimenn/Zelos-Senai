# 🚀 Configuração do Sistema de Chat em Tempo Real

Este guia te ajudará a configurar o sistema completo de chat em tempo real para o helpdesk.

## 📋 Pré-requisitos

- ✅ Next.js 14 instalado
- ✅ Supabase configurado
- ✅ Backend Node.js/Express rodando
- ✅ Banco de dados PostgreSQL (Supabase)

## 🗄️ 1. Configuração do Banco de Dados

### Execute o SQL no Supabase

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Execute o conteúdo do arquivo `database/messages_table.sql`

```sql
-- O arquivo contém:
- Criação da tabela messages
- Índices para performance
- Políticas RLS para segurança
- Trigger para notificações Realtime
```

### Configurar Storage

1. No Supabase Dashboard, vá para **Storage**
2. Crie um bucket chamado `attachments`
3. Configure as políticas RLS:

```sql
-- Política para upload
CREATE POLICY "Users can upload attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualização
CREATE POLICY "Users can view attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'attachments');
```

### Habilitar Realtime

1. No Supabase Dashboard, vá para **Database**
2. Clique em **Replication**
3. Habilite a replicação para a tabela `messages`

## 🔧 2. Configuração do Backend

### Instalar Dependências

```bash
cd backend
npm install @supabase/supabase-js multer uuid
```

### Variáveis de Ambiente

Adicione ao arquivo `.env` do backend:

```env
SUPABASE_URL=https://pyrxlymsoidmjxjenesb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### Verificar Rotas

As rotas já foram adicionadas ao `server.js`:
- ✅ `messageRoute.js` importado
- ✅ `/api/messages` configurado

## 🎨 3. Configuração do Frontend

### Variáveis de Ambiente

Adicione ao arquivo `.env.local` do frontend:

```env
NEXT_PUBLIC_SUPABASE_API_URL=https://pyrxlymsoidmjxjenesb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### Verificar Configurações

As configurações já foram adicionadas:
- ✅ `next.config.js` com proxy para `/api/messages`
- ✅ `lib/supabase.ts` configurado para Realtime
- ✅ Componente `Chat.tsx` criado

## 🧪 4. Testando o Sistema

### 1. Iniciar o Backend

```bash
cd backend
npm start
```

### 2. Iniciar o Frontend

```bash
cd sistema-senai
npm run dev
```

### 3. Acessar a Página de Exemplo

```
http://localhost:3000/pages/chat/example
```

### 4. Testar Funcionalidades

- ✅ Enviar mensagem de texto
- ✅ Upload de arquivo
- ✅ Realtime (abrir duas abas)
- ✅ Temas (claro/escuro)
- ✅ Responsividade

## 🔍 5. Verificação de Funcionamento

### Checklist de Testes

- [ ] **Banco de Dados**: Tabela `messages` criada
- [ ] **Storage**: Bucket `attachments` configurado
- [ ] **Realtime**: Habilitado para tabela `messages`
- [ ] **Backend**: Rotas `/api/messages/*` funcionando
- [ ] **Frontend**: Componente `Chat` renderizando
- [ ] **Autenticação**: JWT funcionando
- [ ] **Upload**: Arquivos sendo salvos no Supabase
- [ ] **Realtime**: Mensagens aparecendo em tempo real

### Logs para Verificar

**Backend:**
```bash
# Deve aparecer:
POST /api/messages/send - 201
GET /api/messages/list - 200
POST /api/messages/upload - 200
```

**Frontend (Console):**
```javascript
// Deve aparecer:
Nova mensagem recebida: {payload}
✅ Cliente Supabase criado com URL: ...
```

## 🚨 6. Troubleshooting

### Problemas Comuns

#### Mensagens não aparecem em tempo real
```bash
# Verificar:
1. Realtime habilitado no Supabase
2. Políticas RLS configuradas
3. Console sem erros
4. Canal criado corretamente
```

#### Upload de arquivos falha
```bash
# Verificar:
1. Bucket 'attachments' existe
2. Políticas do bucket configuradas
3. Tamanho do arquivo < 10MB
4. Tipo de arquivo permitido
```

#### Permissões negadas
```bash
# Verificar:
1. JWT válido
2. Usuário tem acesso ao ticket
3. Políticas RLS corretas
4. Role do usuário (Admin/Agent/Client)
```

### Comandos de Debug

```bash
# Verificar conexão com Supabase
curl -H "apikey: SUA_ANON_KEY" \
     https://pyrxlymsoidmjxjenesb.supabase.co/rest/v1/messages

# Verificar Realtime
# No console do navegador:
supabase.realtime.getChannels()
```

## 📱 7. Uso em Produção

### Configurações de Produção

1. **Variáveis de Ambiente**: Usar variáveis reais
2. **SSL**: Configurar HTTPS
3. **Rate Limiting**: Implementar no backend
4. **Monitoramento**: Configurar logs
5. **Backup**: Configurar backup do banco

### Otimizações

1. **CDN**: Para arquivos estáticos
2. **Cache**: Para mensagens antigas
3. **Compressão**: Para imagens
4. **Lazy Loading**: Para mensagens antigas

## 🎯 8. Próximos Passos

### Integração com Tickets Existentes

Para integrar o chat com tickets existentes:

```tsx
// Em qualquer página de ticket:
import Chat from '../components/chat/Chat'

function TicketDetailPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Detalhes do ticket */}
      <div>
        {/* Conteúdo existente do ticket */}
      </div>
      
      {/* Chat */}
      <div className="h-96">
        <Chat ticketId={ticketId} />
      </div>
    </div>
  )
}
```

### Customizações

- **Cores**: Modificar no `Chat.tsx`
- **Limites**: Ajustar no backend
- **Tipos de arquivo**: Modificar validação
- **Notificações**: Personalizar toasts

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do console
2. Verificar logs do backend
3. Verificar configurações do Supabase
4. Testar com dados de exemplo
5. Verificar permissões e autenticação

---

🎉 **Parabéns!** Seu sistema de chat em tempo real está configurado e funcionando!
