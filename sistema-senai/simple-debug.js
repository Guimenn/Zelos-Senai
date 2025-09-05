// Script simples para debug - digite no console
console.log('🔧 Debug simples...');

// Token válido
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${token}; path=/; max-age=${24 * 60 * 60}`;

// Buscar dados do ticket
fetch('/helpdesk/tickets/273982-568', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('✅ Dados do ticket:', data);
    console.log('👤 Criador ID:', data.creator?.id || data.created_by?.id);
    console.log('👨‍💼 Técnico ID:', data.assigned_to?.id);
    console.log('👤 Criador Nome:', data.creator?.name || data.created_by?.name);
    console.log('👨‍💼 Técnico Nome:', data.assigned_to?.name);
    
    // Verificar usuário atual
    const userData = JSON.parse(atob(token.split('.')[1]));
    console.log('👤 Usuário atual ID:', userData.userId);
    
    // Verificar comparações
    const currentUserId = userData.userId;
    const isTechnician = data.assigned_to?.id === currentUserId;
    const isCreator = (data.creator?.id === currentUserId) || (data.created_by?.id === currentUserId);
    
    console.log('🔍 É técnico?', isTechnician);
    console.log('🔍 É criador?', isCreator);
    
    if (isTechnician) {
        console.log('✅ Deveria mostrar nome do CRIADOR:', data.creator?.name || data.created_by?.name);
    } else if (isCreator) {
        console.log('✅ Deveria mostrar nome do TÉCNICO:', data.assigned_to?.name);
    } else {
        console.log('✅ Deveria mostrar nome do TÉCNICO:', data.assigned_to?.name);
    }
})
.catch(err => console.log('❌ Erro:', err));
