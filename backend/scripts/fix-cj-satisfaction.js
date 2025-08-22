import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixCJSatisfaction() {
  try {
    console.log('🔧 Corrigindo dados de satisfação do CJJ...');

    // Encontrar o usuário CJJ
    const user = await prisma.user.findUnique({
      where: { email: 'cj@gmail.com' },
      include: { agent: true }
    });

    if (!user) {
      console.log('❌ Usuário CJJ não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);

    // Buscar tickets resolvidos do CJJ sem avaliação de satisfação
    const tickets = await prisma.ticket.findMany({
      where: {
        assigned_to: user.id,
        status: 'Resolved',
        satisfaction_rating: null
      }
    });

    console.log(`📋 Encontrados ${tickets.length} tickets resolvidos sem avaliação`);

    // Atualizar tickets com avaliações aleatórias (3-5 estrelas)
    for (const ticket of tickets) {
      const rating = Math.floor(Math.random() * 3) + 3; // 3, 4 ou 5 estrelas
      
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { 
          satisfaction_rating: rating,
          closed_at: new Date() // Garantir que tem data de fechamento
        }
      });

      console.log(`✅ Ticket #${ticket.id} - Avaliação: ${rating}/5 estrelas`);
    }

    // Verificar a média de satisfação atualizada
    const avgSatisfaction = await prisma.ticket.aggregate({
      where: {
        assigned_to: user.id,
        satisfaction_rating: { not: null }
      },
      _avg: { satisfaction_rating: true }
    });

    console.log(`📊 Nova média de satisfação: ${avgSatisfaction._avg.satisfaction_rating?.toFixed(1)}/5`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCJSatisfaction();
