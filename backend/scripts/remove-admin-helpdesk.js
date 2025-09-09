import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function removeAdminHelpdesk() {
  try {
    console.log('🔍 Verificando usuário admin@helpdesk.com...');
    
    const email = 'admin@helpdesk.com';
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('⚠️  Usuário admin@helpdesk.com não encontrado no sistema');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Nome:', user.name);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Ativo:', user.is_active);

    // Verificar se há dependências (tickets, mensagens, etc.)
    console.log('\n🔍 Verificando dependências...');
    
    try {
      // Verificar tickets criados
      const ticketsCreated = await prisma.ticket.count({
        where: { created_by: user.id }
      });
      
      // Verificar tickets atribuídos
      const ticketsAssigned = await prisma.ticket.count({
        where: { assigned_to: user.id }
      });

      console.log('   - Tickets criados:', ticketsCreated);
      console.log('   - Tickets atribuídos:', ticketsAssigned);

      if (ticketsCreated > 0 || ticketsAssigned > 0) {
        console.log('⚠️  ATENÇÃO: O usuário tem dependências no sistema!');
        console.log('   Continuando com a exclusão...');
      }
    } catch (error) {
      console.log('   ⚠️  Não foi possível verificar dependências:', error.message);
      console.log('   Continuando com a exclusão...');
    }

    // Excluir o usuário
    console.log('\n🗑️  Excluindo usuário admin@helpdesk.com...');
    
    const deletedUser = await prisma.user.delete({
      where: { id: user.id }
    });

    console.log('✅ Usuário excluído com sucesso!');
    console.log('   - ID removido:', deletedUser.id);
    console.log('   - Email removido:', deletedUser.email);
    console.log('   - Nome removido:', deletedUser.name);

    // Verificar se foi realmente removido
    const verifyUser = await prisma.user.findUnique({
      where: { email }
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

  } catch (error) {
    console.error('❌ Erro ao excluir usuário admin@helpdesk.com:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
removeAdminHelpdesk();
