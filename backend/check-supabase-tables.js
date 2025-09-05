#!/usr/bin/env node

/**
 * Script para verificar tabelas no Supabase
 * Lista todas as tabelas disponíveis
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando tabelas no Supabase...\n');

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Configurações do Supabase ausentes!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    try {
        console.log('🔍 Listando tabelas disponíveis...');
        
        // Tentar acessar diferentes tabelas para ver quais existem
        const tables = [
            'messages',
            'tickets', 
            'users',
            'comments',
            'categories',
            'agents',
            'clients'
        ];
        
        const results = {};
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('count')
                    .limit(1);
                
                if (error) {
                    results[table] = { exists: false, error: error.message };
                } else {
                    results[table] = { exists: true, count: data.length };
                }
            } catch (err) {
                results[table] = { exists: false, error: err.message };
            }
        }
        
        console.log('\n📋 Resultados:');
        for (const [table, result] of Object.entries(results)) {
            if (result.exists) {
                console.log(`✅ ${table}: Existe`);
            } else {
                console.log(`❌ ${table}: ${result.error}`);
            }
        }
        
        // Verificar se a tabela messages existe
        if (results.messages?.exists) {
            console.log('\n✅ Tabela messages existe!');
            console.log('🔍 O problema pode ser RLS (Row Level Security)');
            console.log('💡 Solução: Desabilitar RLS ou configurar políticas');
        } else {
            console.log('\n❌ Tabela messages não existe!');
            console.log('💡 Solução: Criar a tabela messages no Supabase');
        }
        
    } catch (error) {
        console.log('❌ Erro geral:', error.message);
    }
}

checkTables();
