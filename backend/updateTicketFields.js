import prisma from './prisma/client.js';

async function updateTicketFields() {
  try {
    console.log('🔧 Atualizando campos location e due_date dos tickets...\n');

    // Buscar todos os tickets
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        due_date: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Total de tickets encontrados: ${tickets.length}\n`);

    // Dados de exemplo para atualizar os tickets
    const updateData = [
      {
        location: 'Sala de Reuniões - 3º Andar',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas a partir de agora
      },
      {
        location: 'Laboratório de Informática - Bloco A',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 dias a partir de agora
      },
      {
        location: 'Escritório Central - 1º Andar',
        due_date: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 horas a partir de agora
      },
      {
        location: 'Sala de Treinamento - 2º Andar',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias a partir de agora
      }
    ];

    // Atualizar cada ticket com dados diferentes
    for (let i = 0; i < Math.min(tickets.length, updateData.length); i++) {
      const ticket = tickets[i];
      const data = updateData[i];

      console.log(`🔄 Atualizando ticket ${ticket.id} (${ticket.title}):`);
      console.log(`   Location: ${data.location}`);
      console.log(`   Due Date: ${data.due_date.toLocaleString('pt-BR')}`);

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          location: data.location,
          due_date: data.due_date
        }
      });

      console.log(`   ✅ Ticket ${ticket.id} atualizado com sucesso!\n`);
    }

    console.log('🎉 Atualização concluída! Agora os tickets têm dados de location e due_date.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTicketFields();
