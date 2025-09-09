import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function debugTesteChat2() {
  try {
    console.log('🔍 Investigando o ticket testeChat2 (TKT-388238-788)...');
    
    // Buscar o ticket testeChat2
    const testTicket = await prisma.ticket.findFirst({
      where: { 
        OR: [
          { title: 'testeChat2' },
          { ticket_number: 'TKT-388238-788' }
        ]
      },
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
      console.log('❌ Ticket testeChat2 não encontrado');
      return;
    }

    console.log('✅ Ticket testeChat2 encontrado:');
    console.log(`   - ID: ${testTicket.id}`);
    console.log(`   - Título: ${testTicket.title}`);
    console.log(`   - Ticket Number: ${testTicket.ticket_number}`);
    console.log(`   - Status: ${testTicket.status}`);
    console.log(`   - Criado por: ${testTicket.creator.name} (${testTicket.creator.role})`);
    console.log(`   - Atribuído para: ${testTicket.assignee?.name || 'Nenhum'} (${testTicket.assignee?.role || 'N/A'})`);

    // Verificar critérios para chat
    console.log('\n🔍 Verificando critérios para chat:');
    
    // 1. Verificar se o ticket está fechado
    const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(testTicket.status);
    console.log(`   - Status fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
    console.log(`   - Status atual: ${testTicket.status}`);
    
    if (isClosed) {
      console.log('❌ Chat não disponível: ticket fechado');
      console.log('💡 Para disponibilizar o chat, o ticket precisa ter status "InProgress"');
      return;
    }

    // 2. Verificar se há técnico atribuído
    const hasAssignee = !!(testTicket.assigned_to || testTicket.assignee);
    console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasAssignee) {
      console.log('❌ Chat não disponível: nenhum técnico atribuído');
      console.log('💡 Para disponibilizar o chat, o ticket precisa ter um técnico atribuído');
      return;
    }

    // 3. Verificar se o técnico aceitou o chamado
    const isAccepted = testTicket.status === 'InProgress';
    console.log(`   - Foi aceito pelo técnico? ${isAccepted ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!isAccepted) {
      console.log('❌ Chat não disponível: técnico não aceitou o chamado');
      console.log('💡 Para disponibilizar o chat, o ticket precisa ter status "InProgress" (aceito pelo técnico)');
      return;
    }

    // Se chegou até aqui, o ticket deveria ter chat disponível
    console.log('\n🎉 O ticket atende a TODOS os critérios para chat!');
    console.log('   - ✅ Status ativo (não fechado)');
    console.log('   - ✅ Técnico atribuído');
    console.log('   - ✅ Aceito pelo técnico (InProgress)');
    console.log('   - ✅ Botão de chat deve aparecer');

    // Verificar se há mensagens
    const messages = await prisma.messages.findMany({
      where: { ticket_id: testTicket.id },
      orderBy: { created_at: 'desc' }
    });

    console.log(`\n📋 Mensagens encontradas: ${messages.length}`);
    if (messages.length > 0) {
      console.log('   - Há mensagens no chat');
    } else {
      console.log('   - Nenhuma mensagem ainda');
    }

    // Verificar se há problemas com a estrutura dos dados
    console.log('\n🔍 Verificando estrutura dos dados:');
    console.log(`   - Ticket ID: ${testTicket.id} (tipo: ${typeof testTicket.id})`);
    console.log(`   - Creator ID: ${testTicket.creator.id} (tipo: ${typeof testTicket.creator.id})`);
    console.log(`   - Assignee ID: ${testTicket.assignee?.id || 'N/A'} (tipo: ${typeof testTicket.assignee?.id})`);
    
    // Verificar se os IDs são consistentes
    const creatorIdStr = String(testTicket.creator.id);
    const assigneeIdStr = testTicket.assignee ? String(testTicket.assignee.id) : 'N/A';
    console.log(`   - Creator ID (string): ${creatorIdStr}`);
    console.log(`   - Assignee ID (string): ${assigneeIdStr}`);

    // Simular a lógica da API de mensagens
    console.log('\n🔍 Simulando lógica da API de mensagens:');
    
    const chatAccess = {
      canAccess: !isClosed && hasAssignee && isAccepted,
      canSend: !isClosed && hasAssignee && isAccepted,
      reason: !isClosed && hasAssignee && isAccepted 
        ? 'Chat disponível - ticket ativo com técnico atribuído' 
        : 'Chat não disponível',
      ticketStatus: testTicket.status
    };

    console.log(`   - canAccess: ${chatAccess.canAccess}`);
    console.log(`   - canSend: ${chatAccess.canSend}`);
    console.log(`   - reason: ${chatAccess.reason}`);
    console.log(`   - ticketStatus: ${chatAccess.ticketStatus}`);

    if (chatAccess.canAccess) {
      console.log('\n🎯 ChatButtonSimple deveria aparecer? ✅ SIM');
      console.log('\n💡 Se o botão ainda não aparece, pode ser:');
      console.log('   1. Problema na API de mensagens (/api/messages/list)');
      console.log('   2. Problema no hook useChatAvailability');
      console.log('   3. Problema na renderização do ChatButtonSimple');
      console.log('   4. Problema na função getTicketAndIdByDisplay');
      
      console.log('\n🔧 Para debug:');
      console.log('   1. Abra o console do navegador');
      console.log('   2. Acesse a página de histórico');
      console.log('   3. Procure pelo ticket "testeChat2"');
      console.log('   4. Verifique se há erros no console');
      console.log('   5. Verifique se a API /api/messages/list está funcionando');
    } else {
      console.log('\n❌ O ChatButtonSimple não deveria aparecer');
    }

  } catch (error) {
    console.error('❌ Erro ao investigar ticket testeChat2:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o debug
debugTesteChat2();
