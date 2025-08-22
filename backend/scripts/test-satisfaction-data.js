import prisma from '../src/generated/prisma/index.js';

async function testSatisfactionData() {
  try {
    console.log('🧪 Testando dados de satisfação e tempo de resolução...');

    // Buscar um agente existente
    const agent = await prisma.agent.findFirst({
      include: {
        user: true
      }
    });

    if (!agent) {
      console.log('❌ Nenhum agente encontrado');
      return;
    }

    console.log('✅ Agente encontrado:', agent.user.name);

    // Buscar tickets atribuídos ao agente
    const tickets = await prisma.ticket.findMany({
      where: {
        assigned_to: agent.user.id,
        status: {
          in: ['Resolved', 'Closed']
        }
      },
      take: 5
    });

    console.log(`📋 Encontrados ${tickets.length} tickets resolvidos`);

    // Atualizar alguns tickets com dados de teste
    for (let i = 0; i < Math.min(tickets.length, 3); i++) {
      const ticket = tickets[i];
      const satisfactionRating = Math.floor(Math.random() * 5) + 1; // 1-5
      const resolutionTime = Math.floor(Math.random() * 480) + 60; // 60-540 minutos (1-9 horas)

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          satisfaction_rating: satisfactionRating,
          resolution_time: resolutionTime
        }
      });

      console.log(`✅ Ticket #${ticket.id} atualizado: satisfação=${satisfactionRating}, tempo=${resolutionTime}min`);
    }

    // Verificar os dados atualizados
    const updatedTickets = await prisma.ticket.findMany({
      where: {
        assigned_to: agent.user.id,
        OR: [
          { satisfaction_rating: { not: null } },
          { resolution_time: { not: null } }
        ]
      },
      select: {
        id: true,
        title: true,
        satisfaction_rating: true,
        resolution_time: true,
        status: true
      }
    });

    console.log('📊 Tickets com dados de satisfação/tempo:', updatedTickets);

    // Calcular médias
    const avgSatisfaction = await prisma.ticket.aggregate({
      where: {
        assigned_to: agent.user.id,
        satisfaction_rating: { not: null }
      },
      _avg: { satisfaction_rating: true }
    });

    const avgResolutionTime = await prisma.ticket.aggregate({
      where: {
        assigned_to: agent.user.id,
        resolution_time: { not: null }
      },
      _avg: { resolution_time: true }
    });

    console.log('📈 Médias calculadas:', {
      satisfacao: avgSatisfaction._avg.satisfaction_rating,
      tempoResolucao: avgResolutionTime._avg.resolution_time
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSatisfactionData();
