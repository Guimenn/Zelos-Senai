// Script para testar a correção dos nomes no botão do chat
// Execute no console do navegador

console.log('🔧 Testando correção dos nomes no botão do chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar a lógica dos nomes
async function testChatButtonNames() {
    console.log('🔍 Testando lógica dos nomes no botão do chat...');
    
    try {
        // Buscar dados do ticket
        const ticketResponse = await fetch('/helpdesk/tickets/273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('✅ Dados do ticket:', ticketData);
            
            // Simular diferentes cenários de usuário
            const scenarios = [
                {
                    name: 'Usuário atual é o técnico',
                    currentUserId: ticketData.assigned_to?.id,
                    expectedName: ticketData.creator?.name || ticketData.created_by?.name || 'Cliente',
                    expectedIcon: 'FaUser'
                },
                {
                    name: 'Usuário atual é o criador',
                    currentUserId: ticketData.creator?.id || ticketData.created_by?.id,
                    expectedName: ticketData.assigned_to?.name,
                    expectedIcon: 'FaUserTie'
                },
                {
                    name: 'Usuário atual é admin (outro)',
                    currentUserId: 999, // ID que não é nem técnico nem criador
                    expectedName: ticketData.assigned_to?.name,
                    expectedIcon: 'FaUserTie'
                }
            ];
            
            console.log('\n📋 Testando cenários:');
            scenarios.forEach((scenario, index) => {
                console.log(`\n${index + 1}. ${scenario.name}:`);
                console.log(`   Usuário atual ID: ${scenario.currentUserId}`);
                console.log(`   Nome esperado: ${scenario.expectedName}`);
                console.log(`   Ícone esperado: ${scenario.expectedIcon}`);
                
                // Simular a lógica do componente
                const isCurrentUserTechnician = ticketData.assigned_to?.id === scenario.currentUserId;
                const isCurrentUserCreator = (ticketData.creator?.id === scenario.currentUserId) || (ticketData.created_by?.id === scenario.currentUserId);
                
                let displayName = '';
                let displayIcon = 'FaUserTie';
                
                if (isCurrentUserTechnician) {
                    displayName = ticketData.creator?.name || ticketData.created_by?.name || 'Cliente';
                    displayIcon = 'FaUser';
                } else if (isCurrentUserCreator) {
                    displayName = ticketData.assigned_to?.name;
                    displayIcon = 'FaUserTie';
                } else {
                    displayName = ticketData.assigned_to?.name;
                    displayIcon = 'FaUserTie';
                }
                
                console.log(`   ✅ Nome calculado: ${displayName}`);
                console.log(`   ✅ Ícone calculado: ${displayIcon}`);
                console.log(`   ${displayName === scenario.expectedName ? '✅' : '❌'} Nome correto: ${displayName === scenario.expectedName}`);
                console.log(`   ${displayIcon === scenario.expectedIcon ? '✅' : '❌'} Ícone correto: ${displayIcon === scenario.expectedIcon}`);
            });
            
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testChatButtonNames();

console.log('\n💡 Verifique os logs acima para confirmar se a lógica está correta');
console.log('🔍 A lógica deve funcionar assim:');
console.log('   - Se você é o técnico: mostra nome do criador (ícone FaUser)');
console.log('   - Se você é o criador: mostra nome do técnico (ícone FaUserTie)');
console.log('   - Se você é admin/outro: mostra nome do técnico (ícone FaUserTie)');
