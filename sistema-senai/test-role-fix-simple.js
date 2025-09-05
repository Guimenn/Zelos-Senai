// Script simples para testar a correção do role
// Digite no console

console.log('🔧 Testando correção do role...');

// Simular dados do usuário como mostrado nos logs
const user = {
    id: undefined,
    userId: undefined, // Pode estar aqui
    role: undefined,
    userRole: 'Agent', // Este está correto
    name: 'Gabriel Palmieri'
};

// Simular dados do ticket
const ticketData = {
    assigned_to: {
        id: 2, // ID do Gabriel Palmieri
        name: 'Gabriel Palmieri'
    },
    creator: {
        id: 1,
        name: 'Administrador'
    }
};

// Aplicar a nova lógica
const currentUserId = user?.id || user?.userId;
const currentUserRole = user?.role || user?.userRole;

console.log('👤 Dados do usuário:', user);
console.log('🎫 Dados do ticket:', ticketData);
console.log('🔍 Current User ID:', currentUserId);
console.log('🔍 Current User Role:', currentUserRole);

// Verificar se é técnico
const isCurrentUserTechnician = currentUserRole === 'Agent' && ticketData.assigned_to.id === currentUserId;
console.log('🔍 É técnico?', isCurrentUserTechnician);

// Verificar se é criador
const isCurrentUserCreator = (currentUserRole === 'Client' || currentUserRole === 'Profissional') && 
                             (ticketData.creator?.id === currentUserId || ticketData.created_by?.id === currentUserId);
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
