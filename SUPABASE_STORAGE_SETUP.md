# 🔧 Configuração do Supabase Storage - Políticas RLS

## 🚨 Problema Identificado

O erro `StorageApiError: new row violates row-level security policy` indica que o bucket 'avatars' no Supabase Storage não possui as políticas RLS (Row Level Security) necessárias para permitir uploads de arquivos.

## 📋 Solução: Configurar Políticas RLS

### 1️⃣ Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto `pyrxlymsoidmjxjenesb`

### 2️⃣ Abra o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"**

### 3️⃣ Execute as Políticas RLS

**⚠️ IMPORTANTE**: Como o sistema usa JWT próprio (não Supabase Auth), vamos usar políticas públicas para o bucket avatars.

Copie e cole o seguinte código SQL no editor:

```sql
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
```

### 4️⃣ Execute o Script

1. Clique no botão **"Run"** (ou pressione `Ctrl + Enter`)
2. Aguarde a execução completar
3. Verifique se não há erros na saída

## 🔄 Alternativa Mais Permissiva (Opcional)

Se você quiser uma configuração mais simples que permite qualquer usuário autenticado fazer upload (sem restrição de pasta), use este código alternativo:

```sql
-- Criar o bucket 'avatars' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Política simples para SELECT
CREATE POLICY "Qualquer usuário autenticado pode ver avatares"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Política simples para INSERT
CREATE POLICY "Qualquer usuário autenticado pode fazer upload de avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política simples para UPDATE
CREATE POLICY "Qualquer usuário autenticado pode atualizar avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Política simples para DELETE
CREATE POLICY "Qualquer usuário autenticado pode deletar avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

## 🔍 Verificar Configuração

### Verificar se o bucket foi criado:
```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### Verificar as políticas criadas:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🧪 Testar o Upload

Após executar as políticas:

1. Volte para o frontend (`http://localhost:3001`)
2. Faça login no sistema
3. Vá para a página de perfil
4. Tente fazer upload de um avatar
5. O upload deve funcionar sem erros

## 📝 Explicação das Políticas

### Política Pública (Implementada)
- **SELECT**: Qualquer pessoa pode visualizar avatares do bucket
- **INSERT**: Qualquer pessoa pode fazer upload de avatares
- **UPDATE/DELETE**: Qualquer pessoa pode modificar/deletar avatares
- **Justificativa**: Como o sistema usa JWT próprio (não Supabase Auth), precisamos de políticas públicas
- **Segurança**: A validação de acesso é feita no backend através do JWT próprio

### Considerações de Segurança
- ✅ **Bucket específico**: Políticas aplicadas apenas ao bucket 'avatars'
- ✅ **Validação no backend**: O sistema backend valida o JWT antes de permitir operações
- ⚠️ **Acesso público**: Tecnicamente qualquer pessoa pode fazer upload, mas o controle é feito na aplicação
- 🔒 **Recomendação**: Em produção, considere implementar autenticação do Supabase Auth para maior segurança

## 🔐 Segurança

- ⚠️ **Acesso público ao Storage**: Políticas permitem acesso público ao bucket 'avatars'
- ✅ **Bucket específico**: Políticas aplicadas apenas ao bucket 'avatars'
- ✅ **Controle na aplicação**: Validação de JWT feita no frontend/backend antes do upload
- ✅ **Validação automática**: Supabase valida automaticamente as políticas
- 🔒 **Proteção adicional**: Sistema backend valida permissões antes de salvar URLs

## 🚨 Troubleshooting

### Erro: "policy already exists"
- **Causa**: Política já foi criada anteriormente
- **Solução**: Ignore o erro ou delete a política existente primeiro

### Erro: "bucket already exists"
- **Causa**: Bucket 'avatars' já existe
- **Solução**: Ignore o erro, o `ON CONFLICT DO NOTHING` já trata isso

### Upload ainda não funciona
1. Verifique se as políticas foram criadas corretamente
2. Confirme que o usuário está autenticado
3. Verifique se o token JWT é válido
4. Teste com a política permissiva primeiro

## ✅ Resultado Esperado

Após a configuração:
- ✅ Upload de avatar funcionando
- ✅ Sem erros de RLS
- ✅ Arquivos salvos no bucket 'avatars'
- ✅ Interface atualizada com novo avatar