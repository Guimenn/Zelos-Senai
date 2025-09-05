#!/usr/bin/env node

/**
 * Script para testar mensagens usando Prisma
 * Como o Prisma conseguiu acessar a tabela, vamos usar ele
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('🔧 Testando mensagens com Prisma...\n');

async function testMessagesWithPrisma() {
    try {
        console.log('🔍 Testando conexão com Prisma...');
        
        // Teste 1: Verificar se consegue acessar a tabela messages
        const messageCount = await prisma.messages.count();
        console.log(`✅ Tabela messages acessível - ${messageCount} mensagens encontradas`);
        
        // Teste 2: Buscar mensagens do ticket 13
        console.log('🔍 Buscando mensagens do ticket 13...');
        const messages = await prisma.messages.findMany({
            where: {
                ticket_id: 13
            },
            orderBy: {
                created_at: 'asc'
            }
        });
        
        console.log(`✅ Mensagens do ticket 13: ${messages.length} encontradas`);
        
        if (messages.length > 0) {
            console.log('📋 Exemplos de mensagens:');
            messages.forEach((msg, index) => {
                console.log(`   ${index + 1}. ID: ${msg.id}, Sender: ${msg.sender_id}, Content: ${msg.content?.substring(0, 50)}...`);
            });
        }
        
        // Teste 3: Inserir uma mensagem de teste
        console.log('🔍 Inserindo mensagem de teste...');
        const newMessage = await prisma.messages.create({
            data: {
                ticket_id: 13,
                sender_id: 1,
                content: 'Mensagem de teste via Prisma - ' + new Date().toISOString()
            }
        });
        
        console.log(`✅ Mensagem inserida com sucesso - ID: ${newMessage.id}`);
        
        // Teste 4: Buscar dados dos usuários (para o chat)
        console.log('🔍 Testando busca de usuários...');
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: [1, 2, 3] // IDs de teste
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            }
        });
        
        console.log(`✅ Usuários encontrados: ${users.length}`);
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro ao testar com Prisma:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes com Prisma...\n');
    
    const success = await testMessagesWithPrisma();
    
    if (success) {
        console.log('\n✅ Todos os testes passaram!');
        console.log('🎉 O Prisma consegue acessar a tabela messages');
        console.log('💡 Solução: Use Prisma em vez do Supabase diretamente no backend');
    } else {
        console.log('\n❌ Testes falharam');
    }
    
    // Fechar conexão
    await prisma.$disconnect();
}

runTests().catch(console.error);
