# 📎 API de Anexos - Sistema de Helpdesk

## 📋 Visão Geral

O sistema de anexos permite upload, download, visualização e gerenciamento de arquivos associados a tickets e comentários.

## 🚀 Funcionalidades

- ✅ **Upload de arquivo único**
- ✅ **Upload de múltiplos arquivos** (máximo 5)
- ✅ **Download de arquivos**
- ✅ **Visualização de imagens**
- ✅ **Listagem de anexos por ticket/comentário**
- ✅ **Exclusão de anexos**
- ✅ **Validação de tipos de arquivo**
- ✅ **Limite de tamanho** (10MB por arquivo)

## 📁 Tipos de Arquivo Suportados

### Imagens
- JPEG, JPG, PNG, GIF

### Documentos
- PDF, DOC, DOCX, TXT

### Vídeos
- MP4, AVI, MOV, WMV

### Arquivos Compactados
- ZIP, RAR

## 🔗 Endpoints

### Base URL
```
http://localhost:3001/api/attachments
```

### 1. Upload de Arquivo Único
```http
POST /api/attachments/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: [arquivo]
- ticketId: [ID do ticket] (opcional)
- commentId: [ID do comentário] (opcional)
```

**Resposta:**
```json
{
  "success": true,
  "message": "Anexo enviado com sucesso",
  "data": {
    "id": 1,
    "filename": "file-1234567890-123456789.jpg",
    "original_name": "screenshot.jpg",
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "ticket_id": 1,
    "comment_id": null,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Upload de Múltiplos Arquivos
```http
POST /api/attachments/upload-multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- files: [arquivo1, arquivo2, ...] (máximo 5)
- ticketId: [ID do ticket] (opcional)
- commentId: [ID do comentário] (opcional)
```

### 3. Download de Arquivo
```http
GET /api/attachments/download/:id
Authorization: Bearer <token>
```

**Resposta:** Arquivo para download

### 4. Visualizar Imagem
```http
GET /api/attachments/view/:id
Authorization: Bearer <token>
```

**Resposta:** Imagem para visualização no navegador

### 5. Listar Anexos de um Ticket
```http
GET /api/attachments/ticket/:ticketId
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "filename": "file-1234567890-123456789.jpg",
      "original_name": "screenshot.jpg",
      "file_size": 1024000,
      "mime_type": "image/jpeg",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 6. Listar Anexos de um Comentário
```http
GET /api/attachments/comment/:commentId
Authorization: Bearer <token>
```

### 7. Deletar Anexo
```http
DELETE /api/attachments/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Anexo deletado com sucesso"
}
```

## 🔐 Permissões

- **Admin**: Acesso total a todos os anexos
- **Agent**: Acesso aos anexos dos tickets atribuídos
- **Client**: Acesso aos anexos dos próprios tickets

## ⚠️ Validações

### Tamanho de Arquivo
- **Máximo**: 10MB por arquivo
- **Erro**: `Arquivo muito grande. Tamanho máximo permitido: 10MB`

### Quantidade de Arquivos
- **Máximo**: 5 arquivos por upload
- **Erro**: `Muitos arquivos. Máximo permitido: 5 arquivos`

### Tipos de Arquivo
- **Permitidos**: Imagens, documentos, vídeos, arquivos compactados
- **Erro**: `Tipo de arquivo não permitido. Apenas imagens, vídeos, documentos e arquivos compactados são aceitos.`

## 📝 Exemplos de Uso

### JavaScript (Fetch)
```javascript
// Upload de arquivo único
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('ticketId', '1');

const response = await fetch('/api/attachments/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### cURL
```bash
# Upload de arquivo
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.jpg" \
  -F "ticketId=1" \
  http://localhost:3001/api/attachments/upload

# Download de arquivo
curl -X GET \
  -H "Authorization: Bearer <token>" \
  -o downloaded_file.jpg \
  http://localhost:3001/api/attachments/download/1
```

## 🗂️ Estrutura de Arquivos

```
backend/
├── uploads/           # Diretório de arquivos
│   ├── file-1234567890-123456789.jpg
│   ├── file-1234567890-123456790.pdf
│   └── ...
├── src/
│   ├── controllers/
│   │   └── AttachmentController.js
│   ├── routes/
│   │   └── attachmentRoute.js
│   └── middlewares/
│       └── uploadErrorHandler.js
└── ATTACHMENT_API.md
```

## 🚨 Tratamento de Erros

### Erros Comuns

1. **Arquivo não enviado**
   ```json
   {
     "success": false,
     "message": "Nenhum arquivo foi enviado"
   }
   ```

2. **Ticket/Comentário não encontrado**
   ```json
   {
     "success": false,
     "message": "Ticket não encontrado"
   }
   ```

3. **Anexo não encontrado**
   ```json
   {
     "success": false,
     "message": "Anexo não encontrado"
   }
   ```

4. **Arquivo não encontrado no servidor**
   ```json
   {
     "success": false,
     "message": "Arquivo não encontrado no servidor"
   }
   ```

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Tamanho máximo de arquivo (opcional, padrão: 10MB)
MAX_FILE_SIZE=10485760

# Quantidade máxima de arquivos (opcional, padrão: 5)
MAX_FILES_COUNT=5
```

### Diretório de Uploads
- **Padrão**: `backend/uploads/`
- **Criado automaticamente** se não existir
- **Permissões**: Leitura/escrita para o servidor

## 📊 Estatísticas

- **Tipos suportados**: 13 formatos
- **Tamanho máximo**: 10MB por arquivo
- **Quantidade máxima**: 5 arquivos por upload
- **Segurança**: Validação de tipo e tamanho
- **Performance**: Stream de arquivos para download

## 🎯 Próximas Melhorias

- [ ] **Compressão automática** de imagens
- [ ] **Thumbnails** para imagens
- [ ] **Upload em chunks** para arquivos grandes
- [ ] **Integração com cloud storage** (AWS S3, Google Cloud)
- [ ] **Vírus scanning** dos arquivos
- [ ] **Watermark** automático em imagens 