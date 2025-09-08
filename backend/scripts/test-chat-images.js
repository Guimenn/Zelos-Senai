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

async function testChatImages() {
  console.log('🧪 Testando imagens do chat...\n');

  try {
    // Buscar mensagens com imagens
    const messages = await prisma.messages.findMany({
      where: {
        attachment_url: {
          not: null
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    console.log(`📋 Testando ${messages.length} mensagens com anexos:\n`);

    let workingImages = 0;
    let brokenImages = 0;

    for (const message of messages) {
      if (!message.attachment_url) continue;

      console.log(`🔍 Mensagem ${message.id}:`);
      console.log(`   URL: ${message.attachment_url}`);

      // Verificar se é uma imagem
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachment_url);
      console.log(`   Tipo: ${isImage ? 'Imagem' : 'Arquivo'}`);

      if (isImage) {
        // Testar acesso à URL
        try {
          const response = await fetch(message.attachment_url);
          if (response.ok) {
            console.log(`   ✅ Imagem acessível (${response.status})`);
            console.log(`   📄 Content-Type: ${response.headers.get('content-type')}`);
            workingImages++;
          } else {
            console.log(`   ❌ Imagem não acessível (${response.status})`);
            brokenImages++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao acessar: ${error.message}`);
          brokenImages++;
        }
      } else {
        console.log(`   ℹ️ Arquivo não é imagem, pulando teste de visualização`);
      }

      console.log('');
    }

    console.log('📊 Resumo do teste:');
    console.log(`   ✅ Imagens funcionando: ${workingImages}`);
    console.log(`   ❌ Imagens com problema: ${brokenImages}`);
    console.log(`   📈 Taxa de sucesso: ${workingImages + brokenImages > 0 ? Math.round((workingImages / (workingImages + brokenImages)) * 100) : 0}%`);

    if (brokenImages === 0) {
      console.log('\n🎉 Todas as imagens estão funcionando perfeitamente!');
    } else {
      console.log(`\n⚠️ ${brokenImages} imagem(ns) com problema. Verifique os logs acima.`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testChatImages();
