import prisma from './prisma/client.js';

async function checkTicketDescription() {
  try {
    console.log('🔍 Verificando campo description nos tickets...\n');

    // Buscar todos os tickets
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        ticket_number: true,
        title: true,
        description: true,
        location: true,
        due_date: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    console.log(`✅ Encontrados ${tickets.length} tickets (últimos 10)\n`);

    tickets.forEach((ticket, index) => {
      console.log(`📋 Ticket ${index + 1}:`);
      console.log(`   ID: ${ticket.id}`);
      console.log(`   Número: ${ticket.ticket_number}`);
      console.log(`   Título: ${ticket.title}`);
      console.log(`   Description: ${ticket.description || 'NULL'}`);
      console.log(`   Location: ${ticket.location || 'NULL'}`);
      console.log(`   Due Date: ${ticket.due_date || 'NULL'}`);
      console.log(`   Created At: ${ticket.created_at.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Verificar tickets específicos de teste
    const testTickets = tickets.filter(t => 
      t.title.includes('Teste Frontend') || 
      t.title.includes('Teste de Ticket com Deadline')
    );

    console.log(`📊 Estatísticas dos tickets de teste:`);
    console.log(`   Total de tickets de teste: ${testTickets.length}`);
    
    const ticketsWithDescription = testTickets.filter(t => t.description);
    console.log(`   Tickets com description: ${ticketsWithDescription.length}`);
    console.log(`   Tickets sem description: ${testTickets.length - ticketsWithDescription.length}`);

    if (ticketsWithDescription.length > 0) {
      console.log('\n✅ Tickets com description encontrados:');
      ticketsWithDescription.forEach(ticket => {
        console.log(`   - ${ticket.ticket_number}: "${ticket.description.substring(0, 50)}..."`);
      });
    }

    if (testTickets.length - ticketsWithDescription.length > 0) {
      console.log('\n❌ Tickets sem description:');
      testTickets.filter(t => !t.description).forEach(ticket => {
        console.log(`   - ${ticket.ticket_number}: ${ticket.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketDescription();
