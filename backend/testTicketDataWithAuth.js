import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Função para fazer login e obter token
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar dados com autenticação
async function testTicketDataWithAuth() {
  try {
    console.log('🔍 Testando dados dos tickets com autenticação...\n');

    // Primeiro, vamos tentar fazer login com diferentes tipos de usuário
    const testUsers = [
      { email: 'admin@senai.com', password: 'admin123', role: 'Admin' },
      { email: 'cliente@senai.com', password: 'cliente123', role: 'Cliente' },
      { email: 'agente@senai.com', password: 'agente123', role: 'Agente' }
    ];

    let token = null;
    let userRole = null;

    for (const user of testUsers) {
      console.log(`🔐 Tentando login como ${user.role}...`);
      token = await login(user.email, user.password);
      if (token) {
        userRole = user.role;
        console.log(`✅ Login bem-sucedido como ${user.role}`);
        break;
      }
    }

    if (!token) {
      console.log('❌ Não foi possível fazer login com nenhum usuário de teste');
      console.log('💡 Verifique se os usuários de teste existem no banco de dados');
      return;
    }

    // Configurar axios com o token
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Teste 1: Buscar todos os tickets (apenas admin)
    if (userRole === 'Admin') {
      console.log('\n📋 Teste 1: Buscando todos os tickets (Admin)...');
      try {
        const allTicketsResponse = await authAxios.get('/helpdesk/tickets');
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
      } catch (error) {
        console.log('❌ Erro ao buscar todos os tickets:', error.response?.status || error.message);
      }
    }

    // Teste 2: Buscar tickets do cliente
    if (userRole === 'Cliente') {
      console.log('\n📋 Teste 2: Buscando tickets do cliente...');
      try {
        const clientTicketsResponse = await authAxios.get('/helpdesk/client/my-tickets');
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
    }

    // Teste 3: Buscar tickets do agente
    if (userRole === 'Agente') {
      console.log('\n📋 Teste 3: Buscando tickets do agente...');
      try {
        const agentTicketsResponse = await authAxios.get('/helpdesk/agent/my-assigned-tickets');
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

testTicketDataWithAuth();
