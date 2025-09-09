import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testMessagesAPIDirect() {
  try {
    console.log('🔍 Testando API de mensagens diretamente para o ticket de teste...');
    
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

    // Simular a lógica da API de mensagens
    console.log('\n🔍 Simulando lógica da API de mensagens...');
    
    // Verificar se o ticket está fechado
    const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(testTicket.status);
    console.log(`   - Ticket fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
    
    if (isClosed) {
      console.log('❌ Chat não disponível: ticket fechado');
      return;
    }

    // Verificar se há técnico atribuído
    const hasAssignee = !!(testTicket.assigned_to || testTicket.assignee);
    console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasAssignee) {
      console.log('❌ Chat não disponível: nenhum técnico atribuído');
      return;
    }

    // Buscar mensagens
    const messages = await prisma.messages.findMany({
      where: { ticket_id: testTicket.id },
      orderBy: { created_at: 'desc' }
    });

    console.log(`   - Mensagens encontradas: ${messages.length}`);

    // Simular a resposta da API
    const chatAccess = {
      canAccess: true,
      canSend: true,
      reason: 'Chat disponível - ticket ativo com técnico atribuído',
      ticketStatus: testTicket.status
    };

    console.log('\n📋 Resposta simulada da API:');
    console.log(`   - canAccess: ${chatAccess.canAccess}`);
    console.log(`   - canSend: ${chatAccess.canSend}`);
    console.log(`   - reason: ${chatAccess.reason}`);
    console.log(`   - ticketStatus: ${chatAccess.ticketStatus}`);

    // Verificar se o ChatButtonSimple deveria aparecer
    const shouldShowChat = chatAccess.canAccess;
    console.log(`\n🎯 ChatButtonSimple deveria aparecer? ${shouldShowChat ? '✅ SIM' : '❌ NÃO'}`);

    if (shouldShowChat) {
      console.log('\n🎉 SUCESSO! O ChatButtonSimple deveria aparecer!');
      console.log('   - ✅ API de mensagens retorna canAccess: true');
      console.log('   - ✅ Ticket ativo com técnico atribuído');
      console.log('   - ✅ Chat disponível');
      
      console.log('\n💡 Se o botão ainda não aparece, verifique:');
      console.log('   1. Console do navegador para erros JavaScript');
      console.log('   2. Se a API /api/messages/list está funcionando');
      console.log('   3. Se o hook useChatAvailability está funcionando');
      console.log('   4. Se a função getTicketAndIdByDisplay está retornando o ticket correto');
      
      console.log('\n🔧 Para debug no navegador:');
      console.log('   1. Abra F12 (DevTools)');
      console.log('   2. Vá para a aba Console');
      console.log('   3. Acesse a página de histórico');
      console.log('   4. Procure por logs do ChatButtonSimple');
      console.log('   5. Verifique se há erros em vermelho');
      
      console.log('\n📊 Dados do ticket para debug:');
      console.log(`   - Ticket ID (backend): ${testTicket.id}`);
      console.log(`   - Ticket ID (string): "${testTicket.id}"`);
      console.log(`   - Status: ${testTicket.status}`);
      console.log(`   - Técnico: ${testTicket.assignee.name} (ID: ${testTicket.assignee.id})`);
      console.log(`   - Criador: ${testTicket.creator.name} (ID: ${testTicket.creator.id})`);
      
      console.log('\n🔧 Teste manual da API:');
      console.log(`   - URL: /api/messages/list?ticket_id=${testTicket.id}`);
      console.log(`   - Método: GET`);
      console.log(`   - Headers: Authorization: Bearer <token>`);
      
    } else {
      console.log('\n❌ O ChatButtonSimple não deveria aparecer');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API de mensagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testMessagesAPIDirect();
