// Script para debugar a identificação do usuário
// Execute no console do navegador

console.log('🔧 Debugando identificação do usuário...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para debugar a identificação
async function debugUserIdentification() {
    console.log('🔍 Debugando identificação do usuário...');
    
    try {
        // 1. Verificar dados do token
        console.log('\n1️⃣ Dados do token:');
        const tokenData = JSON.parse(atob(validToken.split('.')[1]));
        console.log('   User ID:', tokenData.userId);
        console.log('   Role:', tokenData.role);
        console.log('   Name:', tokenData.name);
        console.log('   Email:', tokenData.email);
        
        // 2. Buscar dados do ticket
        console.log('\n2️⃣ Dados do ticket:');
        const ticketResponse = await fetch('/helpdesk/tickets/273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('   Ticket ID:', ticketData.id);
            console.log('   Creator ID:', ticketData.creator?.id);
            console.log('   Created By ID:', ticketData.created_by?.id);
            console.log('   Assigned To ID:', ticketData.assigned_to?.id);
            console.log('   Creator Name:', ticketData.creator?.name);
            console.log('   Created By Name:', ticketData.created_by?.name);
            console.log('   Assigned To Name:', ticketData.assigned_to?.name);
            
            // 3. Verificar comparações
            console.log('\n3️⃣ Comparações:');
            const currentUserId = tokenData.userId;
            const isCurrentUserTechnician = ticketData.assigned_to?.id === currentUserId;
            const isCurrentUserCreator = (ticketData.creator?.id === currentUserId) || (ticketData.created_by?.id === currentUserId);
            
            console.log('   Current User ID:', currentUserId);
            console.log('   Is Current User Technician:', isCurrentUserTechnician);
            console.log('   Is Current User Creator:', isCurrentUserCreator);
            console.log('   Technician ID:', ticketData.assigned_to?.id);
            console.log('   Creator ID:', ticketData.creator?.id);
            console.log('   Created By ID:', ticketData.created_by?.id);
            
            // 4. Simular lógica do componente
            console.log('\n4️⃣ Lógica do componente:');
            let displayName = '';
            let displayIcon = 'FaUserTie';
            
            if (isCurrentUserTechnician) {
                displayName = ticketData.creator?.name || ticketData.created_by?.name || 'Cliente';
                displayIcon = 'FaUser';
                console.log('   ✅ Usuário é TÉCNICO - mostrando nome do CRIADOR');
            } else if (isCurrentUserCreator) {
                displayName = ticketData.assigned_to?.name;
                displayIcon = 'FaUserTie';
                console.log('   ✅ Usuário é CRIADOR - mostrando nome do TÉCNICO');
            } else {
                displayName = ticketData.assigned_to?.name;
                displayIcon = 'FaUserTie';
                console.log('   ✅ Usuário é ADMIN/OUTRO - mostrando nome do TÉCNICO');
            }
            
            console.log('   Nome a ser exibido:', displayName);
            console.log('   Ícone a ser exibido:', displayIcon);
            
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar debug
debugUserIdentification();

console.log('\n💡 Verifique os logs acima para identificar o problema');
console.log('🔍 Possíveis causas:');
console.log('   - IDs não estão sendo comparados corretamente');
console.log('   - Dados do ticket estão incorretos');
console.log('   - Lógica de identificação está falhando');
console.log('   - Hook useRequireAuth não está retornando o ID correto');
