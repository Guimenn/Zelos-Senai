import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkFile() {
  console.log('🔍 Verificando arquivo test-file.webp...\n');

  const fileName = 'chat/test-file.webp';
  const bucketName = 'Anexo-chamado';

  try {
    // Verificar se o arquivo existe
    console.log(`📁 Verificando arquivo: ${fileName} no bucket: ${bucketName}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('chat', { search: 'test-file.webp' });

    if (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      return;
    }

    console.log('📋 Arquivos encontrados:', data);

    // Verificar se o arquivo específico existe
    const fileExists = data.some(file => file.name === 'test-file.webp');
    
    if (fileExists) {
      console.log('✅ Arquivo test-file.webp encontrado!');
      
      // Obter URL pública
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      console.log('🔗 URL pública:', publicUrl.publicUrl);
      
      // Testar acesso
      console.log('\n🌐 Testando acesso à URL...');
      try {
        const response = await fetch(publicUrl.publicUrl);
        console.log('📊 Status da resposta:', response.status, response.statusText);
        
        if (response.ok) {
          console.log('✅ Arquivo acessível!');
          console.log('📄 Content-Type:', response.headers.get('content-type'));
          console.log('📏 Content-Length:', response.headers.get('content-length'));
        } else {
          console.error('❌ Arquivo não acessível:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('❌ Erro ao acessar URL:', fetchError);
      }
      
    } else {
      console.log('❌ Arquivo test-file.webp NÃO encontrado!');
      
      // Listar todos os arquivos para debug
      console.log('\n📋 Listando todos os arquivos no diretório chat:');
      const { data: allFiles, error: listError } = await supabase.storage
        .from(bucketName)
        .list('chat');
        
      if (listError) {
        console.error('❌ Erro ao listar todos os arquivos:', listError);
      } else {
        console.log(`📁 Total de arquivos: ${allFiles.length}`);
        allFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name}`);
        });
      }
    }

    // Verificar se existe no bucket antigo
    console.log('\n🔍 Verificando no bucket antigo (anexo-chat)...');
    const { data: oldFiles, error: oldError } = await supabase.storage
      .from('anexo-chat')
      .list('chat', { search: 'test-file.webp' });

    if (oldError) {
      console.error('❌ Erro ao verificar bucket antigo:', oldError);
    } else {
      const oldFileExists = oldFiles.some(file => file.name === 'test-file.webp');
      if (oldFileExists) {
        console.log('⚠️ Arquivo ainda existe no bucket antigo!');
        console.log('🔄 Migrando arquivo...');
        
        // Baixar do bucket antigo
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('anexo-chat')
          .download(fileName);

        if (downloadError) {
          console.error('❌ Erro ao baixar do bucket antigo:', downloadError);
        } else {
          // Upload para o bucket novo
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileData, {
              contentType: 'image/webp',
              upsert: true
            });

          if (uploadError) {
            console.error('❌ Erro ao fazer upload para bucket novo:', uploadError);
          } else {
            console.log('✅ Arquivo migrado com sucesso!');
            console.log('📊 Dados do upload:', uploadData);
          }
        }
      } else {
        console.log('ℹ️ Arquivo não existe no bucket antigo');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkFile();
