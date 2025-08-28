import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testTicketData() {
  try {
    console.log('🔍 Testando dados dos tickets...\n');

    // Teste 1: Buscar todos os tickets
    console.log('📋 Teste 1: Buscando todos os tickets...');
    const allTicketsResponse = await axios.get(`${BASE_URL}/helpdesk/tickets`);
    const allTickets = allTicketsResponse.data.tickets || allTicketsResponse.data;
    
    if (allTickets && allTickets.length > 0) {
      const sampleTicket = allTickets[0];
      console.log('✅ Ticket encontrado:');
      console.log(`   ID: ${sampleTicket.id}`);
      console.log(`   Título: ${sampleTicket.title}`);
      console.log(`   Location: ${sampleTicket.location || 'NULL'}`);
      console.log(`   Due Date: ${sampleTicket.due_date || 'NULL'}`);
      console.log(`   Client Department: ${sampleTicket.client?.department || 'NULL'}`);
      console.log(`   Client Address: ${sampleTicket.client?.address || 'NULL'}`);
      console.log(`   User Address: ${sampleTicket.client?.user?.address || 'NULL'}`);
      console.log(`   User Department: ${sampleTicket.client?.user?.department || 'NULL'}`);
    } else {
      console.log('❌ Nenhum ticket encontrado');
    }

    // Teste 2: Buscar tickets do cliente (se houver um cliente logado)
    console.log('\n📋 Teste 2: Buscando tickets do cliente...');
    try {
      const clientTicketsResponse = await axios.get(`${BASE_URL}/helpdesk/client/my-tickets`);
      const clientTickets = clientTicketsResponse.data.tickets || clientTicketsResponse.data;
      
      if (clientTickets && clientTickets.length > 0) {
        const sampleClientTicket = clientTickets[0];
        console.log('✅ Ticket do cliente encontrado:');
        console.log(`   ID: ${sampleClientTicket.id}`);
        console.log(`   Título: ${sampleClientTicket.title}`);
        console.log(`   Location: ${sampleClientTicket.location || 'NULL'}`);
        console.log(`   Due Date: ${sampleClientTicket.due_date || 'NULL'}`);
        console.log(`   Client Department: ${sampleClientTicket.client?.department || 'NULL'}`);
        console.log(`   Client Address: ${sampleClientTicket.client?.address || 'NULL'}`);
        console.log(`   User Address: ${sampleClientTicket.client?.user?.address || 'NULL'}`);
        console.log(`   User Department: ${sampleClientTicket.client?.user?.department || 'NULL'}`);
      } else {
        console.log('❌ Nenhum ticket do cliente encontrado');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar tickets do cliente:', error.response?.status || error.message);
    }

    // Teste 3: Buscar tickets do agente (se houver um agente logado)
    console.log('\n📋 Teste 3: Buscando tickets do agente...');
    try {
      const agentTicketsResponse = await axios.get(`${BASE_URL}/helpdesk/agent/my-assigned-tickets`);
      const agentTickets = agentTicketsResponse.data.tickets || agentTicketsResponse.data;
      
      if (agentTickets && agentTickets.length > 0) {
        const sampleAgentTicket = agentTickets[0];
        console.log('✅ Ticket do agente encontrado:');
        console.log(`   ID: ${sampleAgentTicket.id}`);
        console.log(`   Título: ${sampleAgentTicket.title}`);
        console.log(`   Location: ${sampleAgentTicket.location || 'NULL'}`);
        console.log(`   Due Date: ${sampleAgentTicket.due_date || 'NULL'}`);
        console.log(`   Client Department: ${sampleAgentTicket.client?.department || 'NULL'}`);
        console.log(`   Client Address: ${sampleAgentTicket.client?.address || 'NULL'}`);
        console.log(`   User Address: ${sampleAgentTicket.client?.user?.address || 'NULL'}`);
        console.log(`   User Department: ${sampleAgentTicket.client?.user?.department || 'NULL'}`);
      } else {
        console.log('❌ Nenhum ticket do agente encontrado');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar tickets do agente:', error.response?.status || error.message);
    }

    console.log('\n🎯 Análise dos dados:');
    console.log('- Se todos os campos estão NULL, o problema está no backend');
    console.log('- Se alguns campos têm dados, o problema está no frontend');
    console.log('- Verifique se o servidor está rodando em http://localhost:3001');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando: npm start');
  }
}

testTicketData();
