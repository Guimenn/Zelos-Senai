# 🔍 Debug do Erro de Upload

## ❌ **Problema Atual**
Erro 500 "Erro interno do servidor" ao tentar fazer upload de arquivos.

## 🔧 **Solução Implementada**

Adicionei logs detalhados no controller de upload para identificar exatamente onde está o problema.

## 📋 **Passos para Debug**

### **1. Verificar os Logs do Backend**

1. **Abra o terminal do backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Tente fazer upload de um arquivo no chat**

3. **Verifique os logs no console do backend** - você deve ver algo como:
   ```
   🔍 Upload iniciado - Supabase configurado: true/false
   🔍 Supabase URL: https://pyrxlymsoidmjxjenesb.supabase.co
   🔍 Supabase Key configurada: true/false
   🔍 Multer callback executado
   📎 Arquivo recebido: { ... }
   ```

### **2. Possíveis Cenários**

#### **Cenário A: Supabase não configurado**
Se você ver:
```
🔍 Upload iniciado - Supabase configurado: false
🔍 Supabase Key configurada: false
❌ Supabase não configurado - usando fallback local
```

**Solução:** Configurar as variáveis de ambiente do Supabase.

#### **Cenário B: Erro no Supabase**
Se você ver:
```
🔍 Upload iniciado - Supabase configurado: true
📎 Iniciando upload para Supabase...
❌ Erro no upload para Supabase: { ... }
```

**Solução:** Verificar se o bucket "anexo-chat" existe e as políticas estão configuradas.

#### **Cenário C: Erro no Multer**
Se você ver:
```
❌ Erro do Multer: { ... }
```

**Solução:** Verificar se o arquivo é válido e não excede 10MB.

### **3. Configuração Rápida do Supabase**

Se o Supabase não estiver configurado, crie o arquivo `backend/.env`:

```env
# Supabase
SUPABASE_URL="https://pyrxlymsoidmjxjenesb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVICE_ROLE_AQUI"
```

### **4. Fallback Local**

Se o Supabase não estiver configurado, o sistema agora usa um fallback local que:
- Salva o arquivo na pasta `uploads/chat/`
- Retorna uma URL local temporária
- Permite que o chat funcione mesmo sem Supabase

## 🎯 **Próximos Passos**

1. **Execute o backend** e verifique os logs
2. **Tente fazer upload** de um arquivo
3. **Compartilhe os logs** que aparecem no console
4. **Baseado nos logs**, aplicaremos a solução específica

## 📝 **Logs Esperados**

### **Com Supabase configurado:**
```
🔍 Upload iniciado - Supabase configurado: true
🔍 Supabase URL: https://pyrxlymsoidmjxjenesb.supabase.co
🔍 Supabase Key configurada: true
🔍 Multer callback executado
📎 Arquivo recebido: { originalname: 'test.jpg', filename: 'uuid-test.jpg', ... }
📎 Iniciando upload para Supabase...
✅ Upload para Supabase concluído: { ... }
🔗 URL pública gerada: https://...
```

### **Sem Supabase configurado:**
```
🔍 Upload iniciado - Supabase configurado: false
🔍 Supabase Key configurada: false
🔍 Multer callback executado
📎 Arquivo recebido: { ... }
❌ Supabase não configurado - usando fallback local
```

**Compartilhe os logs que aparecem no seu console para identificarmos o problema exato!** 🔍
