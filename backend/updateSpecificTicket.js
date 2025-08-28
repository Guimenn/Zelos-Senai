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

// Função para atualizar o ticket específico
async function updateSpecificTicket() {
  try {
    console.log('🔍 Atualizando ticket específico...\n');

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

    // Atualizar o ticket TKT-935372-804 (ID: 11)
    const ticketId = 11;
    const updateData = {
      location: 'Sala de Reuniões - 4º Andar - Bloco C',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias no futuro
    };

    console.log(`📝 Atualizando ticket ID ${ticketId}...`);
    console.log(`   Location: ${updateData.location}`);
    console.log(`   Due Date: ${updateData.due_date}`);

    const response = await authAxios.put(`/helpdesk/tickets/${ticketId}`, updateData);
    
    if (response.status === 200) {
      console.log('✅ Ticket atualizado com sucesso!');
      
      // Verificar se a atualização foi aplicada
      console.log('\n🔍 Verificando se a atualização foi aplicada...');
      const getResponse = await authAxios.get(`/helpdesk/tickets/${ticketId}`);
      
      if (getResponse.status === 200) {
        const ticket = getResponse.data;
        console.log(`✅ Ticket ${ticket.ticket_number}:`);
        console.log(`   Location: ${ticket.location || 'NULL'}`);
        console.log(`   Due Date: ${ticket.due_date || 'NULL'}`);
        
        if (ticket.due_date) {
          const dueDate = new Date(ticket.due_date);
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
        }
      }
    } else {
      console.log('❌ Erro ao atualizar ticket:', response.status, response.data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

updateSpecificTicket();
