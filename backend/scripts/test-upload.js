import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testUpload() {
  console.log('🧪 Testando upload para Supabase Storage...\n');

  try {
    // Criar um arquivo de teste
    const testContent = 'Teste de upload - ' + new Date().toISOString();
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = path.join(process.cwd(), testFileName);
    
    fs.writeFileSync(testFilePath, testContent);
    console.log(`📝 Arquivo de teste criado: ${testFileName}`);

    // Testar upload para o bucket correto
    const bucketName = 'Anexo-chamado';
    const fileName = `chat/${testFileName}`;

    console.log(`🔄 Fazendo upload para bucket: ${bucketName}`);
    console.log(`📁 Caminho do arquivo: ${fileName}`);

    const fileBuffer = fs.readFileSync(testFilePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: false
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      return;
    }

    console.log('✅ Upload realizado com sucesso!');
    console.log('📊 Dados do upload:', data);

    // Obter URL pública
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('🔗 URL pública:', publicUrl.publicUrl);

    // Testar acesso à URL
    console.log('\n🌐 Testando acesso à URL...');
    try {
      const response = await fetch(publicUrl.publicUrl);
      if (response.ok) {
        const content = await response.text();
        console.log('✅ URL acessível!');
        console.log('📄 Conteúdo:', content);
      } else {
        console.error('❌ URL não acessível:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error('❌ Erro ao acessar URL:', fetchError);
    }

    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Arquivo de teste removido');

    // Listar arquivos no bucket
    console.log('\n📋 Listando arquivos no bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('chat', { limit: 10 });

    if (listError) {
      console.error('❌ Erro ao listar arquivos:', listError);
    } else {
      console.log(`📁 Encontrados ${files.length} arquivos no bucket:`);
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testUpload();
