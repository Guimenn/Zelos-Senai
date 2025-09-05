// Script para debugar a comparação final de IDs
// Digite no console

console.log('🔧 Debugando comparação final de IDs...');

// Buscar dados do ticket
fetch('/helpdesk/tickets/273982-568', {
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc',
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('🎫 Dados do ticket:', data);
    console.log('👨‍💼 Técnico ID:', data.assigned_to?.id);
    console.log('👨‍💼 Técnico Nome:', data.assigned_to?.name);
    console.log('👤 Criador ID:', data.creator?.id);
    console.log('👤 Criador Nome:', data.creator?.name);
    
    // Simular dados do usuário atual (Gabriel Palmieri)
    const currentUserId = 7; // Como mostrado nos logs
    const currentUserRole = 'Agent';
    
    console.log('\n🔍 Comparações:');
    console.log('Current User ID:', currentUserId);
    console.log('Current User Role:', currentUserRole);
    console.log('Técnico ID:', data.assigned_to?.id);
    console.log('Criador ID:', data.creator?.id);
    
    // Verificar se é técnico
    const isCurrentUserTechnician = currentUserRole === 'Agent' && data.assigned_to?.id === currentUserId;
    console.log('É técnico?', isCurrentUserTechnician);
    console.log('Comparação:', currentUserRole === 'Agent', '&&', data.assigned_to?.id === currentUserId);
    
    // Verificar se é criador
    const isCurrentUserCreator = (currentUserRole === 'Client' || currentUserRole === 'Profissional') && 
                                 (data.creator?.id === currentUserId || data.created_by?.id === currentUserId);
    console.log('É criador?', isCurrentUserCreator);
    
    if (isCurrentUserTechnician) {
        console.log('✅ TÉCNICO → deve mostrar CRIADOR:', data.creator?.name || data.created_by?.name);
    } else if (isCurrentUserCreator) {
        console.log('✅ CRIADOR → deve mostrar TÉCNICO:', data.assigned_to?.name);
    } else {
        console.log('✅ ADMIN/OUTRO → deve mostrar TÉCNICO:', data.assigned_to?.name);
    }
})
.catch(err => console.log('❌ Erro:', err));
