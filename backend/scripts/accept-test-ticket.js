import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function acceptTestTicket() {
  try {
    console.log('🔧 Aceitando ticket de teste para disponibilizar o chat...');
    
    // Buscar o ticket de teste
    const testTicket = await prisma.ticket.findFirst({
      where: { title: 'Teste de Chat - Ticket Ativo' },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!testTicket) {
      console.log('❌ Ticket de teste não encontrado');
      return;
    }

    console.log('✅ Ticket de teste encontrado:');
    console.log(`   - ID: ${testTicket.id}`);
    console.log(`   - Título: ${testTicket.title}`);
    console.log(`   - Status atual: ${testTicket.status}`);
    console.log(`   - Criado por: ${testTicket.creator.name} (${testTicket.creator.role})`);
    console.log(`   - Atribuído para: ${testTicket.assignee.name} (${testTicket.assignee.role})`);

    // Verificar se o ticket já foi aceito
    if (testTicket.status === 'InProgress') {
      console.log('✅ Ticket já está em InProgress (aceito)');
    } else {
      // Simular aceitação do ticket
      console.log('\n🔄 Simulando aceitação do ticket...');
      
      const updatedTicket = await prisma.ticket.update({
        where: { id: testTicket.id },
        data: {
          status: 'InProgress' // Status quando aceito pelo técnico
        }
      });

      console.log('✅ Ticket aceito com sucesso!');
      console.log(`   - Novo status: ${updatedTicket.status}`);
    }

    // Verificar se há registro de agente para o técnico
    const agentRecord = await prisma.agent.findFirst({
      where: { user_id: testTicket.assignee.id }
    });

    if (!agentRecord) {
      console.log('⚠️  Técnico não tem registro na tabela Agent, criando...');
      await prisma.agent.create({
        data: {
          user_id: testTicket.assignee.id,
          employee_id: `AGENT-${testTicket.assignee.id}`,
          department: 'Suporte Técnico',
          skills: ['Suporte Geral'],
          max_tickets: 10
        });
      console.log('✅ Registro Agent criado');
    }

    // Verificar se há associação do agente com a categoria do ticket
    const categoryAssociation = await prisma.agentCategory.findFirst({
      where: {
        agent_id: agentRecord.id,
        category_id: testTicket.category_id
      }
    });

    if (!categoryAssociation) {
      console.log('⚠️  Agente não está associado à categoria do ticket, associando...');
      await prisma.agentCategory.create({
        data: {
          agent_id: agentRecord.id,
          category_id: testTicket.category_id
        }
      });
      console.log('✅ Associação Agent-Category criada');
    }

    // Verificar critérios finais para chat
    console.log('\n🔍 Verificação final dos critérios para chat:');
    const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(testTicket.status);
    const hasAssignee = !!testTicket.assignee;
    const isAccepted = testTicket.status === 'InProgress';

    console.log(`   - Status fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
    console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   - Foi aceito pelo técnico? ${isAccepted ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   - Chat deveria aparecer? ${!isClosed && hasAssignee && isAccepted ? '✅ SIM' : '❌ NÃO'}`);

    if (!isClosed && hasAssignee && isAccepted) {
      console.log('\n🎉 SUCESSO! O ticket atende a TODOS os critérios para chat:');
      console.log('   - ✅ Status ativo (não fechado)');
      console.log('   - ✅ Técnico atribuído');
      console.log('   - ✅ Aceito pelo técnico (InProgress)');
      console.log('   - ✅ Botão de chat deve aparecer na página de histórico');
      
      console.log('\n💡 Para testar:');
      console.log('   1. Acesse a página de histórico de chamados');
      console.log('   2. Procure pelo ticket "Teste de Chat - Ticket Ativo"');
      console.log('   3. Verifique se o botão de chat aparece');
      console.log('   4. Clique no botão para abrir o modal de chat');
    } else {
      console.log('\n❌ ERRO: O ticket ainda não atende a todos os critérios para chat');
    }

    // Listar todos os tickets para verificar
    const allTickets = await prisma.ticket.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('\n📊 Todos os tickets no sistema:');
    allTickets.forEach(ticket => {
      const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticket.status);
      const hasAssignee = !!ticket.assignee;
      const isAccepted = ticket.status === 'InProgress';
      const shouldShowChat = !isClosed && hasAssignee && isAccepted;
      
      console.log(`   - Ticket ${ticket.id}: ${ticket.title}`);
      console.log(`     • Status: ${ticket.status} ${isClosed ? '🔒' : '🟢'}`);
      console.log(`     • Técnico: ${ticket.assignee?.name || 'Não atribuído'}`);
      console.log(`     • Aceito? ${isAccepted ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`     • Chat: ${shouldShowChat ? '✅ Disponível' : '❌ Não disponível'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao aceitar ticket de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
acceptTestTicket();
