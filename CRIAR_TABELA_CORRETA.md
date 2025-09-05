# 🗄️ Criar Tabela Messages - Baseada no Seu Schema Prisma

## ✅ **Schema Correto Identificado**

Baseado no seu `schema.prisma`, a tabela deve usar:
- **IDs inteiros** (SERIAL/INTEGER) em vez de UUIDs
- **Nomes de tabelas** em minúsculo (user, ticket, agent, etc.)
- **Estrutura** compatível com Prisma

## 🚀 **SQL Correto para Executar**

### **Passo 1: Acessar Supabase**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login
3. Selecione seu projeto

### **Passo 2: Abrir SQL Editor**
1. Menu lateral → **"SQL Editor"**
2. Clique **"New query"**

### **Passo 3: Executar SQL Correto**
Copie e cole este SQL (baseado no seu schema):

```sql
-- Tabela messages baseada no schema Prisma correto
-- Usando IDs inteiros (Int) como no schema original

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política simples: permitir tudo para usuários autenticados
CREATE POLICY "Allow all for authenticated users" ON messages
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Função para notificar sobre novas mensagens
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_message',
        json_build_object(
            'ticket_id', NEW.ticket_id,
            'sender_id', NEW.sender_id,
            'content', NEW.content,
            'attachment_url', NEW.attachment_url,
            'created_at', NEW.created_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar sobre novas mensagens
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();
```

### **Passo 4: Executar**
1. Clique **"Run"** ou **Ctrl+Enter**
2. Aguarde execução
3. Verifique se não há erros

### **Passo 5: Verificar**
1. Menu lateral → **"Table Editor"**
2. Verifique se a tabela `messages` aparece
3. Clique na tabela para ver a estrutura

## 🔧 **Diferenças do Schema Original**

### **✅ Correto (baseado no seu Prisma):**
- `id SERIAL PRIMARY KEY` (Int auto-increment)
- `ticket_id INTEGER` (Int)
- `sender_id INTEGER` (Int)
- Nomes de tabelas em minúsculo

### **❌ Incorreto (versão anterior):**
- `id uuid PRIMARY KEY` (UUID)
- `ticket_id uuid` (UUID)
- `sender_id uuid` (UUID)

## 🎯 **Após Criar a Tabela**

### **1. Testar o Chat**
```
http://localhost:3000/pages/chat/debug
```

### **2. Verificar se Funcionou**
- Abrir console (F12)
- Não deve mais aparecer erro 404
- Chat deve funcionar com dados reais

### **3. Configurar Realtime (Opcional)**
1. Supabase → **"Realtime"**
2. Habilite para tabela `messages`
3. Configure políticas de publicação

## 📋 **Estrutura da Tabela Criada**

```sql
messages:
├── id (SERIAL PRIMARY KEY)
├── ticket_id (INTEGER NOT NULL)
├── sender_id (INTEGER NOT NULL)
├── content (TEXT)
├── attachment_url (TEXT)
└── created_at (TIMESTAMP WITH TIME ZONE)
```

## ✅ **Resultado Esperado**

Após criar a tabela:
- ✅ Erro 404 desaparece
- ✅ Chat funciona com dados reais
- ✅ Mensagens são salvas no banco
- ✅ Realtime funciona
- ✅ Compatível com seu schema Prisma

---

🗄️ **Execute o SQL correto no Supabase e o chat funcionará perfeitamente!**
