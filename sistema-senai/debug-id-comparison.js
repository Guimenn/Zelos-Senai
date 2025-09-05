// Script para debugar a comparação de IDs
// Digite no console

// 1. Verificar dados do token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
const userData = JSON.parse(atob(token.split('.')[1]));
console.log('👤 Usuário atual (Admin):', userData);

// 2. Buscar dados do ticket
fetch('/helpdesk/tickets/273982-568', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('🎫 Dados do ticket:', data);
    console.log('👤 Criador ID:', data.creator?.id, '(tipo:', typeof data.creator?.id, ')');
    console.log('👨‍💼 Técnico ID:', data.assigned_to?.id, '(tipo:', typeof data.assigned_to?.id, ')');
    console.log('👤 Admin ID:', userData.userId, '(tipo:', typeof userData.userId, ')');
    
    // 3. Verificar comparações
    console.log('\n🔍 Comparações:');
    console.log('Admin ID === Técnico ID:', userData.userId === data.assigned_to?.id);
    console.log('Admin ID === Criador ID:', userData.userId === data.creator?.id);
    
    // 4. Verificar se o admin é o criador do chamado
    const isAdminCreator = (data.creator?.id === userData.userId) || (data.created_by?.id === userData.userId);
    console.log('Admin é o criador?', isAdminCreator);
    
    // 5. Verificar se o admin é o técnico
    const isAdminTechnician = data.assigned_to?.id === userData.userId;
    console.log('Admin é o técnico?', isAdminTechnician);
    
    if (isAdminTechnician) {
        console.log('❌ PROBLEMA: Admin está sendo identificado como técnico!');
        console.log('💡 Isso significa que o ID do admin (1) é igual ao ID do técnico atribuído');
    } else if (isAdminCreator) {
        console.log('✅ Admin é o criador do chamado');
    } else {
        console.log('✅ Admin é um terceiro (não é nem criador nem técnico)');
    }
})
.catch(err => console.log('❌ Erro:', err));
