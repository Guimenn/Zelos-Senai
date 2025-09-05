#!/usr/bin/env node

/**
 * Script para testar a API HTTP de mensagens
 * Testa o endpoint /api/messages/list diretamente
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

console.log('🔧 Testando API HTTP de mensagens...\n');

async function testMessagesAPI() {
    try {
        console.log('🔍 Testando endpoint /api/messages/list...');
        
        // Simular um token de autenticação (você pode precisar ajustar)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsImlhdCI6MTczNTY3NDQ3NCwiZXhwIjoxNzM2Mjc5Mjc0fQ.example';
        
        const response = await fetch(`${API_BASE_URL}/api/messages/list?ticket_id=13`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API funcionando!');
            console.log(`📋 Mensagens encontradas: ${data.messages?.length || 0}`);
            
            if (data.messages && data.messages.length > 0) {
                console.log('📝 Exemplos de mensagens:');
                data.messages.slice(0, 3).forEach((msg, index) => {
                    console.log(`   ${index + 1}. ID: ${msg.id}, Sender: ${msg.sender_id}, Content: ${msg.content?.substring(0, 50)}...`);
                });
            }
            
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro na API: ${response.status} - ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes da API HTTP...\n');
    
    const success = await testMessagesAPI();
    
    if (success) {
        console.log('\n✅ API de mensagens está funcionando!');
        console.log('🎉 O chat deve funcionar agora');
    } else {
        console.log('\n❌ API de mensagens não está funcionando');
        console.log('💡 Verifique se o servidor backend está rodando');
    }
}

runTests().catch(console.error);
