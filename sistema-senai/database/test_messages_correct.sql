-- Script para testar se a tabela messages foi criada corretamente
-- Baseado no schema Prisma com IDs inteiros

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'messages';

-- 2. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'messages';

-- 4. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'messages';

-- 5. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

-- 6. Testar inserção de dados (opcional - descomente para testar)
-- INSERT INTO messages (ticket_id, sender_id, content) 
-- VALUES (1, 1, 'Mensagem de teste');

-- 7. Verificar dados inseridos (se executou o INSERT acima)
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;

-- 8. Verificar se as tabelas relacionadas existem
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_name IN ('user', 'ticket', 'agent', 'ticket_assignment')
ORDER BY table_name;
