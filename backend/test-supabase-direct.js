#!/usr/bin/env node

/**
 * Script para testar Supabase diretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pyrxlymsoidmjxjenesb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cnhseW1zb2lkbWp4amVuZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzQ0NzQsImV4cCI6MjA1MTI1MDQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testando Supabase diretamente...\n');

async function testSupabase() {
    try {
        // Teste 1: Cliente com chave anônima
        console.log('🔍 Teste 1: Cliente com chave anônima');
        const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const { data: anonData, error: anonError } = await supabaseAnon
            .from('messages')
            .select('count')
            .limit(1);
        
        if (anonError) {
            console.log('❌ Erro com chave anônima:', anonError.message);
            console.log('📋 Código do erro:', anonError.code);
        } else {
            console.log('✅ Chave anônima funcionando');
        }
        
        // Teste 2: Cliente com service role key (se disponível)
        if (SUPABASE_SERVICE_ROLE_KEY) {
            console.log('\n🔍 Teste 2: Cliente com service role key');
            const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            
            const { data: serviceData, error: serviceError } = await supabaseService
                .from('messages')
                .select('count')
                .limit(1);
            
            if (serviceError) {
                console.log('❌ Erro com service role key:', serviceError.message);
                console.log('📋 Código do erro:', serviceError.code);
            } else {
                console.log('✅ Service role key funcionando');
            }
        } else {
            console.log('\n❌ Service role key não configurada');
        }
        
        // Teste 3: Verificar se a tabela existe
        console.log('\n🔍 Teste 3: Verificar tabela messages');
        const { data: tableData, error: tableError } = await supabaseAnon
            .from('messages')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Erro ao acessar tabela messages:', tableError.message);
            console.log('📋 Código do erro:', tableError.code);
        } else {
            console.log('✅ Tabela messages acessível');
            console.log('📋 Dados encontrados:', tableData?.length || 0);
        }
        
        // Teste 4: Verificar RLS
        console.log('\n🔍 Teste 4: Verificar RLS');
        const { data: rlsData, error: rlsError } = await supabaseAnon
            .from('messages')
            .select('*')
            .eq('ticket_id', 13)
            .limit(1);
        
        if (rlsError) {
            console.log('❌ Erro RLS:', rlsError.message);
            console.log('📋 Código do erro:', rlsError.code);
        } else {
            console.log('✅ RLS funcionando');
            console.log('📋 Mensagens para ticket 13:', rlsData?.length || 0);
        }
        
    } catch (error) {
        console.log('❌ Erro geral:', error.message);
    }
}

testSupabase();
