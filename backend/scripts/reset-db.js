import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log('🧹 Limpando banco de dados...');
        
        // Limpar dados em ordem de dependência
        await prisma.ticketAssignmentRequest.deleteMany({});
        await prisma.ticketAssignment.deleteMany({});
        await prisma.ticketHistory.deleteMany({});
        await prisma.comment.deleteMany({});
        await prisma.attachment.deleteMany({});
        await prisma.ticket.deleteMany({});
        await prisma.agentCategory.deleteMany({});
        await prisma.subcategory.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.sLA.deleteMany({});
        await prisma.responseTemplate.deleteMany({});
        await prisma.agent.deleteMany({});
        await prisma.client.deleteMany({});
        await prisma.user.deleteMany({});
        
        console.log('✅ Banco de dados limpo com sucesso!');
        
        // Executar seed
        console.log('🌱 Executando seed...');
        const { execSync } = await import('child_process');
        execSync('node scripts/seed-helpdesk.js', { stdio: 'inherit' });
        
    } catch (error) {
        console.error('❌ Erro durante reset:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
