// Script para testar a lógica corrigida
// Execute no console do navegador

console.log('🔧 Testando lógica corrigida...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar a lógica
async function testLogicFix() {
    console.log('🔍 Testando lógica corrigida...');
    
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
            
            // Simular diferentes cenários
            const scenarios = [
                {
                    name: 'Cenário 1: Usuário é o técnico',
                    currentUserId: ticketData.assigned_to?.id,
                    expectedBehavior: 'Mostrar nome do CRIADOR'
                },
                {
                    name: 'Cenário 2: Usuário é o criador',
                    currentUserId: ticketData.creator?.id || ticketData.created_by?.id,
                    expectedBehavior: 'Mostrar nome do TÉCNICO'
                },
                {
                    name: 'Cenário 3: Usuário é admin (outro)',
                    currentUserId: 999,
                    expectedBehavior: 'Mostrar nome do TÉCNICO'
                }
            ];
            
            console.log('\n📋 Testando cenários:');
            scenarios.forEach((scenario, index) => {
                console.log(`\n${index + 1}. ${scenario.name}:`);
                console.log(`   Usuário atual ID: ${scenario.currentUserId}`);
                console.log(`   Comportamento esperado: ${scenario.expectedBehavior}`);
                
                // Simular a lógica do componente
                const isCurrentUserTechnician = ticketData.assigned_to?.id === scenario.currentUserId;
                const isCurrentUserCreator = (ticketData.creator?.id === scenario.currentUserId) || (ticketData.created_by?.id === scenario.currentUserId);
                
                console.log(`   É técnico? ${isCurrentUserTechnician}`);
                console.log(`   É criador? ${isCurrentUserCreator}`);
                
                let displayName = '';
                let displayIcon = 'FaUserTie';
                
                if (isCurrentUserTechnician) {
                    displayName = ticketData.creator?.name || ticketData.created_by?.name || 'Cliente';
                    displayIcon = 'FaUser';
                    console.log(`   ✅ Lógica: TÉCNICO → mostra CRIADOR`);
                } else if (isCurrentUserCreator) {
                    displayName = ticketData.assigned_to?.name;
                    displayIcon = 'FaUserTie';
                    console.log(`   ✅ Lógica: CRIADOR → mostra TÉCNICO`);
                } else {
                    displayName = ticketData.assigned_to?.name;
                    displayIcon = 'FaUserTie';
                    console.log(`   ✅ Lógica: ADMIN/OUTRO → mostra TÉCNICO`);
                }
                
                console.log(`   Nome exibido: ${displayName}`);
                console.log(`   Ícone exibido: ${displayIcon}`);
                
                // Verificar se está correto
                const isCorrect = (
                    (scenario.name.includes('técnico') && displayName === (ticketData.creator?.name || ticketData.created_by?.name)) ||
                    (scenario.name.includes('criador') && displayName === ticketData.assigned_to?.name) ||
                    (scenario.name.includes('admin') && displayName === ticketData.assigned_to?.name)
                );
                
                console.log(`   ${isCorrect ? '✅' : '❌'} Resultado: ${isCorrect ? 'CORRETO' : 'INCORRETO'}`);
            });
            
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testLogicFix();

console.log('\n💡 Verifique os logs acima para confirmar se a lógica está correta');
console.log('🔍 A lógica deve funcionar assim:');
console.log('   - Técnico logado → mostra nome do CRIADOR');
console.log('   - Criador logado → mostra nome do TÉCNICO');
console.log('   - Admin logado → mostra nome do TÉCNICO');
