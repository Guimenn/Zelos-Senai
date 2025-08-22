import fetch from 'node-fetch';

async function testSatisfactionData() {
    try {
        console.log('🧪 Testando dados de satisfação...');

        // 1. Fazer login como um agente
        const loginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'cj@gmail.com',
                password: 'Cj123456'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Falha no login');
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        console.log('✅ Login realizado com sucesso');

        // 2. Buscar estatísticas do agente
        const statsResponse = await fetch('http://localhost:3000/helpdesk/agents/my-statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!statsResponse.ok) {
            throw new Error('Falha ao buscar estatísticas');
        }

        const statsData = await statsResponse.json();
        console.log('📊 Dados de estatísticas:', JSON.stringify(statsData, null, 2));

        // 3. Verificar dados de satisfação
        console.log('\n🔍 Análise dos dados de satisfação:');
        console.log(`- Satisfação média: ${statsData.avgSatisfaction}/5`);
        console.log(`- Total de tickets atribuídos: ${statsData.totalAssignedTickets}`);
        console.log(`- Tickets resolvidos: ${statsData.resolvedTickets}`);
        console.log(`- Tempo total de resolução: ${statsData.totalResolutionTime} minutos`);

        // 4. Verificar se há tickets com avaliação
        const ticketsWithRating = await fetch('http://localhost:3000/helpdesk/agents/my-history?limit=50', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (ticketsWithRating.ok) {
            const ticketsData = await ticketsWithRating.json();
            const ticketsWithSatisfaction = ticketsData.tickets?.filter(t => t.satisfaction_rating !== null) || [];
            
            console.log(`\n📋 Tickets com avaliação de satisfação: ${ticketsWithSatisfaction.length}`);
            
            if (ticketsWithSatisfaction.length > 0) {
                console.log('📊 Detalhes dos tickets com avaliação:');
                ticketsWithSatisfaction.forEach(ticket => {
                    console.log(`- Ticket #${ticket.ticket_number}: ${ticket.satisfaction_rating}/5 (${ticket.status})`);
                });
            }
        }

        // 5. Verificar dados do admin também
        console.log('\n🔍 Testando dados do admin...');
        
        const adminLoginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@helpdesk.com',
                password: '123456'
            })
        });

        if (adminLoginResponse.ok) {
            const adminLoginData = await adminLoginResponse.json();
            const adminToken = adminLoginData.token;

            const adminStatsResponse = await fetch('http://localhost:3000/admin/status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (adminStatsResponse.ok) {
                const adminStatsData = await adminStatsResponse.json();
                console.log('📊 Dados de estatísticas do admin:', JSON.stringify(adminStatsData, null, 2));
                
                if (adminStatsData.tickets) {
                    console.log(`\n🔍 Satisfação média do sistema: ${adminStatsData.tickets.avg_satisfaction}/5`);
                }
            }
        }

        console.log('\n✅ Teste concluído!');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testSatisfactionData();
