import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testRenanAdminMaster() {
  try {
    console.log('🔍 Testando permissões de Admin Master para renan.queiroz08sr@gmail.com...');
    
    const email = 'renan.queiroz08sr@gmail.com';
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Nome:', user.name);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Ativo:', user.is_active);
    console.log('   - Position:', user.position);

    // Verificar se tem role Admin
    if (user.role === 'Admin') {
      console.log('✅ Role Admin confirmado');
    } else {
      console.log('❌ Role não é Admin:', user.role);
    }

    // Verificar se está ativo
    if (user.is_active) {
      console.log('✅ Usuário está ativo');
    } else {
      console.log('❌ Usuário está inativo');
    }

    // Verificar se tem position de Admin Master
    if (user.position === 'Administrador Master') {
      console.log('✅ Position Admin Master confirmado');
    } else {
      console.log('⚠️  Position não é Admin Master:', user.position);
    }

    // Simular verificação de admin master (como no middleware)
    const adminMasterEmails = ['admin@helpdesk.com', 'renan.queiroz08sr@gmail.com'];
    const isAdminMaster = adminMasterEmails.includes(user.email);
    
    if (isAdminMaster) {
      console.log('🎉 SUCESSO! Usuário é reconhecido como Admin Master');
      console.log('📋 Funcionalidades disponíveis:');
      console.log('   - Criar novos administradores');
      console.log('   - Deletar administradores');
      console.log('   - Acessar todas as funcionalidades administrativas');
      console.log('   - Gerenciar usuários do sistema');
    } else {
      console.log('❌ ERRO! Usuário NÃO é reconhecido como Admin Master');
    }

    // Verificar se há outros admins no sistema
    const allAdmins = await prisma.user.findMany({
      where: { role: 'Admin' },
      select: { id: true, name: true, email: true, is_active: true, position: true }
    });

    console.log('\n📊 Todos os administradores no sistema:');
    allAdmins.forEach(admin => {
      const isMaster = adminMasterEmails.includes(admin.email);
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} ${isMaster ? '👑 MASTER' : ''} - ${admin.is_active ? '✅ Ativo' : '❌ Inativo'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar admin master:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testRenanAdminMaster();
