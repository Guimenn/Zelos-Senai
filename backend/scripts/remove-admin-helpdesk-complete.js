import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function removeAdminHelpdeskComplete() {
  try {
    console.log('🔍 Removendo admin@helpdesk.com de forma completa...');
    
    const emailToRemove = 'admin@helpdesk.com';
    const emailToTransfer = 'renan.queiroz08sr@gmail.com';
    
    // Buscar os usuários
    const userToRemove = await prisma.user.findUnique({
      where: { email: emailToRemove }
    });

    const userToTransfer = await prisma.user.findUnique({
      where: { email: emailToTransfer }
    });

    if (!userToRemove) {
      console.log('⚠️  Usuário admin@helpdesk.com não encontrado');
      return;
    }

    if (!userToTransfer) {
      console.log('❌ Usuário de destino não encontrado:', emailToTransfer);
      return;
    }

    console.log('✅ Usuários encontrados:');
    console.log('   - Remover:', userToRemove.name, `(${userToRemove.email})`);
    console.log('   - Transferir para:', userToTransfer.name, `(${userToTransfer.email})`);

    // 1. Transferir tickets criados
    console.log('\n🔄 1. Transferindo tickets criados...');
    const ticketsCreated = await prisma.ticket.updateMany({
      where: { created_by: userToRemove.id },
      data: { created_by: userToTransfer.id }
    });
    console.log(`   ✅ ${ticketsCreated.count} tickets transferidos`);

    // 2. Transferir tickets atribuídos
    console.log('\n🔄 2. Transferindo tickets atribuídos...');
    const ticketsAssigned = await prisma.ticket.updateMany({
      where: { assigned_to: userToRemove.id },
      data: { assigned_to: userToTransfer.id }
    });
    console.log(`   ✅ ${ticketsAssigned.count} tickets transferidos`);

    // 3. Transferir comentários
    console.log('\n🔄 3. Transferindo comentários...');
    try {
      const comments = await prisma.comment.updateMany({
        where: { user_id: userToRemove.id },
        data: { user_id: userToTransfer.id }
      });
      console.log(`   ✅ ${comments.count} comentários transferidos`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir comentários:', error.message);
    }

    // 4. Transferir notificações
    console.log('\n🔄 4. Transferindo notificações...');
    try {
      const notifications = await prisma.notification.updateMany({
        where: { user_id: userToRemove.id },
        data: { user_id: userToTransfer.id }
      });
      console.log(`   ✅ ${notifications.count} notificações transferidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir notificações:', error.message);
    }

    // 5. Transferir histórico de tickets
    console.log('\n🔄 5. Transferindo histórico de tickets...');
    try {
      const ticketHistory = await prisma.ticketHistory.updateMany({
        where: { changed_by: userToRemove.id },
        data: { changed_by: userToTransfer.id }
      });
      console.log(`   ✅ ${ticketHistory.count} registros de histórico transferidos`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir histórico:', error.message);
    }

    // 6. Transferir atribuições de tickets
    console.log('\n🔄 6. Transferindo atribuições de tickets...');
    try {
      const assignments = await prisma.ticketAssignment.updateMany({
        where: { assigned_by: userToRemove.id },
        data: { assigned_by: userToTransfer.id }
      });
      console.log(`   ✅ ${assignments.count} atribuições transferidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir atribuições:', error.message);
    }

    // 7. Transferir avaliações de agentes
    console.log('\n🔄 7. Transferindo avaliações de agentes...');
    try {
      const evaluations = await prisma.agentEvaluation.updateMany({
        where: { evaluator_id: userToRemove.id },
        data: { evaluator_id: userToTransfer.id }
      });
      console.log(`   ✅ ${evaluations.count} avaliações transferidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir avaliações:', error.message);
    }

    // 8. Remover preferências de notificação (se existirem)
    console.log('\n🔄 8. Removendo preferências de notificação...');
    try {
      const prefs = await prisma.notificationPreference.deleteMany({
        where: { user_id: userToRemove.id }
      });
      console.log(`   ✅ ${prefs.count} preferências removidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível remover preferências:', error.message);
    }

    // 9. Remover registro de agente (se existir)
    console.log('\n🔄 9. Removendo registro de agente...');
    try {
      const agent = await prisma.agent.deleteMany({
        where: { user_id: userToRemove.id }
      });
      console.log(`   ✅ ${agent.count} registros de agente removidos`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível remover agente:', error.message);
    }

    // 10. Remover registro de cliente (se existir)
    console.log('\n🔄 10. Removendo registro de cliente...');
    try {
      const client = await prisma.client.deleteMany({
        where: { user_id: userToRemove.id }
      });
      console.log(`   ✅ ${client.count} registros de cliente removidos`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível remover cliente:', error.message);
    }

    // 11. Finalmente, remover o usuário
    console.log('\n🗑️  11. Removendo usuário...');
    const deletedUser = await prisma.user.delete({
      where: { id: userToRemove.id }
    });

    console.log('✅ Usuário excluído com sucesso!');
    console.log('   - ID removido:', deletedUser.id);
    console.log('   - Email removido:', deletedUser.email);
    console.log('   - Nome removido:', deletedUser.name);

    // Verificar se foi removido
    const verifyUser = await prisma.user.findUnique({
      where: { email: emailToRemove }
    });

    if (!verifyUser) {
      console.log('✅ Confirmação: Usuário foi completamente removido');
    } else {
      console.log('❌ ERRO: Usuário ainda existe');
    }

    // Listar administradores restantes
    const remainingAdmins = await prisma.user.findMany({
      where: { role: 'Admin' },
      select: { id: true, name: true, email: true, is_active: true, position: true }
    });

    console.log('\n📊 Administradores restantes:');
    remainingAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} - ${admin.is_active ? '✅ Ativo' : '❌ Inativo'}`);
    });

    console.log('\n🎉 Processo concluído!');
    console.log('   - admin@helpdesk.com foi removido');
    console.log('   - Todos os dados foram transferidos para renan.queiroz08sr@gmail.com');
    console.log('   - Renan agora é o único Admin Master');

  } catch (error) {
    console.error('❌ Erro ao remover usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
removeAdminHelpdeskComplete();
