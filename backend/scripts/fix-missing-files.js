import { PrismaClient } from '../src/generated/prisma/index.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixMissingFiles() {
  console.log('🔧 Verificando e corrigindo arquivos ausentes...\n');

  try {
    // Buscar mensagens com attachment_url
    const messages = await prisma.messages.findMany({
      where: {
        attachment_url: {
          not: null
        }
      }
    });

    console.log(`📋 Encontradas ${messages.length} mensagens com anexos`);

    let fixedCount = 0;
    let removedCount = 0;

    for (const message of messages) {
      if (!message.attachment_url) continue;

      console.log(`\n🔍 Verificando mensagem ${message.id}:`);
      console.log(`   URL: ${message.attachment_url}`);

      // Extrair nome do arquivo da URL
      const urlParts = message.attachment_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const bucketName = urlParts[urlParts.length - 3]; // Anexo-chamado ou anexo-chat
      
      console.log(`   Arquivo: ${fileName}`);
      console.log(`   Bucket: ${bucketName}`);

      // Verificar se o arquivo existe
      const filePath = `chat/${fileName}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('chat', { search: fileName });

      if (error) {
        console.error(`   ❌ Erro ao verificar arquivo: ${error.message}`);
        continue;
      }

      const fileExists = data.some(file => file.name === fileName);

      if (fileExists) {
        console.log(`   ✅ Arquivo existe`);
      } else {
        console.log(`   ❌ Arquivo NÃO existe`);
        
        // Tentar encontrar em outros buckets
        const buckets = ['Anexo-chamado', 'anexo-chat'];
        let foundInOtherBucket = false;
        
        for (const bucket of buckets) {
          if (bucket === bucketName) continue; // Já verificamos este bucket
          
          const { data: otherData, error: otherError } = await supabase.storage
            .from(bucket)
            .list('chat', { search: fileName });
            
          if (!otherError && otherData.some(file => file.name === fileName)) {
            console.log(`   🔄 Arquivo encontrado no bucket ${bucket}, migrando...`);
            
            try {
              // Baixar do bucket onde foi encontrado
              const { data: fileData, error: downloadError } = await supabase.storage
                .from(bucket)
                .download(filePath);

              if (downloadError) {
                console.error(`   ❌ Erro ao baixar: ${downloadError.message}`);
                continue;
              }

              // Upload para o bucket correto
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('Anexo-chamado')
                .upload(filePath, fileData, {
                  contentType: 'image/webp',
                  upsert: true
                });

              if (uploadError) {
                console.error(`   ❌ Erro ao fazer upload: ${uploadError.message}`);
                continue;
              }

              // Atualizar URL no banco
              const newUrl = message.attachment_url.replace(bucket, 'Anexo-chamado');
              await prisma.messages.update({
                where: { id: message.id },
                data: { attachment_url: newUrl }
              });

              console.log(`   ✅ Arquivo migrado e URL atualizada`);
              fixedCount++;
              foundInOtherBucket = true;
              break;
            } catch (error) {
              console.error(`   ❌ Erro na migração: ${error.message}`);
            }
          }
        }
        
        if (!foundInOtherBucket) {
          console.log(`   🗑️ Arquivo não encontrado em nenhum bucket, removendo anexo...`);
          
          // Remover attachment_url da mensagem
          await prisma.messages.update({
            where: { id: message.id },
            data: { attachment_url: null }
          });
          
          removedCount++;
        }
      }
    }

    console.log(`\n✅ Verificação concluída!`);
    console.log(`   🔧 Arquivos migrados: ${fixedCount}`);
    console.log(`   🗑️ Anexos removidos: ${removedCount}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar correção
fixMissingFiles();
