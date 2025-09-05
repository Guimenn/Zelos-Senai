// Script para criar um token de técnico do chamado
// Execute no console do navegador

console.log('🔧 Criando token de técnico do chamado...\n');

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

// Buscar dados do ticket para obter o ID do técnico
async function createTechnicianToken() {
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
            
            // Obter ID do técnico
            const technicianId = ticketData.assigned_to?.id;
            const technicianName = ticketData.assigned_to?.name;
            
            if (technicianId) {
                console.log(`\n👨‍💼 Técnico encontrado:`);
                console.log(`   ID: ${technicianId}`);
                console.log(`   Nome: ${technicianName}`);
                
                // Criar token para o técnico
                const technicianPayload = {
                    userId: technicianId,
                    role: 'Agent',
                    name: technicianName,
                    email: 'technician@test.com',
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
                };
                
                const technicianToken = createSimpleToken(technicianPayload);
                
                console.log(`\n🎫 Token do técnico criado:`);
                console.log(`   Token: ${technicianToken}`);
                console.log(`   Payload:`, technicianPayload);
                
                // Definir o token
                document.cookie = `auth_token=${technicianToken}; path=/; max-age=${24 * 60 * 60}`;
                console.log(`\n✅ Token do técnico definido!`);
                console.log(`💡 Agora você está logado como o técnico do chamado`);
                console.log(`🔍 Recarregue a página e verifique se o botão do chat mostra o nome do criador`);
                
            } else {
                console.log('❌ Não foi possível obter o ID do técnico');
                console.log('💡 Certifique-se de que o chamado tem um técnico atribuído');
            }
            
        } else {
            console.log('❌ Erro ao buscar ticket:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar
createTechnicianToken();

console.log('\n💡 Após executar este script:');
console.log('   1. Recarregue a página');
console.log('   2. Verifique se o botão do chat mostra o nome do criador');
console.log('   3. Execute o script debug-user-identification.js para ver os logs');
