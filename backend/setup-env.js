#!/usr/bin/env node

/**
 * Script para configurar o arquivo .env do backend
 * Resolve problemas de configuração do Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('🔧 Configurando arquivo .env do backend...\n');

// Verificar se .env já existe
if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env já existe');
    
    // Verificar se tem SUPABASE_SERVICE_ROLE_KEY
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
        console.log('✅ SUPABASE_SERVICE_ROLE_KEY já configurada');
    } else {
        console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada');
        console.log('📝 Adicione a chave de serviço do Supabase no arquivo .env');
    }
} else {
    // Copiar do env.example
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Arquivo .env criado a partir do env.example');
        console.log('⚠️  IMPORTANTE: Configure as variáveis do Supabase no arquivo .env');
    } else {
        console.log('❌ Arquivo env.example não encontrado');
        process.exit(1);
    }
}

console.log('\n📋 Configurações necessárias no .env:');
console.log('1. SUPABASE_URL="https://seu-projeto.supabase.co"');
console.log('2. SUPABASE_SERVICE_ROLE_KEY="sua-chave-de-servico"');
console.log('3. DATABASE_URL="sua-url-do-banco"');
console.log('4. DIRECT_URL="sua-url-direta-do-banco"');

console.log('\n🔍 Como encontrar essas informações no Supabase:');
console.log('1. Acesse seu projeto no Supabase');
console.log('2. Vá em Settings > API');
console.log('3. Copie a URL do projeto e as chaves');
console.log('4. Vá em Settings > Database para a DATABASE_URL');

console.log('\n⚠️  IMPORTANTE:');
console.log('- Use SUPABASE_SERVICE_ROLE_KEY (não a anon key)');
console.log('- A service role key tem permissões para acessar o schema public');
console.log('- A anon key é limitada e causa erro 42501');

console.log('\n✅ Após configurar, reinicie o servidor backend');
