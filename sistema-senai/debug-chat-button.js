// Script para debugar por que o botão do chat não aparece
// Execute no console do navegador

console.log('🔧 Debugando botão do chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar um ticket específico
async function testTicket(ticketId) {
    console.log(`\n🔍 Testando ticket ${ticketId}...`);
    
    try {
        // Testar API de tickets
        const ticketResponse = await fetch(`/helpdesk/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('✅ Dados do ticket:', ticketData);
            console.log('👤 Técnico atribuído:', ticketData.assigned_to);
            console.log('👤 Assignee:', ticketData.assignee);
            console.log('📊 Status:', ticketData.status);
            
            // Verificar se há técnico atribuído
            const hasAssignee = !!(ticketData.assigned_to || ticketData.assignee);
            console.log('✅ Tem técnico?', hasAssignee);
            
            if (hasAssignee) {
                // Testar API de mensagens
                const messagesResponse = await fetch(`/api/messages/list?ticket_id=${ticketId}`, {
                    headers: {
                        'Authorization': `Bearer ${validToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    console.log('✅ Chat access:', messagesData.chatAccess);
                    console.log('✅ Pode acessar?', messagesData.chatAccess.canAccess);
                    console.log('✅ Pode enviar?', messagesData.chatAccess.canSend);
                } else {
                    console.log('❌ Erro na API de mensagens:', messagesResponse.status);
                }
            }
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Testar tickets comuns
console.log('🔍 Testando tickets...');
testTicket('273982-568'); // O ticket da imagem
testTicket('13'); // Ticket que testamos antes

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Possíveis causas:');
console.log('   - Ticket ID incorreto');
console.log('   - Técnico não está sendo reconhecido');
console.log('   - API retornando dados diferentes');
console.log('   - Hook não está funcionando corretamente');
