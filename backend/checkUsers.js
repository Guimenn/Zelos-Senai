import prisma from './prisma/client.js';

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Total de usuários encontrados: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Nome: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
      console.log('');
    });

    // Verificar se há usuários admin
    const adminUsers = users.filter(user => user.role === 'Admin');
    console.log(`👑 Usuários Admin: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('Emails dos admins:');
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
