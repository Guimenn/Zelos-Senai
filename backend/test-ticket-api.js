#!/usr/bin/env node

/**
 * Script para testar a API de tickets
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

console.log('🔧 Testando API de tickets...\n');

async function testTicketAPI(ticketId) {
    try {
        console.log(`🔍 Testando ticket ID: ${ticketId}`);
        
        // Token válido gerado
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        const response = await fetch(`${API_BASE_URL}/helpdesk/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API funcionando!');
            console.log(`📋 Ticket: ${data.title} (${data.ticket_number})`);
            console.log(`📊 Status: ${data.status}`);
            console.log(`👤 Técnico: ${data.assignee?.name || 'Nenhum'}`);
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

async function testMessagesAPI(ticketId) {
    try {
        console.log(`🔍 Testando mensagens para ticket ID: ${ticketId}`);
        
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        const response = await fetch(`${API_BASE_URL}/api/messages/list?ticket_id=${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status HTTP: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API de mensagens funcionando!');
            console.log(`📋 Mensagens encontradas: ${data.messages?.length || 0}`);
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Erro na API de mensagens: ${response.status} - ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes da API...\n');
    
    // Testar com ticket 13 (que existe)
    const ticketOk = await testTicketAPI(13);
    console.log('');
    
    // Testar mensagens para ticket 13
    const messagesOk = await testMessagesAPI(13);
    console.log('');
    
    // Testar com ticket 5 (que tem técnico)
    console.log('--- Testando ticket 5 (com técnico) ---');
    const ticket5Ok = await testTicketAPI(5);
    console.log('');
    
    if (ticketOk && messagesOk) {
        console.log('✅ APIs estão funcionando!');
        console.log('🎉 O chat deve funcionar agora');
    } else {
        console.log('❌ APIs não estão funcionando corretamente');
    }
}

runTests().catch(console.error);
