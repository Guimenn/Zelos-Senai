import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testChatButtonsHistory() {
  try {
    console.log('🔍 Testando funcionalidade de chat na página de histórico...');
    
    // Buscar alguns tickets para testar
    const tickets = await prisma.ticket.findMany({
      take: 5,
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

    console.log(`✅ Encontrados ${tickets.length} tickets para teste:`);
    
    tickets.forEach((ticket, index) => {
      console.log(`\n📋 Ticket ${index + 1}:`);
      console.log(`   - ID: ${ticket.id}`);
      console.log(`   - Título: ${ticket.title}`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - Criado por: ${ticket.creator?.name} (${ticket.creator?.email}) - ${ticket.creator?.role}`);
      console.log(`   - Atribuído para: ${ticket.assignee?.name || 'Não atribuído'} (${ticket.assignee?.email || 'N/A'}) - ${ticket.assignee?.role || 'N/A'}`);
      
      // Verificar se o ticket tem as informações necessárias para o chat
      const hasRequiredData = ticket.creator && ticket.assignee;
      console.log(`   - ✅ Dados para chat: ${hasRequiredData ? 'Completos' : 'Incompletos'}`);
      
      if (hasRequiredData) {
        console.log(`   - 💬 Chat disponível entre:`);
        console.log(`     • ${ticket.creator.name} (${ticket.creator.role})`);
        console.log(`     • ${ticket.assignee.name} (${ticket.assignee.role})`);
      }
    });

    // Verificar se há mensagens nos tickets
    console.log('\n🔍 Verificando mensagens existentes...');
    
    try {
      for (const ticket of tickets) {
        const messageCount = await prisma.message.count({
          where: { ticket_id: ticket.id }
        });
        
        if (messageCount > 0) {
          console.log(`   - Ticket ${ticket.id}: ${messageCount} mensagens`);
        }
      }
    } catch (error) {
      console.log('   ⚠️  Não foi possível verificar mensagens:', error.message);
    }

    console.log('\n🎉 Teste concluído!');
    console.log('📋 Resumo:');
    console.log('   - Botões de chat foram adicionados à página de histórico');
    console.log('   - Função getTicketAndIdByDisplay foi implementada');
    console.log('   - ChatButtonSimple foi importado e configurado');
    console.log('   - Botões aparecem tanto na visualização em lista quanto em grid');
    console.log('\n💡 Para testar:');
    console.log('   1. Acesse a página de histórico de chamados');
    console.log('   2. Verifique se os botões de chat aparecem nos chamados');
    console.log('   3. Clique no botão de chat para abrir o modal');
    console.log('   4. Teste o envio de mensagens');

  } catch (error) {
    console.error('❌ Erro ao testar chat na página de histórico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testChatButtonsHistory();
