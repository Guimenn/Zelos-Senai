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

// Função para converter deadline do frontend para data
function convertDeadlineToDate(deadline) {
  const now = new Date();
  
  switch (deadline) {
    case 'immediate':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '48h':
      return new Date(now.getTime() + 48 * 60 * 60 * 1000);
    case '72h':
      return new Date(now.getTime() + 72 * 60 * 60 * 1000);
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '2weeks':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case '1month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'flexible':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 semana como padrão
    default:
      return null;
  }
}

// Função para testar criação de ticket com deadline
async function testCreateTicketWithDeadline() {
  try {
    console.log('🔍 Testando criação de ticket com deadline...\n');

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

    // Testar diferentes tipos de deadline
    const testDeadlines = ['24h', '48h', '1week', 'flexible'];
    
    for (const deadline of testDeadlines) {
      console.log(`\n📝 Testando deadline: ${deadline}`);
      
      // Converter deadline para data
      const dueDate = convertDeadlineToDate(deadline);
      console.log(`   Data convertida: ${dueDate?.toISOString()}`);
      
      // Dados do ticket
      const ticketData = {
        title: `Teste de Ticket com Deadline - ${deadline}`,
        description: `Este é um teste para verificar se o deadline "${deadline}" está sendo salvo corretamente. Descrição detalhada do problema para testar se o campo description também está funcionando.`,
        priority: 'Medium',
        category_id: 1,
        subcategory_id: 1,
        location: `Sala de Teste - Deadline ${deadline}`,
        contact_phone: '11999999999',
        contact_email: 'teste@senai.com',
        deadline: dueDate?.toISOString()
      };

      console.log('   Dados do ticket:', {
        title: ticketData.title,
        description: ticketData.description.substring(0, 50) + '...',
        location: ticketData.location,
        deadline: ticketData.deadline
      });

      // Criar ticket
      const response = await authAxios.post('/helpdesk/tickets', ticketData);
      
      if (response.status === 201 || response.status === 200) {
        const createdTicket = response.data;
        console.log(`   ✅ Ticket criado com sucesso!`);
        console.log(`      ID: ${createdTicket.id}`);
        console.log(`      Número: ${createdTicket.ticket_number}`);
        console.log(`      Location: ${createdTicket.location || 'NULL'}`);
        console.log(`      Due Date: ${createdTicket.due_date || 'NULL'}`);
        console.log(`      Description: ${createdTicket.description ? createdTicket.description.substring(0, 50) + '...' : 'NULL'}`);
        
        if (createdTicket.due_date) {
          const dueDate = new Date(createdTicket.due_date);
          console.log(`      Due Date (local): ${dueDate.toLocaleString('pt-BR')}`);
        }
      } else {
        console.log(`   ❌ Erro ao criar ticket:`, response.status, response.data);
      }
    }

    // Verificar tickets criados
    console.log('\n🔍 Verificando tickets criados...');
    const listResponse = await authAxios.get('/helpdesk/tickets');
    
    if (listResponse.status === 200) {
      const tickets = listResponse.data.tickets || listResponse.data;
      const testTickets = tickets.filter(t => t.title.includes('Teste de Ticket com Deadline'));
      
      console.log(`✅ Encontrados ${testTickets.length} tickets de teste`);
      
      testTickets.forEach((ticket, index) => {
        console.log(`\n📋 Ticket de teste ${index + 1}:`);
        console.log(`   ID: ${ticket.id}`);
        console.log(`   Número: ${ticket.ticket_number}`);
        console.log(`   Título: ${ticket.title}`);
        console.log(`   Location: ${ticket.location || 'NULL'}`);
        console.log(`   Due Date: ${ticket.due_date || 'NULL'}`);
        console.log(`   Description: ${ticket.description ? ticket.description.substring(0, 50) + '...' : 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testCreateTicketWithDeadline();
