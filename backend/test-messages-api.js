#!/usr/bin/env node

/**
 * Script para testar a API de mensagens
 * Verifica se o Supabase está funcionando corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testando API de mensagens...\n');

// Verificar configurações
console.log('📋 Configurações:');
console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ Ausente'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Configurada' : '❌ Ausente'}\n`);

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Configurações do Supabase ausentes!');
    console.log('📝 Verifique o arquivo .env');
    process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
    try {
        console.log('🔍 Testando conexão com Supabase...');
        
        // Teste 1: Verificar se consegue acessar o schema public
        const { data, error } = await supabase
            .from('messages')
            .select('count')
            .limit(1);

        if (error) {
            console.log('❌ Erro ao acessar tabela messages:', error);
            return false;
        }

        console.log('✅ Conexão com Supabase OK');
        return true;
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function testMessagesTable() {
    try {
        console.log('🔍 Testando tabela messages...');
        
        // Verificar se a tabela existe e tem dados
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .limit(5);

        if (error) {
            console.log('❌ Erro ao buscar mensagens:', error);
            return false;
        }

        console.log(`✅ Tabela messages OK - ${data.length} mensagens encontradas`);
        
        if (data.length > 0) {
            console.log('📋 Exemplo de mensagem:');
            console.log(`   - ID: ${data[0].id}`);
            console.log(`   - Ticket ID: ${data[0].ticket_id}`);
            console.log(`   - Sender ID: ${data[0].sender_id}`);
            console.log(`   - Content: ${data[0].content?.substring(0, 50)}...`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao testar tabela:', error.message);
        return false;
    }
}

async function testTicketMessages() {
    try {
        console.log('🔍 Testando mensagens para ticket específico...');
        
        // Testar com ticket ID 13 (que estava causando erro)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', 13)
            .order('created_at', { ascending: true });

        if (error) {
            console.log('❌ Erro ao buscar mensagens do ticket 13:', error);
            return false;
        }

        console.log(`✅ Mensagens do ticket 13: ${data.length} encontradas`);
        return true;
    } catch (error) {
        console.log('❌ Erro ao testar mensagens do ticket:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes...\n');
    
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
        console.log('\n❌ Testes falharam - problema de conexão');
        return;
    }
    
    const tableOk = await testMessagesTable();
    if (!tableOk) {
        console.log('\n❌ Testes falharam - problema na tabela');
        return;
    }
    
    const ticketOk = await testTicketMessages();
    if (!ticketOk) {
        console.log('\n❌ Testes falharam - problema com ticket específico');
        return;
    }
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('🎉 A API de mensagens deve estar funcionando agora');
}

runTests().catch(console.error);
