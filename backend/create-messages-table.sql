-- Script SQL para criar a tabela messages no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a todos os usuários autenticados
-- (Para desenvolvimento - em produção, configure políticas mais restritivas)
CREATE POLICY "Allow all authenticated users" ON public.messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Política alternativa mais restritiva (comente a anterior e descomente esta)
-- CREATE POLICY "Users can access their own messages" ON public.messages
--     FOR ALL USING (
--         auth.uid()::text = sender_id::text OR
--         EXISTS (
--             SELECT 1 FROM tickets 
--             WHERE tickets.id = messages.ticket_id 
--             AND (tickets.created_by = auth.uid()::integer OR tickets.assigned_to = auth.uid()::integer)
--         )
--     );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de teste (opcional)
INSERT INTO public.messages (ticket_id, sender_id, content) VALUES
(13, 1, 'Olá! Esta é uma mensagem de teste.'),
(13, 1, 'Como posso ajudar com seu chamado?'),
(13, 1, 'Por favor, me envie mais detalhes sobre o problema.');

-- Verificar se a tabela foi criada
SELECT 'Tabela messages criada com sucesso!' as status;
