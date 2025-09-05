// Script para debugar o problema dos nomes no chat
// Execute no console do navegador

console.log('🔧 Debugando problema dos nomes no chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar as mensagens
async function testMessages() {
    console.log('🔍 Testando mensagens do chat...');
    
    try {
        // Buscar mensagens do ticket
        const response = await fetch('/api/messages/list?ticket_id=273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dados recebidos:', data);
            
            if (data.messages && data.messages.length > 0) {
                console.log('📋 Mensagens encontradas:', data.messages.length);
                
                data.messages.forEach((message, index) => {
                    console.log(`\n📝 Mensagem ${index + 1}:`);
                    console.log('   ID:', message.id);
                    console.log('   Sender ID:', message.sender_id, '(tipo:', typeof message.sender_id, ')');
                    console.log('   Sender Name:', message.sender?.name);
                    console.log('   Sender Email:', message.sender?.email);
                    console.log('   Content:', message.content);
                    console.log('   Created:', message.created_at);
                });
                
                // Verificar se há mensagens do usuário atual
                const currentUserId = 1; // ID do admin no token
                console.log('\n🔍 Verificando mensagens do usuário atual (ID:', currentUserId, '):');
                
                data.messages.forEach((message, index) => {
                    const isOwn = message.sender_id === currentUserId.toString() || 
                                 message.sender_id === currentUserId ||
                                 message.sender_id == currentUserId;
                    
                    console.log(`   Mensagem ${index + 1}: ${isOwn ? '✅ PRÓPRIA' : '❌ DE OUTRO'}`);
                    console.log(`     Sender ID: ${message.sender_id} (${typeof message.sender_id})`);
                    console.log(`     Current User ID: ${currentUserId} (${typeof currentUserId})`);
                    console.log(`     Comparação: ${message.sender_id} === ${currentUserId} = ${message.sender_id === currentUserId}`);
                    console.log(`     Comparação string: ${message.sender_id} === "${currentUserId}" = ${message.sender_id === currentUserId.toString()}`);
                });
                
            } else {
                console.log('❌ Nenhuma mensagem encontrada');
            }
        } else {
            console.log('❌ Erro ao buscar mensagens:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testMessages();

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Possíveis causas:');
console.log('   - Sender ID está em formato diferente (string vs number)');
console.log('   - User ID não está sendo comparado corretamente');
console.log('   - Mensagens estão sendo atribuídas ao usuário errado');
console.log('   - Problema na lógica de isOwnMessage');
