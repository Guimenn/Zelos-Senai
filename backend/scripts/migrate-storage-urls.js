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

async function migrateStorageUrls() {
  console.log('🔄 Iniciando migração de URLs de storage...\n');

  try {
    // Buscar mensagens com URLs do bucket antigo
    const messages = await prisma.messages.findMany({
      where: {
        attachment_url: {
          contains: 'anexo-chat'
        }
      }
    });

    console.log(`📋 Encontradas ${messages.length} mensagens com URLs antigas`);

    if (messages.length === 0) {
      console.log('✅ Nenhuma URL antiga encontrada!');
      return;
    }

    // Mostrar algumas URLs antigas
    console.log('\n📝 URLs antigas encontradas:');
    messages.slice(0, 5).forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.attachment_url}`);
    });

    if (messages.length > 5) {
      console.log(`  ... e mais ${messages.length - 5} URLs`);
    }

    // Verificar se os arquivos existem no bucket antigo
    console.log('\n🔍 Verificando arquivos no bucket antigo...');
    const { data: oldFiles, error: oldError } = await supabase.storage
      .from('anexo-chat')
      .list('chat', { limit: 100 });

    if (oldError) {
      console.error('❌ Erro ao listar arquivos do bucket antigo:', oldError);
    } else {
      console.log(`📁 Encontrados ${oldFiles.length} arquivos no bucket antigo`);
    }

    // Verificar se os arquivos existem no bucket novo
    console.log('\n🔍 Verificando arquivos no bucket novo...');
    const { data: newFiles, error: newError } = await supabase.storage
      .from('Anexo-chamado')
      .list('chat', { limit: 100 });

    if (newError) {
      console.error('❌ Erro ao listar arquivos do bucket novo:', newError);
    } else {
      console.log(`📁 Encontrados ${newFiles.length} arquivos no bucket novo`);
    }

    // Migrar arquivos do bucket antigo para o novo
    if (oldFiles && oldFiles.length > 0) {
      console.log('\n🔄 Migrando arquivos do bucket antigo para o novo...');
      
      for (const file of oldFiles) {
        const oldPath = `chat/${file.name}`;
        const newPath = `chat/${file.name}`;
        
        try {
          // Baixar arquivo do bucket antigo
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('anexo-chat')
            .download(oldPath);

          if (downloadError) {
            console.error(`❌ Erro ao baixar ${oldPath}:`, downloadError);
            continue;
          }

          // Upload para o bucket novo
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Anexo-chamado')
            .upload(newPath, fileData, {
              contentType: file.metadata?.mimetype || 'application/octet-stream',
              upsert: true
            });

          if (uploadError) {
            console.error(`❌ Erro ao fazer upload de ${newPath}:`, uploadError);
            continue;
          }

          console.log(`✅ Migrado: ${oldPath} -> ${newPath}`);
        } catch (error) {
          console.error(`❌ Erro ao migrar ${oldPath}:`, error);
        }
      }
    }

    // Atualizar URLs no banco de dados
    console.log('\n🔄 Atualizando URLs no banco de dados...');
    
    let updatedCount = 0;
    for (const message of messages) {
      if (message.attachment_url) {
        const newUrl = message.attachment_url.replace('anexo-chat', 'Anexo-chamado');
        
        try {
          await prisma.messages.update({
            where: { id: message.id },
            data: { attachment_url: newUrl }
          });
          
          updatedCount++;
          console.log(`✅ Atualizada mensagem ${message.id}: ${message.attachment_url} -> ${newUrl}`);
        } catch (error) {
          console.error(`❌ Erro ao atualizar mensagem ${message.id}:`, error);
        }
      }
    }

    console.log(`\n✅ Migração concluída! ${updatedCount} URLs atualizadas.`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateStorageUrls();
