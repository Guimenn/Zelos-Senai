// Script para testar com tokens reais
// Execute no console do navegador

console.log('🔧 Testando com tokens reais...\n');

// Função para criar um token JWT simples
function createSimpleToken(payload) {
    const header = {
        "alg": "HS256",
        "typ": "JWT"
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Assinatura simples (não é segura, apenas para teste)
    const signature = btoa('test-signature');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Função para testar com diferentes tokens
async function testRealTokens() {
    try {
        // Token admin para buscar dados
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
        
        console.log('🔍 Buscando dados do ticket...');
        const response = await fetch('/helpdesk/tickets/273982-568', {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const ticketData = await response.json();
            console.log('✅ Dados do ticket:', ticketData);
            
            // Obter IDs
            const creatorId = ticketData.creator?.id || ticketData.created_by?.id;
            const technicianId = ticketData.assigned_to?.id;
            const creatorName = ticketData.creator?.name || ticketData.created_by?.name;
            const technicianName = ticketData.assigned_to?.name;
            
            console.log(`\n👤 Criador: ID ${creatorId}, Nome: ${creatorName}`);
            console.log(`👨‍💼 Técnico: ID ${technicianId}, Nome: ${technicianName}`);
            
            if (creatorId && technicianId) {
                // Testar com token de criador
                console.log('\n🎫 Testando com token de CRIADOR:');
                const creatorPayload = {
                    userId: creatorId,
                    role: 'Client',
                    name: creatorName,
                    email: 'creator@test.com',
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
                };
                
                const creatorToken = createSimpleToken(creatorPayload);
                document.cookie = `auth_token=${creatorToken}; path=/; max-age=${24 * 60 * 60}`;
                
                console.log('   ✅ Token de criador definido');
                console.log('   💡 Recarregue a página e verifique se o botão mostra o nome do TÉCNICO');
                console.log('   🔍 Execute debug-user-identification.js para ver os logs');
                
                // Aguardar um pouco e testar com token de técnico
                setTimeout(() => {
                    console.log('\n🎫 Testando com token de TÉCNICO:');
                    const technicianPayload = {
                        userId: technicianId,
                        role: 'Agent',
                        name: technicianName,
                        email: 'technician@test.com',
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
                    };
                    
                    const technicianToken = createSimpleToken(technicianPayload);
                    document.cookie = `auth_token=${technicianToken}; path=/; max-age=${24 * 60 * 60}`;
                    
                    console.log('   ✅ Token de técnico definido');
                    console.log('   💡 Recarregue a página e verifique se o botão mostra o nome do CRIADOR');
                    console.log('   🔍 Execute debug-user-identification.js para ver os logs');
                    
                    // Restaurar token de admin
                    setTimeout(() => {
                        console.log('\n🎫 Restaurando token de ADMIN:');
                        document.cookie = `auth_token=${adminToken}; path=/; max-age=${24 * 60 * 60}`;
                        console.log('   ✅ Token de admin restaurado');
                        console.log('   💡 Recarregue a página e verifique se o botão mostra o nome do TÉCNICO');
                    }, 2000);
                }, 2000);
                
            } else {
                console.log('❌ Não foi possível obter IDs do criador ou técnico');
            }
            
        } else {
            console.log('❌ Erro ao buscar ticket:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testRealTokens();

console.log('\n💡 Este script vai testar automaticamente:');
console.log('   1. Token de criador (deve mostrar nome do técnico)');
console.log('   2. Token de técnico (deve mostrar nome do criador)');
console.log('   3. Token de admin (deve mostrar nome do técnico)');
console.log('   🔍 Execute debug-user-identification.js após cada mudança para ver os logs');
