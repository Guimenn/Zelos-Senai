// Script para testar o ticket específico da imagem
// Execute no console do navegador

console.log('🔧 Testando ticket específico TKT-273982-568...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar o ticket específico
async function testSpecificTicket() {
    console.log('🔍 Testando ticket TKT-273982-568...');
    
    try {
        // Primeiro, buscar todos os tickets para encontrar o correto
        const allTicketsResponse = await fetch('/helpdesk/tickets', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (allTicketsResponse.ok) {
            const allTickets = await allTicketsResponse.json();
            console.log('✅ Total de tickets:', allTickets.length);
            
            // Procurar pelo ticket específico
            const targetTicket = allTickets.find(t => 
                t.ticket_number === 'TKT-273982-568' || 
                t.ticket_number?.includes('273982-568') ||
                t.id.toString() === '273982-568'
            );
            
            if (targetTicket) {
                console.log('✅ Ticket encontrado:', targetTicket);
                console.log('📋 ID:', targetTicket.id);
                console.log('📋 Ticket Number:', targetTicket.ticket_number);
                console.log('👤 Técnico assigned_to:', targetTicket.assigned_to);
                console.log('👤 Técnico assignee:', targetTicket.assignee);
                console.log('📊 Status:', targetTicket.status);
                
                // Testar se o hook funcionaria
                const hasAssignee = !!(targetTicket.assigned_to || targetTicket.assignee);
                console.log('✅ Tem técnico?', hasAssignee);
                
                if (hasAssignee) {
                    console.log('🎉 Este ticket DEVERIA mostrar o botão de chat!');
                    
                    // Testar API de mensagens
                    const messagesResponse = await fetch(`/api/messages/list?ticket_id=${targetTicket.id}`, {
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
                } else {
                    console.log('❌ Este ticket NÃO deveria mostrar o botão de chat');
                }
            } else {
                console.log('❌ Ticket TKT-273982-568 não encontrado');
                console.log('📋 Procurando por tickets similares...');
                
                // Procurar por tickets com números similares
                const similarTickets = allTickets.filter(t => 
                    t.ticket_number?.includes('273982') ||
                    t.ticket_number?.includes('568') ||
                    t.id.toString().includes('273982') ||
                    t.id.toString().includes('568')
                );
                
                if (similarTickets.length > 0) {
                    console.log('📋 Tickets similares encontrados:');
                    similarTickets.forEach(t => {
                        console.log(`   - ID: ${t.id}, Number: ${t.ticket_number}, Status: ${t.status}, Técnico: ${t.assigned_to?.name || 'Nenhum'}`);
                    });
                } else {
                    console.log('📋 Nenhum ticket similar encontrado');
                    console.log('📋 Últimos 5 tickets:');
                    allTickets.slice(-5).forEach(t => {
                        console.log(`   - ID: ${t.id}, Number: ${t.ticket_number}, Status: ${t.status}, Técnico: ${t.assigned_to?.name || 'Nenhum'}`);
                    });
                }
            }
        } else {
            console.log('❌ Erro ao buscar tickets:', allTicketsResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testSpecificTicket();

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Se o ticket não for encontrado, pode ser:');
console.log('   - ID incorreto na imagem');
console.log('   - Ticket foi deletado');
console.log('   - Problema de permissão');
console.log('   - Ticket está em outra página');
