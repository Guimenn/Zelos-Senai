import prisma from './prisma/client.js';

async function checkMessages() {
    try {
        console.log('🔧 Verificando mensagens no banco Prisma...\n');

        // Verificar total de mensagens
        const totalMessages = await prisma.message.count();
        console.log(`📋 Total de mensagens encontradas: ${totalMessages}\n`);

        if (totalMessages > 0) {
            // Buscar as últimas 10 mensagens
            const messages = await prisma.message.findMany({
                orderBy: {
                    created_at: 'desc'
                },
                take: 10,
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            console.log('📝 Últimas 10 mensagens:');
            messages.forEach((msg, index) => {
                console.log(`   ${index + 1}. ID: ${msg.id} | Ticket: ${msg.ticket_id} | Sender: ${msg.sender?.name || 'N/A'} | Content: ${msg.content || 'N/A'} | Data: ${msg.created_at}`);
            });

            // Verificar mensagens do ticket 15
            const ticket15Messages = await prisma.message.findMany({
                where: {
                    ticket_id: 15
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 5
            });

            console.log(`\n🎫 Mensagens do ticket 15: ${ticket15Messages.length}`);
            ticket15Messages.forEach((msg, index) => {
                console.log(`   ${index + 1}. ID: ${msg.id} | Content: ${msg.content || 'N/A'} | Data: ${msg.created_at}`);
            });
        }

        console.log('\n✅ Verificação concluída!');
    } catch (error) {
        console.error('❌ Erro ao verificar mensagens:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMessages();
