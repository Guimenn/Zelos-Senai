-- Script para desabilitar temporariamente o RLS para teste
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS na tabela messages temporariamente
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Teste: inserir uma mensagem de teste
INSERT INTO public.messages (ticket_id, sender_id, content) VALUES
(13, 1, 'Teste de mensagem após desabilitar RLS');

-- Verificar se a mensagem foi inserida
SELECT * FROM public.messages WHERE ticket_id = 13;

-- IMPORTANTE: Após os testes, reabilite o RLS com:
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
