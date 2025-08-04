import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug para verificar se as variáveis estão sendo carregadas
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Carregado' : '❌ Não encontrado');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Carregado' : '❌ Não encontrado');

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export function handleSupabaseError(error) {
    console.error('Erro do Supabase:', error);
    
    if (error.code === 'PGRST116') {
        return { message: 'Registro não encontrado' };
    }
    
    if (error.code === '23505') {
        return { message: 'Registro já existe' };
    }
    
    if (error.code === '23503') {
        return { message: 'Violação de chave estrangeira' };
    }
    
    return { message: error.message || 'Erro interno do servidor' };
}

export function formatSupabaseResponse(data, single = false) {
    if (single) {
        return data;
    }
    
    return Array.isArray(data) ? data : [];
} 