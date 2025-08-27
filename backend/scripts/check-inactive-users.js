import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkInactiveUsers() {
    try {
        console.log('🔍 Verificando usuários inativos...');
        
        const inactiveUsers = await prisma.user.findMany({
            where: { is_active: false },
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
        
        if (inactiveUsers.length === 0) {
            console.log('✅ Nenhum usuário inativo encontrado');
            return;
        }
        
        console.log(`⚠️ Encontrados ${inactiveUsers.length} usuário(s) inativo(s):`);
        console.log('─'.repeat(80));
        
        inactiveUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Criado em: ${user.created_at.toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // Verificar se há usuários Client inativos
        const inactiveClients = inactiveUsers.filter(user => user.role === 'Client');
        if (inactiveClients.length > 0) {
            console.log('🚨 ATENÇÃO: Usuários Client inativos encontrados:');
            inactiveClients.forEach(user => {
                console.log(`   - ${user.name} (${user.email})`);
            });
            console.log('\n💡 Estes usuários receberão "acesso negado" ao tentar fazer login!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar usuários inativos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkInactiveUsers();
