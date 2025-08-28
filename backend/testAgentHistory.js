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

// Função para testar a API de histórico de agentes
async function testAgentHistory() {
  try {
    console.log('🔍 Testando API de histórico de agentes...\n');

    // Fazer login como admin
    console.log('🔐 Fazendo login como admin...');
    const token = await login('admin@senai.com', 'admin123');
    
    if (!token) {
      console.log('❌ Não foi possível fazer login como admin');
      return;
    }

    console.log('✅ Login bem-sucedido como admin');

    // Configurar axios com o token
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Testar API de histórico de agentes
    console.log('📋 Testando /helpdesk/agents/my-history...');
    const historyResponse = await authAxios.get('/helpdesk/agents/my-history');
    
    if (historyResponse.status === 200) {
      const tickets = historyResponse.data;
      console.log(`✅ Encontrados ${tickets.length} tickets no histórico\n`);

      // Verificar cada ticket
      tickets.forEach((ticket, index) => {
        console.log(`📋 Ticket ${index + 1}:`);
        console.log(`   ID: ${ticket.id}`);
        console.log(`   Número: ${ticket.ticket_number}`);
        console.log(`   Título: ${ticket.title}`);
        console.log(`   Location: ${ticket.location || 'NULL'}`);
        console.log(`   Due Date: ${ticket.due_date || 'NULL'}`);
        console.log('');
      });

    } else {
      console.log('❌ Erro ao buscar histórico:', historyResponse.status, historyResponse.data);
    }

    // Testar API geral de tickets para comparação
    console.log('📋 Testando /helpdesk/tickets para comparação...');
    const ticketsResponse = await authAxios.get('/helpdesk/tickets');
    
    if (ticketsResponse.status === 200) {
      const tickets = ticketsResponse.data.tickets || ticketsResponse.data;
      console.log(`✅ Encontrados ${tickets.length} tickets na API geral\n`);

      // Verificar tickets com due_date
      const ticketsWithDeadline = tickets.filter(t => t.due_date);
      console.log(`📊 Estatísticas da API geral:`);
      console.log(`   Tickets com due_date: ${ticketsWithDeadline.length}/${tickets.length}`);
      
      if (ticketsWithDeadline.length > 0) {
        console.log(`   ✅ Há tickets com prazo definido na API geral`);
      } else {
        console.log(`   ❌ Nenhum ticket tem prazo definido na API geral`);
      }

    } else {
      console.log('❌ Erro ao buscar tickets gerais:', ticketsResponse.status, ticketsResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testAgentHistory();
