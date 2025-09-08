import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Buckets necessários para o sistema
const REQUIRED_BUCKETS = [
  {
    name: 'Anexo-chamado',
    public: true,
    description: 'Anexos de chamados e chat'
  },
  {
    name: 'avatars',
    public: true,
    description: 'Avatars de usuários'
  }
];

async function setupSupabaseStorage() {
  console.log('🚀 Configurando Supabase Storage...\n');

  try {
    // Listar buckets existentes
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    console.log('📋 Buckets existentes:');
    existingBuckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public})`);
    });
    console.log('');

    // Criar buckets necessários
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const exists = existingBuckets.some(bucket => bucket.name === bucketConfig.name);
      
      if (exists) {
        console.log(`✅ Bucket "${bucketConfig.name}" já existe`);
      } else {
        console.log(`🔧 Criando bucket "${bucketConfig.name}"...`);
        
        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public
        });

        if (error) {
          console.error(`❌ Erro ao criar bucket "${bucketConfig.name}":`, error);
        } else {
          console.log(`✅ Bucket "${bucketConfig.name}" criado com sucesso`);
        }
      }
    }

    console.log('\n🔒 Configurando políticas de acesso...');

    // Configurar políticas para o bucket de anexos
    const anexoBucket = 'Anexo-chamado';
    const policies = [
      {
        name: 'Permitir leitura pública de anexos',
        policy: `CREATE POLICY "Permitir leitura pública de anexos" ON storage.objects FOR SELECT USING (bucket_id = '${anexoBucket}');`
      },
      {
        name: 'Permitir upload de anexos para usuários autenticados',
        policy: `CREATE POLICY "Permitir upload de anexos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${anexoBucket}' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Permitir atualização de anexos próprios',
        policy: `CREATE POLICY "Permitir atualização de anexos próprios" ON storage.objects FOR UPDATE USING (bucket_id = '${anexoBucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`
      },
      {
        name: 'Permitir exclusão de anexos próprios',
        policy: `CREATE POLICY "Permitir exclusão de anexos próprios" ON storage.objects FOR DELETE USING (bucket_id = '${anexoBucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`
      }
    ];

    for (const policyConfig of policies) {
      try {
        console.log(`  🔧 Aplicando política: ${policyConfig.name}`);
        // Nota: As políticas precisam ser aplicadas manualmente no painel do Supabase
        // ou via SQL direto, pois não há API para isso no cliente JavaScript
        console.log(`  📝 SQL: ${policyConfig.policy}`);
      } catch (error) {
        console.error(`  ❌ Erro ao aplicar política:`, error);
      }
    }

    console.log('\n📝 INSTRUÇÕES IMPORTANTES:');
    console.log('1. Acesse o painel do Supabase (https://supabase.com/dashboard)');
    console.log('2. Vá para Storage > Policies');
    console.log('3. Aplique as políticas SQL mostradas acima para cada bucket');
    console.log('4. Ou execute os comandos SQL diretamente no SQL Editor');

    console.log('\n✅ Configuração do Supabase Storage concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar configuração
setupSupabaseStorage();
