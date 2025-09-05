// Script para testar o problema dos nomes no chat
// Execute no console do navegador

console.log('🔧 Testando problema dos nomes no chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar o chat completo
async function testChatNames() {
    console.log('🔍 Testando chat completo...');
    
    try {
        // 1. Buscar informações do ticket
        console.log('\n1️⃣ Buscando informações do ticket...');
        const ticketResponse = await fetch('/helpdesk/tickets/273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('✅ Dados do ticket:', ticketData);
            console.log('👤 Criador:', ticketData.creator || ticketData.created_by);
            console.log('👤 Técnico:', ticketData.assignee || ticketData.assigned_to);
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
        
        // 2. Buscar mensagens
        console.log('\n2️⃣ Buscando mensagens...');
        const messagesResponse = await fetch('/api/messages/list?ticket_id=273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('✅ Dados das mensagens:', messagesData);
            
            if (messagesData.messages && messagesData.messages.length > 0) {
                console.log('\n📋 Mensagens encontradas:');
                messagesData.messages.forEach((message, index) => {
                    console.log(`   ${index + 1}. ${message.sender?.name} (ID: ${message.sender_id}): ${message.content}`);
                });
            } else {
                console.log('❌ Nenhuma mensagem encontrada');
            }
        } else {
            console.log('❌ Erro ao buscar mensagens:', messagesResponse.status);
        }
        
        // 3. Verificar usuário atual
        console.log('\n3️⃣ Verificando usuário atual...');
        const tokenData = JSON.parse(atob(validToken.split('.')[1]));
        console.log('✅ Dados do token:', tokenData);
        console.log('👤 Usuário atual:', tokenData.name, '(ID:', tokenData.userId, ')');
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testChatNames();

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Se os nomes estiverem trocados, pode ser:');
console.log('   - Problema na lógica de isOwnMessage');
console.log('   - Dados do ticket incorretos');
console.log('   - Mensagens atribuídas ao usuário errado');
console.log('   - Problema na exibição dos nomes no modal');
