#!/usr/bin/env node

/**
 * Script para testar o envio de mensagens
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

console.log('🔧 Testando envio de mensagens...\n');

async function testSendMessage() {
    try {
        // Token válido
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        console.log('🔍 Testando envio de mensagem...');
        
        const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: 13,
                content: 'Teste de mensagem via API'
            })
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Mensagem enviada com sucesso!');
            console.log('📋 ID da mensagem:', data.id);
            console.log('📋 Conteúdo:', data.content);
            console.log('📋 Remetente:', data.sender?.name);
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Erro ao enviar mensagem:', response.status, errorText);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function testListMessages() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        console.log('\n🔍 Testando listagem de mensagens...');
        
        const response = await fetch(`${API_BASE_URL}/api/messages/list?ticket_id=13`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Mensagens listadas com sucesso!');
            console.log('📋 Total de mensagens:', data.messages?.length || 0);
            if (data.messages && data.messages.length > 0) {
                console.log('📋 Última mensagem:', data.messages[data.messages.length - 1].content);
            }
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Erro ao listar mensagens:', response.status, errorText);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes de mensagens...\n');
    
    const sendOk = await testSendMessage();
    const listOk = await testListMessages();
    
    if (sendOk && listOk) {
        console.log('\n✅ Todos os testes passaram!');
        console.log('🎉 O chat deve funcionar agora');
    } else {
        console.log('\n❌ Alguns testes falharam');
    }
}

runTests().catch(console.error);
