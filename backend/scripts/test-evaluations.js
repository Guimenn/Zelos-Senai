import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestEvaluations() {
  try {
    console.log('Adicionando avaliações de teste...');

    // Buscar todos os agentes
    const agents = await prisma.agent.findMany({
      include: {
        user: true
      }
    });

    if (agents.length === 0) {
      console.log('Nenhum agente encontrado. Crie alguns agentes primeiro.');
      return;
    }

    // Avaliações de teste com diferentes valores decimais
    const testRatings = [4.6, 4.3, 4.8, 3.9, 4.7, 4.2, 4.5, 4.1];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const rating = testRatings[i % testRatings.length];
      
      // Criar avaliação de teste
      await prisma.agentEvaluation.create({
        data: {
          agent_id: agent.id,
          overall_rating: rating,
          technical_skills: rating,
          communication: rating,
          problem_solving: rating,
          teamwork: rating,
          punctuality: rating,
          evaluation_date: new Date(),
          evaluator_name: 'Sistema de Teste',
          comments: `Avaliação de teste com rating ${rating}`
        }
      });

      console.log(`Avaliação ${rating} adicionada para ${agent.user?.name || 'Agente sem nome'}`);
    }

    console.log('Avaliações de teste adicionadas com sucesso!');
    
    // Mostrar estatísticas
    const agentsWithStats = await prisma.agent.findMany({
      include: {
        user: true,
        evaluations: true
      }
    });

    console.log('\nEstatísticas das avaliações:');
    agentsWithStats.forEach(agent => {
      const evaluations = agent.evaluations;
      if (evaluations.length > 0) {
        const totalRating = evaluations.reduce((sum, e) => sum + e.overall_rating, 0);
        const averageRating = totalRating / evaluations.length;
        const roundedRating = Math.round(averageRating * 10) / 10;
        
        console.log(`${agent.user?.name || 'Agente sem nome'}: ${roundedRating} (${evaluations.length} avaliações)`);
      }
    });

  } catch (error) {
    console.error('Erro ao adicionar avaliações de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestEvaluations();
