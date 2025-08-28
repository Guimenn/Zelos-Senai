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

// Função para testar criação de ticket
async function testCreateTicket() {
  try {
    console.log('🔍 Testando criação de ticket com location e deadline...\n');

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

    // Dados do ticket de teste
    const testTicketData = {
      title: 'Teste de Ticket com Location e Deadline',
      description: 'Este é um ticket de teste para verificar se os campos location e deadline estão sendo salvos corretamente.',
      priority: 'Medium',
      category_id: 1, // Assumindo que existe uma categoria com ID 1
      location: 'Sala de Teste - 4º Andar',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias a partir de agora
      contact_phone: '(11) 99999-9999',
      contact_email: 'teste@senai.com'
    };

    console.log('📝 Dados do ticket a ser criado:');
    console.log(`   Título: ${testTicketData.title}`);
    console.log(`   Location: ${testTicketData.location}`);
    console.log(`   Deadline: ${testTicketData.deadline}`);

    // Criar o ticket
    console.log('\n🔄 Criando ticket...');
    const createResponse = await authAxios.post('/helpdesk/tickets', testTicketData);
    
    if (createResponse.status === 201 || createResponse.status === 200) {
      const createdTicket = createResponse.data;
      console.log('✅ Ticket criado com sucesso!');
      console.log(`   ID: ${createdTicket.id}`);
      console.log(`   Número: ${createdTicket.ticket_number}`);
      console.log(`   Location: ${createdTicket.location || 'NULL'}`);
      console.log(`   Due Date: ${createdTicket.due_date || 'NULL'}`);
      
      // Verificar se os campos foram salvos corretamente
      if (createdTicket.location === testTicketData.location) {
        console.log('✅ Campo location salvo corretamente');
      } else {
        console.log('❌ Campo location não foi salvo corretamente');
      }
      
      if (createdTicket.due_date) {
        console.log('✅ Campo due_date salvo corretamente');
      } else {
        console.log('❌ Campo due_date não foi salvo corretamente');
      }

      // Buscar o ticket criado para verificar se os dados estão no banco
      console.log('\n🔍 Verificando ticket no banco de dados...');
      const getResponse = await authAxios.get(`/helpdesk/tickets/${createdTicket.id}`);
      
      if (getResponse.status === 200) {
        const ticketFromDB = getResponse.data;
        console.log('✅ Ticket encontrado no banco:');
        console.log(`   Location: ${ticketFromDB.location || 'NULL'}`);
        console.log(`   Due Date: ${ticketFromDB.due_date || 'NULL'}`);
      } else {
        console.log('❌ Erro ao buscar ticket no banco');
      }

    } else {
      console.log('❌ Erro ao criar ticket:', createResponse.status, createResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testCreateTicket();
