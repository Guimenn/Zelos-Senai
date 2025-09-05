#!/usr/bin/env node

/**
 * Script para testar ambas as chaves do Supabase
 * Compara service role key vs anon key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testando ambas as chaves do Supabase...\n');

async function testKey(keyName, key) {
    console.log(`🔍 Testando ${keyName}...`);
    
    if (!key) {
        console.log(`❌ ${keyName} não encontrada`);
        return false;
    }
    
    const supabase = createClient(supabaseUrl, key);
    
    try {
        // Teste 1: Acessar tabela messages
        const { data, error } = await supabase
            .from('messages')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log(`❌ ${keyName} - Erro: ${error.message}`);
            return false;
        } else {
            console.log(`✅ ${keyName} - Acesso OK`);
            return true;
        }
    } catch (err) {
        console.log(`❌ ${keyName} - Erro: ${err.message}`);
        return false;
    }
}

async function testProjectStatus() {
    console.log('🔍 Verificando status do projeto...');
    
    try {
        // Tentar acessar informações básicas do projeto
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            }
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ Projeto Supabase está ativo');
            return true;
        } else if (response.status === 401) {
            console.log('❌ Projeto Supabase - Chave inválida');
            return false;
        } else if (response.status === 403) {
            console.log('❌ Projeto Supabase - Acesso negado');
            return false;
        } else {
            console.log(`❌ Projeto Supabase - Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro ao verificar projeto:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes...\n');
    
    // Verificar status do projeto
    const projectOk = await testProjectStatus();
    if (!projectOk) {
        console.log('\n❌ Projeto Supabase não está acessível');
        console.log('💡 Verifique se o projeto está ativo no dashboard do Supabase');
        return;
    }
    
    // Testar service role key
    const serviceOk = await testKey('Service Role Key', serviceKey);
    
    // Testar anon key
    const anonOk = await testKey('Anon Key', anonKey);
    
    console.log('\n📋 Resumo:');
    console.log(`- Projeto: ${projectOk ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`- Service Role: ${serviceOk ? '✅ OK' : '❌ Erro'}`);
    console.log(`- Anon Key: ${anonOk ? '✅ OK' : '❌ Erro'}`);
    
    if (!serviceOk && !anonOk) {
        console.log('\n💡 Possíveis soluções:');
        console.log('1. Verificar se o projeto Supabase está ativo');
        console.log('2. Verificar se as tabelas existem no banco');
        console.log('3. Verificar se o RLS está configurado corretamente');
        console.log('4. Regenerar as chaves no dashboard do Supabase');
    }
}

runTests().catch(console.error);
