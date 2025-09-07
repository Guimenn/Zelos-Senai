/**
 * Script para verificar e criar a tabela messages no Supabase
 * Execute este script para garantir que a tabela existe e está configurada corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configuração do Supabase...');
console.log('🔍 URL:', supabaseUrl);
console.log('🔍 Key configurada:', supabaseKey ? 'Sim' : 'Não');

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.error('❌ Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessagesTable() {
    try {
        console.log('🔍 Verificando se a tabela messages existe...');
        
        // Tentar fazer uma consulta simples na tabela
        const { data, error } = await supabase
            .from('messages')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Erro ao acessar tabela messages:', error);
            console.error('❌ Detalhes:', JSON.stringify(error, null, 2));
            
            if (error.code === 'PGRST116') {
                console.log('🔍 Tabela messages não existe. Criando...');
                await createMessagesTable();
            } else {
                console.error('❌ Erro inesperado:', error.message);
            }
        } else {
            console.log('✅ Tabela messages existe e está acessível');
            console.log('✅ Total de mensagens:', data?.[0]?.count || 0);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

async function createMessagesTable() {
    try {
        console.log('🔍 Criando tabela messages...');
        
        // SQL para criar a tabela messages
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                content TEXT,
                attachment_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Criar índices para melhor performance
            CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
            
            -- Habilitar RLS (Row Level Security)
            ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
            
            -- Política para permitir leitura para usuários autenticados
            CREATE POLICY IF NOT EXISTS "Allow read for authenticated users" ON messages
                FOR SELECT USING (auth.role() = 'authenticated');
            
            -- Política para permitir inserção para usuários autenticados
            CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" ON messages
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        `;
        
        const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (error) {
            console.error('❌ Erro ao criar tabela:', error);
            console.error('❌ Detalhes:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Tabela messages criada com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error);
    }
}

async function testRealtime() {
    try {
        console.log('🔍 Testando Realtime...');
        
        // Criar um canal de teste
        const channel = supabase
            .channel('test-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                console.log('✅ Realtime funcionando! Nova mensagem:', payload);
            })
            .subscribe();
        
        console.log('✅ Canal de Realtime criado com sucesso');
        
        // Aguardar um pouco e depois remover o canal
        setTimeout(() => {
            supabase.removeChannel(channel);
            console.log('✅ Canal de teste removido');
        }, 5000);
        
    } catch (error) {
        console.error('❌ Erro ao testar Realtime:', error);
    }
}

// Executar verificação
async function main() {
    console.log('🚀 Iniciando verificação do Supabase...');
    
    await checkMessagesTable();
    await testRealtime();
    
    console.log('✅ Verificação concluída!');
}

main().catch(console.error);
