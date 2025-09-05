// Script para testar a correção com roles
// Digite no console

// 1. Verificar dados do token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
const userData = JSON.parse(atob(token.split('.')[1]));
console.log('👤 Usuário atual:', userData);

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
    
    // 3. Simular a nova lógica
    const currentUserId = userData.userId;
    const currentUserRole = userData.role;
    
    console.log('\n🔍 Nova lógica:');
    console.log('Current User ID:', currentUserId);
    console.log('Current User Role:', currentUserRole);
    
    // Verificar se é técnico (deve ser Agent E ter ID correto)
    const isTechnician = currentUserRole === 'Agent' && data.assigned_to?.id === currentUserId;
    console.log('É técnico?', isTechnician);
    
    // Verificar se é criador (deve ser Client/Profissional E ter ID correto)
    const isCreator = (currentUserRole === 'Client' || currentUserRole === 'Profissional') && 
                     (data.creator?.id === currentUserId || data.created_by?.id === currentUserId);
    console.log('É criador?', isCreator);
    
    // Determinar o que mostrar
    let displayName = '';
    if (isTechnician) {
        displayName = data.creator?.name || data.created_by?.name || 'Cliente';
        console.log('✅ TÉCNICO → mostra CRIADOR:', displayName);
    } else if (isCreator) {
        displayName = data.assigned_to?.name;
        console.log('✅ CRIADOR → mostra TÉCNICO:', displayName);
    } else {
        displayName = data.assigned_to?.name;
        console.log('✅ ADMIN/OUTRO → mostra TÉCNICO:', displayName);
    }
    
    console.log('\n🎯 Resultado final:');
    console.log('Nome a ser exibido:', displayName);
})
.catch(err => console.log('❌ Erro:', err));
