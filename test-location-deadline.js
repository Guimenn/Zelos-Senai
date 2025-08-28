const fetch = require('node-fetch');

async function testTicketData() {
  try {
    // Simular um token de autenticação (você precisará de um token válido)
    const token = 'SEU_TOKEN_AQUI'; // Substitua por um token válido
    
    console.log('🔍 Testando dados dos tickets...');
    
    // Testar a rota principal de tickets
    const ticketsResponse = await fetch('http://localhost:3001/helpdesk/tickets?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (ticketsResponse.ok) {
      const ticketsData = await ticketsResponse.json();
      console.log('✅ Dados dos tickets retornados:');
      
      if (ticketsData.tickets && ticketsData.tickets.length > 0) {
        const sampleTicket = ticketsData.tickets[0];
        console.log('📋 Ticket de exemplo:');
        console.log('  - ID:', sampleTicket.id);
        console.log('  - Título:', sampleTicket.title);
        console.log('  - Localização:', sampleTicket.location);
        console.log('  - Prazo (due_date):', sampleTicket.due_date);
        console.log('  - Cliente department:', sampleTicket.client?.department);
        console.log('  - Cliente address:', sampleTicket.client?.address);
        console.log('  - User address:', sampleTicket.client?.user?.address);
      }
    } else {
      console.log('❌ Erro ao buscar tickets:', ticketsResponse.status);
    }
    
    // Testar a rota de tickets do cliente
    const clientTicketsResponse = await fetch('http://localhost:3001/helpdesk/client/my-tickets?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (clientTicketsResponse.ok) {
      const clientTicketsData = await clientTicketsResponse.json();
      console.log('\n✅ Dados dos tickets do cliente retornados:');
      
      if (clientTicketsData.tickets && clientTicketsData.tickets.length > 0) {
        const sampleClientTicket = clientTicketsData.tickets[0];
        console.log('📋 Ticket do cliente de exemplo:');
        console.log('  - ID:', sampleClientTicket.id);
        console.log('  - Título:', sampleClientTicket.title);
        console.log('  - Localização:', sampleClientTicket.location);
        console.log('  - Prazo (due_date):', sampleClientTicket.due_date);
        console.log('  - Cliente department:', sampleClientTicket.client?.department);
        console.log('  - Cliente address:', sampleClientTicket.client?.address);
        console.log('  - User address:', sampleClientTicket.client?.user?.address);
      }
    } else {
      console.log('❌ Erro ao buscar tickets do cliente:', clientTicketsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testTicketData();
