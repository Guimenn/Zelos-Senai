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

// Função para testar a exibição de deadline
async function testDeadlineDisplay() {
  try {
    console.log('🔍 Testando exibição de deadline...\n');

    // Fazer login como admin
    console.log('🔐 Fazendo login...');
    const token = await login('admin@senai.com', 'admin123');
    
    if (!token) {
      console.log('❌ Não foi possível fazer login');
      return;
    }

    console.log('✅ Login bem-sucedido');

    // Configurar axios com o token
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Buscar tickets
    console.log('📋 Buscando tickets...');
    const response = await authAxios.get('/helpdesk/tickets');
    
    if (response.status === 200) {
      const tickets = response.data.tickets || response.data;
      console.log(`✅ Encontrados ${tickets.length} tickets\n`);

      // Verificar cada ticket
      tickets.forEach((ticket, index) => {
        console.log(`📋 Ticket ${index + 1}:`);
        console.log(`   ID: ${ticket.id}`);
        console.log(`   Número: ${ticket.ticket_number}`);
        console.log(`   Título: ${ticket.title}`);
        console.log(`   Location: ${ticket.location || 'NULL'}`);
        console.log(`   Due Date (raw): ${ticket.due_date || 'NULL'}`);
        
        if (ticket.due_date) {
          const dueDate = new Date(ticket.due_date);
          console.log(`   Due Date (parsed): ${dueDate.toISOString()}`);
          console.log(`   Due Date (local): ${dueDate.toLocaleString('pt-BR')}`);
          
          // Testar a função formatDeadline
          const now = new Date();
          const diffMs = dueDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          
          let formattedDeadline = '-';
          if (now > dueDate) {
            formattedDeadline = 'Vencido';
          } else if (diffHours < 1) {
            formattedDeadline = 'Vence em menos de 1h';
          } else if (diffHours < 24) {
            formattedDeadline = `Vence em ${diffHours}h`;
          } else if (diffDays < 7) {
            formattedDeadline = `Vence em ${diffDays}d`;
          } else {
            formattedDeadline = dueDate.toLocaleDateString('pt-BR');
          }
          
          console.log(`   Formatted Deadline: ${formattedDeadline}`);
        } else {
          console.log(`   Formatted Deadline: -`);
        }
        console.log('');
      });

      // Verificar tickets específicos com due_date
      const ticketsWithDeadline = tickets.filter(t => t.due_date);
      console.log(`📊 Estatísticas:`);
      console.log(`   Tickets com due_date: ${ticketsWithDeadline.length}/${tickets.length}`);
      
      if (ticketsWithDeadline.length > 0) {
        console.log(`   ✅ Há tickets com prazo definido`);
      } else {
        console.log(`   ❌ Nenhum ticket tem prazo definido`);
      }

    } else {
      console.log('❌ Erro ao buscar tickets:', response.status, response.data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testDeadlineDisplay();
