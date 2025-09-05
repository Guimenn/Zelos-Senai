// Script para criar token de técnico real
// Digite no console

// 1. Buscar técnicos disponíveis
fetch('/helpdesk/agents', {
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc',
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(agents => {
    console.log('👨‍💼 Técnicos disponíveis:', agents);
    
    if (agents && agents.length > 0) {
        const technician = agents[0]; // Pegar o primeiro técnico
        console.log('👨‍💼 Técnico selecionado:', technician);
        
        // Criar token para o técnico
        const technicianPayload = {
            userId: technician.id,
            role: 'Agent',
            name: technician.name,
            email: technician.email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        
        // Criar token JWT simples
        const header = btoa(JSON.stringify({alg: "HS256", typ: "JWT"}));
        const payload = btoa(JSON.stringify(technicianPayload));
        const signature = btoa('test-signature');
        const technicianToken = `${header}.${payload}.${signature}`;
        
        console.log('🎫 Token do técnico criado:', technicianToken);
        console.log('📋 Payload:', technicianPayload);
        
        // Definir o token
        document.cookie = `auth_token=${technicianToken}; path=/; max-age=86400`;
        console.log('✅ Token do técnico definido!');
        console.log('💡 Recarregue a página e verifique se o botão mostra o nome do CRIADOR');
        
    } else {
        console.log('❌ Nenhum técnico encontrado');
    }
})
.catch(err => {
    console.log('❌ Erro ao buscar técnicos:', err);
    console.log('💡 Tentando buscar via API de usuários...');
    
    // Tentar buscar via API de usuários
    fetch('/helpdesk/users', {
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc',
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(users => {
        console.log('👥 Usuários disponíveis:', users);
        
        // Procurar por usuários com role Agent
        const technicians = users.filter(user => user.role === 'Agent');
        console.log('👨‍💼 Técnicos encontrados:', technicians);
        
        if (technicians.length > 0) {
            const technician = technicians[0];
            console.log('👨‍💼 Técnico selecionado:', technician);
            
            // Criar token para o técnico
            const technicianPayload = {
                userId: technician.id,
                role: 'Agent',
                name: technician.name,
                email: technician.email,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            };
            
            // Criar token JWT simples
            const header = btoa(JSON.stringify({alg: "HS256", typ: "JWT"}));
            const payload = btoa(JSON.stringify(technicianPayload));
            const signature = btoa('test-signature');
            const technicianToken = `${header}.${payload}.${signature}`;
            
            console.log('🎫 Token do técnico criado:', technicianToken);
            console.log('📋 Payload:', technicianPayload);
            
            // Definir o token
            document.cookie = `auth_token=${technicianToken}; path=/; max-age=86400`;
            console.log('✅ Token do técnico definido!');
            console.log('💡 Recarregue a página e verifique se o botão mostra o nome do CRIADOR');
        }
    })
    .catch(err2 => console.log('❌ Erro ao buscar usuários:', err2));
});
