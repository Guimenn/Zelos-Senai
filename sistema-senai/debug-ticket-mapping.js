// Script para debugar o mapeamento de tickets
// Execute no console do navegador

console.log('🔧 Debugando mapeamento de tickets...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar o mapeamento
async function testTicketMapping() {
    console.log('🔍 Testando mapeamento de tickets...');
    
    try {
        // Buscar todos os tickets
        const response = await fetch('/helpdesk/tickets', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const tickets = await response.json();
            console.log('✅ Tickets encontrados:', tickets.length);
            
            // Procurar pelo ticket específico
            const targetTicket = tickets.find(t => 
                t.ticket_number === 'TKT-273982-568' || 
                t.id.toString() === '273982-568' ||
                t.ticket_number?.includes('273982-568')
            );
            
            if (targetTicket) {
                console.log('✅ Ticket encontrado:', targetTicket);
                console.log('📋 ID:', targetTicket.id);
                console.log('📋 Ticket Number:', targetTicket.ticket_number);
                console.log('👤 Técnico:', targetTicket.assigned_to);
                console.log('📊 Status:', targetTicket.status);
                
                // Testar se o hook funcionaria
                const hasAssignee = !!(targetTicket.assigned_to);
                console.log('✅ Tem técnico?', hasAssignee);
                
                if (hasAssignee) {
                    console.log('🎉 Este ticket DEVERIA mostrar o botão de chat!');
                } else {
                    console.log('❌ Este ticket NÃO deveria mostrar o botão de chat');
                }
            } else {
                console.log('❌ Ticket TKT-273982-568 não encontrado');
                console.log('📋 Tickets disponíveis:');
                tickets.slice(0, 5).forEach(t => {
                    console.log(`   - ID: ${t.id}, Number: ${t.ticket_number}, Status: ${t.status}`);
                });
            }
        } else {
            console.log('❌ Erro ao buscar tickets:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testTicketMapping();

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Possíveis causas:');
console.log('   - Ticket não está sendo carregado corretamente');
console.log('   - Mapeamento de ID está incorreto');
console.log('   - Técnico não está sendo reconhecido');
console.log('   - Hook não está recebendo o ID correto');
