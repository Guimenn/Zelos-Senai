import prisma from './prisma/client.js';

async function checkTicketFields() {
  try {
    console.log('🔍 Verificando campos location e due_date em todos os tickets...\n');

    // Buscar todos os tickets com informações relevantes
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        due_date: true,
        client: {
          select: {
            department: true,
            address: true,
            user: {
              select: {
                address: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Total de tickets encontrados: ${tickets.length}\n`);

    let ticketsWithLocation = 0;
    let ticketsWithDueDate = 0;
    let ticketsWithClientData = 0;

    tickets.forEach((ticket, index) => {
      console.log(`Ticket ${index + 1}:`);
      console.log(`  ID: ${ticket.id}`);
      console.log(`  Título: ${ticket.title}`);
      console.log(`  Location: ${ticket.location || 'NULL'}`);
      console.log(`  Due Date: ${ticket.due_date || 'NULL'}`);
      console.log(`  Client Department: ${ticket.client?.department || 'NULL'}`);
      console.log(`  Client Address: ${ticket.client?.address || 'NULL'}`);
      console.log(`  User Address: ${ticket.client?.user?.address || 'NULL'}`);
      console.log('');

      if (ticket.location) ticketsWithLocation++;
      if (ticket.due_date) ticketsWithDueDate++;
      if (ticket.client?.department || ticket.client?.address || ticket.client?.user?.address) {
        ticketsWithClientData++;
      }
    });

    console.log('📈 Estatísticas:');
    console.log(`- Tickets com location: ${ticketsWithLocation}/${tickets.length} (${((ticketsWithLocation/tickets.length)*100).toFixed(1)}%)`);
    console.log(`- Tickets com due_date: ${ticketsWithDueDate}/${tickets.length} (${((ticketsWithDueDate/tickets.length)*100).toFixed(1)}%)`);
    console.log(`- Tickets com dados do cliente: ${ticketsWithClientData}/${tickets.length} (${((ticketsWithClientData/tickets.length)*100).toFixed(1)}%)`);

    console.log('\n🎯 Análise:');
    if (ticketsWithLocation === 0) {
      console.log('❌ Nenhum ticket tem o campo location preenchido');
      console.log('💡 Os tickets precisam ter o campo location preenchido no banco de dados');
    }
    if (ticketsWithDueDate === 0) {
      console.log('❌ Nenhum ticket tem o campo due_date preenchido');
      console.log('💡 Os tickets precisam ter o campo due_date preenchido no banco de dados');
    }
    if (ticketsWithClientData > 0) {
      console.log('✅ Alguns tickets têm dados do cliente que podem ser usados como fallback para location');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketFields();
