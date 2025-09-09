import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function debugChatVisibility() {
  try {
    console.log('🔍 Investigando por que os botões de chat não aparecem na página de histórico...');
    
    // Buscar todos os tickets
    const tickets = await prisma.ticket.findMany({
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

    console.log(`\n📊 Total de tickets encontrados: ${tickets.length}`);
    
    let ticketsWithChat = 0;
    let ticketsWithoutChat = 0;
    
    for (const ticket of tickets) {
      console.log(`\n📋 Ticket ${ticket.id}:`);
      console.log(`   - Título: ${ticket.title}`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - Criado por: ${ticket.creator?.name} (${ticket.creator?.role})`);
      console.log(`   - Atribuído para: ${ticket.assignee?.name || 'Não atribuído'} (${ticket.assignee?.role || 'N/A'})`);
      
      // Verificar condições para chat
      const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(ticket.status);
      const hasAssignee = !!ticket.assignee;
      
      console.log(`   - Status fechado? ${isClosed ? '❌ SIM' : '✅ NÃO'}`);
      console.log(`   - Tem técnico atribuído? ${hasAssignee ? '✅ SIM' : '❌ NÃO'}`);
      
      // Determinar se o chat deveria aparecer
      const shouldShowChat = !isClosed && hasAssignee;
      console.log(`   - Chat deveria aparecer? ${shouldShowChat ? '✅ SIM' : '❌ NÃO'}`);
      
      if (shouldShowChat) {
        ticketsWithChat++;
        console.log(`   - 💬 Chat disponível entre:`);
        console.log(`     • ${ticket.creator.name} (${ticket.creator.role})`);
        console.log(`     • ${ticket.assignee.name} (${ticket.assignee.role})`);
      } else {
        ticketsWithoutChat++;
        if (isClosed) {
          console.log(`   - ❌ Motivo: Ticket fechado (${ticket.status})`);
        } else if (!hasAssignee) {
          console.log(`   - ❌ Motivo: Nenhum técnico atribuído`);
        }
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   - Tickets com chat disponível: ${ticketsWithChat}`);
    console.log(`   - Tickets sem chat: ${ticketsWithoutChat}`);
    console.log(`   - Total: ${tickets.length}`);

    // Verificar se há tickets que deveriam ter chat mas não têm
    const ticketsThatShouldHaveChat = tickets.filter(t => 
      !['Closed', 'Cancelled', 'Resolved'].includes(t.status) && !!t.assignee
    );

    console.log(`\n💬 Tickets que deveriam ter botão de chat:`);
    if (ticketsThatShouldHaveChat.length === 0) {
      console.log(`   - Nenhum ticket atende aos critérios para chat`);
      console.log(`   - Todos os tickets estão fechados ou sem técnico atribuído`);
    } else {
      ticketsThatShouldHaveChat.forEach(ticket => {
        console.log(`   - Ticket ${ticket.id}: ${ticket.title} (${ticket.status})`);
        console.log(`     • Criador: ${ticket.creator.name} (${ticket.creator.role})`);
        console.log(`     • Técnico: ${ticket.assignee.name} (${ticket.assignee.role})`);
      });
    }

    // Verificar tickets fechados
    const closedTickets = tickets.filter(t => 
      ['Closed', 'Cancelled', 'Resolved'].includes(t.status)
    );

    console.log(`\n🔒 Tickets fechados (chat não disponível):`);
    if (closedTickets.length === 0) {
      console.log(`   - Nenhum ticket fechado`);
    } else {
      closedTickets.forEach(ticket => {
        console.log(`   - Ticket ${ticket.id}: ${ticket.title} (${ticket.status})`);
      });
    }

    // Verificar tickets sem técnico
    const ticketsWithoutTechnician = tickets.filter(t => 
      !t.assignee && !['Closed', 'Cancelled', 'Resolved'].includes(t.status)
    );

    console.log(`\n👤 Tickets sem técnico atribuído:`);
    if (ticketsWithoutTechnician.length === 0) {
      console.log(`   - Todos os tickets ativos têm técnico atribuído`);
    } else {
      ticketsWithoutTechnician.forEach(ticket => {
        console.log(`   - Ticket ${ticket.id}: ${ticket.title} (${ticket.status})`);
        console.log(`     • Criador: ${ticket.creator.name} (${ticket.creator.role})`);
      });
    }

    console.log(`\n💡 Conclusão:`);
    if (ticketsWithChat === 0) {
      console.log(`   - ❌ Nenhum ticket atende aos critérios para mostrar botão de chat`);
      console.log(`   - Isso explica por que os botões não aparecem na página de histórico`);
      console.log(`   - Para testar o chat, é necessário:`);
      console.log(`     1. Ter tickets com status diferente de Closed/Cancelled/Resolved`);
      console.log(`     2. Ter técnicos atribuídos a esses tickets`);
    } else {
      console.log(`   - ✅ ${ticketsWithChat} tickets deveriam mostrar botão de chat`);
      console.log(`   - Se os botões não aparecem, pode ser um problema de implementação`);
    }

  } catch (error) {
    console.error('❌ Erro ao investigar visibilidade do chat:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o debug
debugChatVisibility();
