import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function createTestTicketForChat() {
  try {
    console.log('🔧 Criando ticket de teste para demonstrar o chat...');
    
    // Buscar um usuário Admin (criador)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' }
    });

    if (!adminUser) {
      console.log('❌ Nenhum usuário Admin encontrado');
      return;
    }

    // Buscar um usuário Agent (técnico)
    const agentUser = await prisma.user.findFirst({
      where: { role: 'Agent' }
    });

    if (!agentUser) {
      console.log('❌ Nenhum usuário Agent encontrado');
      return;
    }

    // Buscar um usuário Client (cliente)
    const clientUser = await prisma.user.findFirst({
      where: { role: 'Client' },
      include: { client: true }
    });

    if (!clientUser) {
      console.log('❌ Nenhum usuário Client encontrado');
      return;
    }

    // Verificar se o usuário tem registro na tabela Client
    let clientRecord = clientUser.client;
    if (!clientRecord) {
      console.log('⚠️  Usuário Client não tem registro na tabela Client, criando...');
      clientRecord = await prisma.client.create({
        data: {
          user_id: clientUser.id,
          company: 'Empresa Teste',
          client_type: 'Individual'
        }
      });
      console.log('✅ Registro Client criado');
    }

    console.log('✅ Usuários encontrados:');
    console.log(`   - Admin (criador): ${adminUser.name} (${adminUser.email})`);
    console.log(`   - Agent (técnico): ${agentUser.name} (${agentUser.email})`);
    console.log(`   - Client: ${clientUser.name} (${clientUser.email})`);

    // Buscar uma categoria
    const category = await prisma.category.findFirst();
    if (!category) {
      console.log('❌ Nenhuma categoria encontrada');
      return;
    }

    console.log(`   - Categoria: ${category.name}`);

    // Gerar número do ticket
    const ticketNumber = `TKT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

    // Criar o ticket de teste
    const testTicket = await prisma.ticket.create({
      data: {
        title: 'Teste de Chat - Ticket Ativo',
        description: 'Este é um ticket de teste criado para demonstrar o funcionamento do chat na página de histórico.',
        status: 'InProgress', // Status ativo (não fechado)
        priority: 'Medium',
        category_id: category.id,
        client_id: clientRecord.id, // Cliente
        created_by: adminUser.id,
        assigned_to: agentUser.id, // Técnico atribuído
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias a partir de agora
        ticket_number: ticketNumber
      }
    });

    console.log('\n✅ Ticket de teste criado com sucesso!');
    console.log(`   - ID: ${testTicket.id}`);
    console.log(`   - Título: ${testTicket.title}`);
    console.log(`   - Status: ${testTicket.status}`);
    console.log(`   - Criado por: ${adminUser.name} (${adminUser.role})`);
    console.log(`   - Atribuído para: ${agentUser.name} (${agentUser.role})`);

    // Verificar se o ticket atende aos critérios para chat
    const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(testTicket.status);
    const hasAssignee = !!testTicket.assigned_to;

    console.log('\n🔍 Verificação dos critérios para chat:');
    console.log(`   - Status fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
    console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   - Chat deveria aparecer? ${!isClosed && hasAssignee ? '✅ SIM' : '❌ NÃO'}`);

    if (!isClosed && hasAssignee) {
      console.log('\n🎉 SUCESSO! O ticket atende aos critérios para chat:');
      console.log('   - ✅ Status ativo (não fechado)');
      console.log('   - ✅ Técnico atribuído');
      console.log('   - ✅ Botão de chat deve aparecer na página de histórico');
      
      console.log('\n💡 Para testar:');
      console.log('   1. Acesse a página de histórico de chamados');
      console.log('   2. Procure pelo ticket "Teste de Chat - Ticket Ativo"');
      console.log('   3. Verifique se o botão de chat aparece');
      console.log('   4. Clique no botão para abrir o modal de chat');
    } else {
      console.log('\n❌ ERRO: O ticket não atende aos critérios para chat');
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
      const shouldShowChat = !isClosed && hasAssignee;
      
      console.log(`   - Ticket ${ticket.id}: ${ticket.title}`);
      console.log(`     • Status: ${ticket.status} ${isClosed ? '🔒' : '🟢'}`);
      console.log(`     • Técnico: ${ticket.assignee?.name || 'Não atribuído'}`);
      console.log(`     • Chat: ${shouldShowChat ? '✅ Disponível' : '❌ Não disponível'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar ticket de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createTestTicketForChat();
