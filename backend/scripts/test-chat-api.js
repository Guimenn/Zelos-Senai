import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testChatAPI() {
  try {
    console.log('🔍 Testando API de mensagens para o ticket de teste...');
    
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
    console.log(`   - Status: ${testTicket.status}`);
    console.log(`   - Criado por: ${testTicket.creator.name} (${testTicket.creator.role})`);
    console.log(`   - Atribuído para: ${testTicket.assignee.name} (${testTicket.assignee.role})`);

    // Simular uma requisição para a API de mensagens
    console.log('\n🔍 Simulando requisição para API de mensagens...');
    
    // Buscar um token de admin para testar
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' }
    });

    if (!adminUser) {
      console.log('❌ Nenhum usuário Admin encontrado para teste');
      return;
    }

    console.log(`   - Usuário de teste: ${adminUser.name} (${adminUser.email})`);
    console.log(`   - Ticket ID: ${testTicket.id}`);

    // Verificar se há mensagens para este ticket
    const messages = await prisma.messages.findMany({
      where: { ticket_id: testTicket.id },
      orderBy: { created_at: 'desc' }
    });

    console.log(`\n📋 Mensagens encontradas: ${messages.length}`);
    if (messages.length > 0) {
      for (const message of messages) {
        // Buscar dados do usuário que enviou a mensagem
        const sender = await prisma.user.findUnique({
          where: { id: message.sender_id },
          select: { id: true, name: true, email: true, role: true }
        });
        
        console.log(`   - ${sender?.name || 'Usuário não encontrado'} (${sender?.role || 'N/A'}): ${message.content?.substring(0, 50) || 'Sem conteúdo'}...`);
      }
    } else {
      console.log('   - Nenhuma mensagem encontrada');
    }

    // Verificar critérios de acesso ao chat
    console.log('\n🔍 Verificando critérios de acesso ao chat:');
    
    const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(testTicket.status);
    const hasAssignee = !!testTicket.assignee;
    const isAccepted = testTicket.status === 'InProgress';

    console.log(`   - Status fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
    console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   - Foi aceito pelo técnico? ${isAccepted ? '✅ SIM' : '❌ NÃO'}`);

    // Simular a lógica do ChatButtonSimple
    const shouldShowChat = !isClosed && hasAssignee && isAccepted;
    console.log(`   - Chat deveria aparecer? ${shouldShowChat ? '✅ SIM' : '❌ NÃO'}`);

    if (shouldShowChat) {
      console.log('\n🎉 O ticket atende a TODOS os critérios para chat!');
      console.log('   - ✅ Status ativo (não fechado)');
      console.log('   - ✅ Técnico atribuído');
      console.log('   - ✅ Aceito pelo técnico (InProgress)');
      
      console.log('\n💡 Se o botão ainda não aparece, pode ser:');
      console.log('   1. Problema na API de mensagens (/api/messages/list)');
      console.log('   2. Problema no hook useChatAvailability');
      console.log('   3. Problema na renderização do ChatButtonSimple');
      console.log('   4. Problema na função getTicketAndIdByDisplay');
      
      console.log('\n🔧 Para debug:');
      console.log('   1. Abra o console do navegador');
      console.log('   2. Acesse a página de histórico');
      console.log('   3. Verifique se há erros no console');
      console.log('   4. Verifique se a API /api/messages/list está funcionando');
    } else {
      console.log('\n❌ O ticket não atende aos critérios para chat');
    }

    // Verificar se há problemas com a estrutura dos dados
    console.log('\n🔍 Verificando estrutura dos dados:');
    console.log(`   - Ticket ID: ${testTicket.id} (tipo: ${typeof testTicket.id})`);
    console.log(`   - Creator ID: ${testTicket.creator.id} (tipo: ${typeof testTicket.creator.id})`);
    console.log(`   - Assignee ID: ${testTicket.assignee.id} (tipo: ${typeof testTicket.assignee.id})`);
    
    // Verificar se os IDs são consistentes
    const creatorIdStr = String(testTicket.creator.id);
    const assigneeIdStr = String(testTicket.assignee.id);
    console.log(`   - Creator ID (string): ${creatorIdStr}`);
    console.log(`   - Assignee ID (string): ${assigneeIdStr}`);

  } catch (error) {
    console.error('❌ Erro ao testar API de chat:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testChatAPI();
