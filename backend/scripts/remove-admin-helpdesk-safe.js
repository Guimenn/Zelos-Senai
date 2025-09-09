import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function removeAdminHelpdeskSafe() {
  try {
    console.log('🔍 Removendo admin@helpdesk.com de forma segura...');
    
    const emailToRemove = 'admin@helpdesk.com';
    const emailToTransfer = 'renan.queiroz08sr@gmail.com'; // Transferir para Renan
    
    // Buscar o usuário a ser removido
    const userToRemove = await prisma.user.findUnique({
      where: { email: emailToRemove }
    });

    if (!userToRemove) {
      console.log('⚠️  Usuário admin@helpdesk.com não encontrado no sistema');
      return;
    }

    // Buscar o usuário para transferir os dados
    const userToTransfer = await prisma.user.findUnique({
      where: { email: emailToTransfer }
    });

    if (!userToTransfer) {
      console.log('❌ Usuário de destino não encontrado:', emailToTransfer);
      return;
    }

    console.log('✅ Usuários encontrados:');
    console.log('   - Remover:', userToRemove.name, `(${userToRemove.email})`);
    console.log('   - Transferir para:', userToTransfer.name, `(${userToTransfer.email})`);

    // Verificar dependências
    console.log('\n🔍 Verificando dependências...');
    
    const ticketsCreated = await prisma.ticket.count({
      where: { created_by: userToRemove.id }
    });
    
    const ticketsAssigned = await prisma.ticket.count({
      where: { assigned_to: userToRemove.id }
    });

    console.log('   - Tickets criados:', ticketsCreated);
    console.log('   - Tickets atribuídos:', ticketsAssigned);

    // Transferir tickets criados
    if (ticketsCreated > 0) {
      console.log('\n🔄 Transferindo tickets criados...');
      await prisma.ticket.updateMany({
        where: { created_by: userToRemove.id },
        data: { created_by: userToTransfer.id }
      });
      console.log(`   ✅ ${ticketsCreated} tickets transferidos`);
    }

    // Transferir tickets atribuídos
    if (ticketsAssigned > 0) {
      console.log('\n🔄 Transferindo tickets atribuídos...');
      await prisma.ticket.updateMany({
        where: { assigned_to: userToRemove.id },
        data: { assigned_to: userToTransfer.id }
      });
      console.log(`   ✅ ${ticketsAssigned} tickets transferidos`);
    }

    // Verificar se há outras dependências (mensagens, etc.)
    try {
      const messages = await prisma.message.count({
        where: { user_id: userToRemove.id }
      });
      
      if (messages > 0) {
        console.log('\n🔄 Transferindo mensagens...');
        await prisma.message.updateMany({
          where: { user_id: userToRemove.id },
          data: { user_id: userToTransfer.id }
        });
        console.log(`   ✅ ${messages} mensagens transferidas`);
      }
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir mensagens:', error.message);
    }

    // Agora excluir o usuário
    console.log('\n🗑️  Excluindo usuário admin@helpdesk.com...');
    
    const deletedUser = await prisma.user.delete({
      where: { id: userToRemove.id }
    });

    console.log('✅ Usuário excluído com sucesso!');
    console.log('   - ID removido:', deletedUser.id);
    console.log('   - Email removido:', deletedUser.email);
    console.log('   - Nome removido:', deletedUser.name);

    // Verificar se foi realmente removido
    const verifyUser = await prisma.user.findUnique({
      where: { email: emailToRemove }
    });

    if (!verifyUser) {
      console.log('✅ Confirmação: Usuário foi completamente removido do sistema');
    } else {
      console.log('❌ ERRO: Usuário ainda existe no sistema');
    }

    // Listar administradores restantes
    const remainingAdmins = await prisma.user.findMany({
      where: { role: 'Admin' },
      select: { id: true, name: true, email: true, is_active: true, position: true }
    });

    console.log('\n📊 Administradores restantes no sistema:');
    if (remainingAdmins.length === 0) {
      console.log('   ⚠️  Nenhum administrador encontrado!');
    } else {
      remainingAdmins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} - ${admin.is_active ? '✅ Ativo' : '❌ Inativo'}`);
      });
    }

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('   - admin@helpdesk.com foi removido');
    console.log('   - Dados foram transferidos para renan.queiroz08sr@gmail.com');
    console.log('   - Renan agora é o único Admin Master do sistema');

  } catch (error) {
    console.error('❌ Erro ao remover usuário admin@helpdesk.com:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
removeAdminHelpdeskSafe();
