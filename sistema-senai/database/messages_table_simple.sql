-- Versão simplificada da tabela messages
-- Para casos onde as tabelas relacionadas podem não existir

-- Criar tabela messages básica
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text,
    attachment_url text,
    created_at timestamp with time zone DEFAULT now()
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

-- Comentários
COMMENT ON TABLE messages IS 'Tabela para mensagens do chat em tempo real';
COMMENT ON COLUMN messages.ticket_id IS 'ID do ticket/chamado relacionado';
COMMENT ON COLUMN messages.sender_id IS 'ID do usuário que enviou a mensagem';
COMMENT ON COLUMN messages.content IS 'Conteúdo da mensagem (texto)';
COMMENT ON COLUMN messages.attachment_url IS 'URL do anexo no Supabase Storage (opcional)';
COMMENT ON COLUMN messages.created_at IS 'Data e hora de criação da mensagem';
