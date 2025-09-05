#!/usr/bin/env node

/**
 * Script para verificar se a chave do Supabase é válida
 * Decodifica o JWT para verificar o role
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando chave do Supabase...\n');

if (!supabaseKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!');
    process.exit(1);
}

// Decodificar o JWT para verificar o role
try {
    const parts = supabaseKey.split('.');
    if (parts.length !== 3) {
        console.log('❌ Chave não é um JWT válido');
        process.exit(1);
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('📋 Informações da chave:');
    console.log(`- Issuer: ${payload.iss}`);
    console.log(`- Subject: ${payload.sub}`);
    console.log(`- Role: ${payload.role}`);
    console.log(`- Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`- Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
    
    if (payload.role === 'service_role') {
        console.log('\n✅ Chave é uma service role key válida!');
    } else {
        console.log(`\n❌ Chave não é uma service role key! Role: ${payload.role}`);
        console.log('💡 Use a service role key, não a anon key');
    }
    
} catch (error) {
    console.log('❌ Erro ao decodificar chave:', error.message);
}

// Testar com a chave
if (supabaseUrl && supabaseKey) {
    console.log('\n🔍 Testando conexão...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Tentar uma operação simples
    supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.log('❌ Erro na conexão:', error.message);
                if (error.message.includes('permission denied')) {
                    console.log('\n💡 Possíveis soluções:');
                    console.log('1. Verificar se a chave é realmente a service role key');
                    console.log('2. Verificar se o projeto Supabase está ativo');
                    console.log('3. Verificar se as permissões estão configuradas corretamente');
                }
            } else {
                console.log('✅ Conexão com Supabase OK');
            }
        })
        .catch(err => {
            console.log('❌ Erro de conexão:', err.message);
        });
}
