// Script para testar o chat no frontend
// Execute no console do navegador

console.log('🔧 Testando chat no frontend...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

// Testar API de tickets
async function testTicketAPI() {
    try {
        console.log('🔍 Testando API de tickets...');
        
        const response = await fetch('/helpdesk/tickets/13', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API de tickets funcionando!');
            console.log('📋 Ticket:', data.title, 'Status:', data.status);
            console.log('👤 Técnico:', data.assigned_to?.name || 'Nenhum');
            return true;
        } else {
            const error = await response.text();
            console.log('❌ Erro na API de tickets:', response.status, error);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

// Testar API de mensagens
async function testMessagesAPI() {
    try {
        console.log('🔍 Testando API de mensagens...');
        
        const response = await fetch('/api/messages/list?ticket_id=13', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API de mensagens funcionando!');
            console.log('📋 Mensagens encontradas:', data.messages?.length || 0);
            return true;
        } else {
            const error = await response.text();
            console.log('❌ Erro na API de mensagens:', response.status, error);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

// Executar testes
async function runTests() {
    const ticketOk = await testTicketAPI();
    const messagesOk = await testMessagesAPI();
    
    if (ticketOk && messagesOk) {
        console.log('\n✅ Todas as APIs estão funcionando!');
        console.log('🎉 O chat deve funcionar agora');
        console.log('💡 Recarregue a página e teste o chat');
    } else {
        console.log('\n❌ Algumas APIs não estão funcionando');
    }
}

runTests();
