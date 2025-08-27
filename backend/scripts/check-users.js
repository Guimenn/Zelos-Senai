import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('🔍 Verificando usuários no banco de dados...');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                is_active: true,
                created_at: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        
        console.log(`\n📊 Total de usuários encontrados: ${users.length}`);
        console.log('\n👥 Lista de usuários:');
        console.log('─'.repeat(80));
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
            console.log(`   Role: "${user.role}" (tamanho: ${user.role.length})`);
            console.log(`   Role em lowercase: "${user.role.toLowerCase()}"`);
            console.log(`   Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Criado em: ${user.created_at.toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // Contar por role
        const roleCount = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        
        console.log('📈 Estatísticas por role:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} usuário(s)`);
        });
        
        // Verificar usuários inativos
        const inactiveUsers = users.filter(user => !user.is_active);
        if (inactiveUsers.length > 0) {
            console.log('\n⚠️ Usuários inativos:');
            inactiveUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar usuários:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
