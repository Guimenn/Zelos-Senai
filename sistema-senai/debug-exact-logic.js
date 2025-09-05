// Script para debugar a lógica exata
// Digite no console

console.log('🔧 Debugando lógica exata...');

// Simular exatamente os dados que estão nos logs
const user = {
    id: 7,
    userId: undefined,
    role: undefined,
    userRole: 'Agent',
    name: 'Gabriel Palmieri'
};

const ticketData = {
    assigned_to: {
        id: 7, // Assumindo que é 7 baseado nos logs
        name: 'Gabriel Palmieri'
    },
    creator: {
        id: 1,
        name: 'Administrador'
    }
};

// Aplicar a lógica exata do componente
const currentUserId = user?.id || user?.userId;
const currentUserRole = user?.role || user?.userRole;

console.log('👤 Dados do usuário:', user);
console.log('🎫 Dados do ticket:', ticketData);
console.log('🔍 Current User ID:', currentUserId);
console.log('🔍 Current User Role:', currentUserRole);

// Verificar se é técnico (lógica exata do componente)
const isCurrentUserTechnician = currentUserRole === 'Agent' && ticketData.assigned_to.id == currentUserId;
console.log('🔍 É técnico?', isCurrentUserTechnician);
console.log('🔍 Comparação role:', currentUserRole === 'Agent');
console.log('🔍 Comparação ID:', ticketData.assigned_to.id == currentUserId);
console.log('🔍 Comparação ID (===):', ticketData.assigned_to.id === currentUserId);

// Verificar se é criador
const isCurrentUserCreator = (currentUserRole === 'Client' || currentUserRole === 'Profissional') && 
                             (ticketData.creator?.id == currentUserId || ticketData.created_by?.id == currentUserId);
console.log('🔍 É criador?', isCurrentUserCreator);

// Determinar o que mostrar
let displayName = '';
if (isCurrentUserTechnician) {
    displayName = ticketData.creator?.name || ticketData.created_by?.name || 'Cliente';
    console.log('✅ TÉCNICO → mostra CRIADOR:', displayName);
} else if (isCurrentUserCreator) {
    displayName = ticketData.assigned_to?.name;
    console.log('✅ CRIADOR → mostra TÉCNICO:', displayName);
} else {
    displayName = ticketData.assigned_to?.name;
    console.log('✅ ADMIN/OUTRO → mostra TÉCNICO:', displayName);
}

console.log('🎯 Resultado final:', displayName);

// Verificar se o problema está no ID do técnico
console.log('\n🔍 Verificando ID do técnico no ticket real...');
fetch('/helpdesk/tickets/273982-568', {
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc',
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('🎫 Dados reais do ticket:', data);
    console.log('👨‍💼 Técnico ID real:', data.assigned_to?.id);
    console.log('👨‍💼 Técnico Nome real:', data.assigned_to?.name);
    console.log('👤 Criador ID real:', data.creator?.id);
    console.log('👤 Criador Nome real:', data.creator?.name);
    
    // Verificar se o ID do técnico é realmente 7
    if (data.assigned_to?.id === 7) {
        console.log('✅ ID do técnico é 7 - correto!');
    } else {
        console.log('❌ ID do técnico NÃO é 7 - é:', data.assigned_to?.id);
    }
})
.catch(err => console.log('❌ Erro:', err));
