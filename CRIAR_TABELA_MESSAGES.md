# 🗄️ Criar Tabela Messages no Supabase

## 🚨 **Problema Identificado**

A tabela `messages` não existe no Supabase, por isso o chat não funciona!

## ✅ **Solução: Criar a Tabela**

### **Passo 1: Acessar o Supabase**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### **Passo 2: Abrir SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### **Passo 3: Executar o SQL**
Copie e cole o seguinte SQL no editor:

```sql
-- Tabela para mensagens do chat em tempo real
-- Sistema de chat exclusivo entre criador do chamado e técnico que aceitou

CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text,
    attachment_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para otimização
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Índice composto para consultas frequentes
CREATE INDEX idx_messages_ticket_created ON messages(ticket_id, created_at);

-- Política RLS (Row Level Security) para segurança
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver mensagens de tickets que têm acesso
CREATE POLICY "Users can view messages from their tickets" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = messages.ticket_id
            AND (
                t.created_by = auth.uid() OR 
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM ticket_assignments ta
                    WHERE ta.ticket_id = t.id
                    AND ta.agent_id = (
                        SELECT id FROM agents WHERE user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Política: usuários só podem inserir mensagens em tickets que têm acesso
CREATE POLICY "Users can insert messages to their tickets" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = messages.ticket_id
            AND (
                t.created_by = auth.uid() OR 
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM ticket_assignments ta
                    WHERE ta.ticket_id = t.id
                    AND ta.agent_id = (
                        SELECT id FROM agents WHERE user_id = auth.uid()
                    )
                )
            )
        )
        AND sender_id = auth.uid()
    );

-- Política: usuários só podem atualizar suas próprias mensagens
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Política: usuários só podem deletar suas próprias mensagens
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- Função para notificar sobre novas mensagens (para Realtime)
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
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();
```

### **Passo 4: Executar**
1. Clique em **"Run"** ou pressione **Ctrl+Enter**
2. Aguarde a execução
3. Verifique se não há erros

### **Passo 5: Verificar**
1. Vá para **"Table Editor"**
2. Verifique se a tabela `messages` foi criada
3. Verifique se as políticas RLS estão ativas

## 🔧 **Se Houver Erros**

### **Erro: Tabela tickets não existe**
```sql
-- Criar tabela tickets primeiro (se não existir)
CREATE TABLE tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text DEFAULT 'Open',
    priority text DEFAULT 'Medium',
    created_by uuid REFERENCES users(id),
    assigned_to uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT now()
);
```

### **Erro: Tabela users não existe**
```sql
-- Criar tabela users primeiro (se não existir)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text DEFAULT 'Client',
    created_at timestamp with time zone DEFAULT now()
);
```

### **Erro: Tabela ticket_assignments não existe**
```sql
-- Criar tabela ticket_assignments (se não existir)
CREATE TABLE ticket_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid REFERENCES tickets(id),
    agent_id uuid REFERENCES agents(id),
    assigned_at timestamp with time zone DEFAULT now()
);
```

### **Erro: Tabela agents não existe**
```sql
-- Criar tabela agents (se não existir)
CREATE TABLE agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    department text,
    created_at timestamp with time zone DEFAULT now()
);
```

## ✅ **Após Criar a Tabela**

### **1. Testar o Chat**
```
http://localhost:3000/pages/chat/debug
```

### **2. Verificar Logs**
- Abrir console (F12)
- Verificar se não há mais erros 404
- Testar envio de mensagens

### **3. Configurar Realtime (Opcional)**
1. No Supabase, vá para **"Realtime"**
2. Habilite para a tabela `messages`
3. Configure as políticas de publicação

## 🎯 **Resultado Esperado**

Após criar a tabela:
- ✅ Chat funcionará com dados reais
- ✅ Mensagens serão salvas no banco
- ✅ Realtime funcionará
- ✅ Sem mais erros 404

---

🗄️ **Execute o SQL no Supabase e o chat funcionará perfeitamente!**
