#!/usr/bin/env node

/**
 * Script para gerar um token JWT válido para teste
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

console.log('🔧 Gerando token JWT para teste...\n');

// Payload do token
const payload = {
    userId: 1,
    role: 'Admin',
    name: 'Admin Teste',
    email: 'admin@teste.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
};

try {
    // Gerar token
    const token = jwt.sign(payload, JWT_SECRET);
    
    console.log('✅ Token gerado com sucesso!');
    console.log(`📋 Payload:`, payload);
    console.log(`🔑 Token: ${token}`);
    
    // Verificar se o token é válido
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ Token verificado:`, decoded);
    
    console.log('\n💡 Use este token para testar a API:');
    console.log(`Authorization: Bearer ${token}`);
    
} catch (error) {
    console.log('❌ Erro ao gerar token:', error.message);
}
