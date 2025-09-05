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

-- Comentários para documentação
COMMENT ON TABLE messages IS 'Tabela para mensagens do chat em tempo real entre criador e técnico do chamado';
COMMENT ON COLUMN messages.ticket_id IS 'ID do ticket/chamado relacionado';
COMMENT ON COLUMN messages.sender_id IS 'ID do usuário que enviou a mensagem';
COMMENT ON COLUMN messages.content IS 'Conteúdo da mensagem (texto)';
COMMENT ON COLUMN messages.attachment_url IS 'URL do anexo no Supabase Storage (opcional)';
COMMENT ON COLUMN messages.created_at IS 'Data e hora de criação da mensagem';
