-- Script para corrigir as políticas RLS
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages;

-- Criar política mais permissiva para desenvolvimento
CREATE POLICY "Allow all for development" ON public.messages
    FOR ALL USING (true);

-- Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- Teste: inserir uma mensagem de teste
INSERT INTO public.messages (ticket_id, sender_id, content) VALUES
(13, 1, 'Teste de mensagem com nova política RLS');

-- Verificar se a mensagem foi inserida
SELECT * FROM public.messages WHERE ticket_id = 13;
