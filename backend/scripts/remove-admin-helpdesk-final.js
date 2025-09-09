import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function removeAdminHelpdeskFinal() {
  try {
    console.log('🔍 Removendo admin@helpdesk.com de forma definitiva...');
    
    const emailToRemove = 'admin@helpdesk.com';
    const emailToTransfer = 'renan.queiroz08sr@gmail.com';
    
    // Buscar os usuários
    const userToRemove = await prisma.user.findUnique({
      where: { email: emailToRemove },
      include: { client: true }
    });

    const userToTransfer = await prisma.user.findUnique({
      where: { email: emailToTransfer },
      include: { client: true }
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

    // Se o usuário a ser removido tem um registro de cliente
    if (userToRemove.client) {
      console.log('\n🔄 Transferindo registro de cliente...');
      
      // Se o usuário de destino não tem registro de cliente, criar um
      if (!userToTransfer.client) {
        console.log('   - Criando registro de cliente para o usuário de destino...');
        await prisma.client.create({
          data: {
            user_id: userToTransfer.id,
            company: userToRemove.client.company,
            client_type: userToRemove.client.client_type,
            address: userToRemove.client.address,
            admission_date: userToRemove.client.admission_date,
            birth_date: userToRemove.client.birth_date,
            contract_type: userToRemove.client.contract_type,
            cpf: userToRemove.client.cpf,
            department: userToRemove.client.department,
            education_field: userToRemove.client.education_field,
            employee_id: userToRemove.client.employee_id,
            job_title: userToRemove.client.job_title,
            manager: userToRemove.client.manager,
            salary: userToRemove.client.salary,
            work_schedule: userToRemove.client.work_schedule
          }
        });
        console.log('   ✅ Registro de cliente criado');
      }

      // Buscar o registro de cliente do usuário de destino (recém-criado)
      const updatedUserToTransfer = await prisma.user.findUnique({
        where: { email: emailToTransfer },
        include: { client: true }
      });

      // Transferir todos os tickets que referenciam o cliente
      console.log('   - Transferindo tickets do cliente...');
      const ticketsTransferred = await prisma.ticket.updateMany({
        where: { client_id: userToRemove.client.id },
        data: { client_id: updatedUserToTransfer.client.id }
      });
      console.log(`   ✅ ${ticketsTransferred.count} tickets transferidos`);

      // Agora remover o registro de cliente
      console.log('   - Removendo registro de cliente...');
      await prisma.client.delete({
        where: { id: userToRemove.client.id }
      });
      console.log('   ✅ Registro de cliente removido');
    }

    // Transferir outras dependências
    console.log('\n🔄 Transferindo outras dependências...');
    
    // Transferir tickets criados
    const ticketsCreated = await prisma.ticket.updateMany({
      where: { created_by: userToRemove.id },
      data: { created_by: userToTransfer.id }
    });
    console.log(`   ✅ ${ticketsCreated.count} tickets criados transferidos`);

    // Transferir tickets atribuídos
    const ticketsAssigned = await prisma.ticket.updateMany({
      where: { assigned_to: userToRemove.id },
      data: { assigned_to: userToTransfer.id }
    });
    console.log(`   ✅ ${ticketsAssigned.count} tickets atribuídos transferidos`);

    // Transferir notificações
    try {
      const notifications = await prisma.notification.updateMany({
        where: { user_id: userToRemove.id },
        data: { user_id: userToTransfer.id }
      });
      console.log(`   ✅ ${notifications.count} notificações transferidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir notificações:', error.message);
    }

    // Transferir histórico de tickets
    try {
      const ticketHistory = await prisma.ticketHistory.updateMany({
        where: { changed_by: userToRemove.id },
        data: { changed_by: userToTransfer.id }
      });
      console.log(`   ✅ ${ticketHistory.count} registros de histórico transferidos`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir histórico:', error.message);
    }

    // Transferir avaliações de agentes
    try {
      const evaluations = await prisma.agentEvaluation.updateMany({
        where: { evaluator_id: userToRemove.id },
        data: { evaluator_id: userToTransfer.id }
      });
      console.log(`   ✅ ${evaluations.count} avaliações transferidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível transferir avaliações:', error.message);
    }

    // Remover preferências de notificação
    try {
      const prefs = await prisma.notificationPreference.deleteMany({
        where: { user_id: userToRemove.id }
      });
      console.log(`   ✅ ${prefs.count} preferências removidas`);
    } catch (error) {
      console.log('   ⚠️  Não foi possível remover preferências:', error.message);
    }

    // Finalmente, remover o usuário
    console.log('\n🗑️  Removendo usuário...');
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

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('   - admin@helpdesk.com foi completamente removido');
    console.log('   - Todos os dados foram transferidos para renan.queiroz08sr@gmail.com');
    console.log('   - Renan agora é o único Admin Master do sistema');

  } catch (error) {
    console.error('❌ Erro ao remover usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
removeAdminHelpdeskFinal();
