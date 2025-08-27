import prisma from '../prisma/client.js';

async function testClientEditPermission() {
    try {
        console.log('🧪 Testando permissão de edição do cliente em tickets atribuídos...\n');

        // Buscar tickets atribuídos ao cliente 'cleisson'
        const assignedTickets = await prisma.ticket.findMany({
            where: {
                assigned_to: { not: null },
                client: {
                    user: {
                        name: { contains: 'cleisson', mode: 'insensitive' }
                    }
                }
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        console.log(`📋 Tickets atribuídos ao cliente cleisson: ${assignedTickets.length}\n`);

        assignedTickets.forEach((ticket, index) => {
            console.log(`🎫 Ticket ${index + 1}:`);
            console.log(`  ID: ${ticket.id}`);
            console.log(`  Número: ${ticket.ticket_number}`);
            console.log(`  Título: ${ticket.title}`);
            console.log(`  Status: ${ticket.status}`);
            console.log(`  Assigned_to: ${ticket.assigned_to}`);
            console.log(`  Assignee: ${ticket.assignee?.name || 'N/A'}`);
            console.log(`  Cliente: ${ticket.client?.user?.name || 'N/A'}`);
            console.log(`  Cliente ID: ${ticket.client?.user?.id || 'N/A'}`);
            
            // Simular a lógica do frontend
            const canEdit = !!ticket && !ticket.assigned_to && (ticket.client?.user?.id === ticket.client?.user?.id);
            console.log(`  🔍 Lógica canEdit: ${canEdit}`);
            console.log(`    - ticket existe: ${!!ticket}`);
            console.log(`    - assigned_to é null: ${!ticket.assigned_to}`);
            console.log(`    - client user id match: ${ticket.client?.user?.id === ticket.client?.user?.id}`);
            console.log('');
        });

        // Simular uma tentativa de edição via API
        if (assignedTickets.length > 0) {
            const testTicket = assignedTickets[0];
            console.log(`🔧 Simulando tentativa de edição do ticket ${testTicket.ticket_number}...`);
            
            // Simular dados de edição
            const updateData = {
                title: 'Título modificado pelo cliente',
                description: 'Descrição modificada pelo cliente'
            };

            console.log('📝 Dados de edição:', updateData);
            console.log('🔒 Ticket deveria ser bloqueado porque:');
            console.log(`  - assigned_to: ${testTicket.assigned_to} (não é null)`);
            console.log(`  - Status: ${testTicket.status}`);
            console.log(`  - Assignee: ${testTicket.assignee?.name}`);
        }

        // Verificar se há algum ticket com assigned_to mas status ainda 'Open'
        const openAssignedTickets = await prisma.ticket.findMany({
            where: {
                assigned_to: { not: null },
                status: 'Open'
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (openAssignedTickets.length > 0) {
            console.log('\n⚠️ Tickets com assigned_to mas status ainda "Open":');
            openAssignedTickets.forEach(ticket => {
                console.log(`  - ${ticket.ticket_number}: ${ticket.title} (Assignee: ${ticket.assignee?.name})`);
            });
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testClientEditPermission();
