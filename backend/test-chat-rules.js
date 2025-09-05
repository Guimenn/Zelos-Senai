#!/usr/bin/env node

/**
 * Script para testar as regras do chat
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

console.log('🔧 Testando regras do chat...\n');

async function testChatRules() {
    try {
        // Token de admin
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        console.log('🔍 Testando acesso ao chat para ticket 13...');
        
        // Testar listagem de mensagens (verifica acesso)
        const listResponse = await fetch(`${API_BASE_URL}/api/messages/list?ticket_id=13`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status da listagem: ${listResponse.status}`);
        
        if (listResponse.ok) {
            const listData = await listResponse.json();
            console.log('✅ Acesso ao chat permitido!');
            console.log('📋 Chat access:', listData.chatAccess);
            console.log('📋 Mensagens encontradas:', listData.messages?.length || 0);
            
            // Testar envio de mensagem
            console.log('\n🔍 Testando envio de mensagem...');
            
            const sendResponse = await fetch(`${API_BASE_URL}/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticket_id: 13,
                    content: 'Teste das regras do chat - Admin'
                })
            });
            
            console.log(`📊 Status do envio: ${sendResponse.status}`);
            
            if (sendResponse.ok) {
                const sendData = await sendResponse.json();
                console.log('✅ Mensagem enviada com sucesso!');
                console.log('📋 ID da mensagem:', sendData.id);
                console.log('📋 Conteúdo:', sendData.content);
            } else {
                const errorText = await sendResponse.text();
                console.log('❌ Erro ao enviar mensagem:', errorText);
            }
            
        } else {
            const errorText = await listResponse.text();
            console.log('❌ Erro ao acessar chat:', errorText);
        }
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
    }
}

async function testTicketInfo() {
    try {
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        console.log('\n🔍 Verificando informações do ticket 13...');
        
        const ticketResponse = await fetch(`${API_BASE_URL}/helpdesk/tickets/13`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('✅ Informações do ticket:');
            console.log('📋 ID:', ticketData.id);
            console.log('📋 Título:', ticketData.title);
            console.log('📋 Status:', ticketData.status);
            console.log('📋 Criado por:', ticketData.created_by);
            console.log('📋 Técnico atribuído:', ticketData.assigned_to);
        } else {
            console.log('❌ Erro ao buscar informações do ticket');
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar informações do ticket:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes das regras do chat...\n');
    
    await testTicketInfo();
    await testChatRules();
    
    console.log('\n🎉 Testes concluídos!');
}

runTests().catch(console.error);
