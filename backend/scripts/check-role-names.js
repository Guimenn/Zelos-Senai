import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkRoleNames() {
    try {
        console.log('🔍 Verificando nomes de roles no banco de dados...');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                is_active: true
            },
            orderBy: {
                role: 'asc'
            }
        });
        
        // Agrupar por role
        const roleGroups = users.reduce((acc, user) => {
            if (!acc[user.role]) {
                acc[user.role] = [];
            }
            acc[user.role].push(user);
            return acc;
        }, {});
        
        console.log('\n📊 Usuários agrupados por role:');
        console.log('─'.repeat(80));
        
        Object.entries(roleGroups).forEach(([role, users]) => {
            console.log(`\n🎭 Role: "${role}" (${users.length} usuário(s))`);
            users.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Ativo: ${user.is_active ? '✅' : '❌'}`);
            });
        });
        
        // Verificar se há roles inesperadas
        const expectedRoles = ['Admin', 'Agent', 'Client'];
        const foundRoles = Object.keys(roleGroups);
        
        console.log('\n🔍 Verificação de roles:');
        console.log('─'.repeat(80));
        console.log('Roles esperadas:', expectedRoles);
        console.log('Roles encontradas:', foundRoles);
        
        const unexpectedRoles = foundRoles.filter(role => !expectedRoles.includes(role));
        if (unexpectedRoles.length > 0) {
            console.log('⚠️ Roles inesperadas encontradas:', unexpectedRoles);
        } else {
            console.log('✅ Todas as roles encontradas são esperadas');
        }
        
        // Verificar se há usuários Client
        const clientUsers = roleGroups['Client'] || [];
        console.log(`\n👥 Usuários Client: ${clientUsers.length}`);
        if (clientUsers.length > 0) {
            console.log('✅ Existem usuários Client no sistema');
        } else {
            console.log('❌ Nenhum usuário Client encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRoleNames();
