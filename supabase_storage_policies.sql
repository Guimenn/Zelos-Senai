-- Políticas RLS para o bucket 'avatars' no Supabase Storage
-- Execute estes comandos no SQL Editor do Supabase Dashboard

-- 1. Criar o bucket 'avatars' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir acesso público para visualização de avatares
CREATE POLICY "Acesso público para ver avatares"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3. Política para permitir upload público de avatares
CREATE POLICY "Upload público de avatares"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

-- 4. Política para permitir atualização pública de avatares
CREATE POLICY "Atualização pública de avatares"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 5. Política para permitir deleção pública de avatares
CREATE POLICY "Deleção pública de avatares"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'avatars');

-- Alternativa mais simples (se você quiser permitir qualquer usuário autenticado fazer upload):
-- Descomente as linhas abaixo e comente as políticas acima se preferir uma abordagem mais permissiva

/*
CREATE POLICY "Qualquer usuário autenticado pode ver avatares"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Qualquer usuário autenticado pode fazer upload de avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Qualquer usuário autenticado pode atualizar avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Qualquer usuário autenticado pode deletar avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
*/

-- =============================
-- Buckets e políticas: attachments
-- =============================

-- Criar o bucket 'Anexo-chamado' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Anexo-chamado', 'Anexo-chamado', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (necessária para exibir anexos via URL pública)
CREATE POLICY "Acesso público para ver anexos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Anexo-chamado');

-- Upload/insert: usuários autenticados
CREATE POLICY "Usuário autenticado pode subir anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Anexo-chamado');

-- Update: somente autenticados
CREATE POLICY "Usuário autenticado pode atualizar anexos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Anexo-chamado')
WITH CHECK (bucket_id = 'Anexo-chamado');

-- Delete: somente autenticados
CREATE POLICY "Usuário autenticado pode deletar anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Anexo-chamado');