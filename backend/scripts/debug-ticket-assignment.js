import prisma from '../prisma/client.js';

async function debugTicketAssignment() {
    try {
        console.log('🔍 Debug: Verificando estado dos tickets e atribuições...\n');

        // Buscar todos os tickets com suas relações
        const tickets = await prisma.ticket.findMany({
            include: {
                category: true,
                subcategory: true,
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
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        console.log(`📋 Total de tickets encontrados: ${tickets.length}\n`);

        tickets.forEach((ticket, index) => {
            console.log(`🎫 Ticket ${index + 1}:`);
            console.log(`  ID: ${ticket.id}`);
            console.log(`  Número: ${ticket.ticket_number}`);
            console.log(`  Título: ${ticket.title}`);
            console.log(`  Status: ${ticket.status}`);
            console.log(`  Prioridade: ${ticket.priority}`);
            console.log(`  Assigned_to (campo direto): ${ticket.assigned_to}`);
            console.log(`  Assignee (relação): ${ticket.assignee ? ticket.assignee.name : 'Nenhum'}`);
            console.log(`  Cliente: ${ticket.client?.user?.name || 'N/A'}`);
            console.log(`  Criador: ${ticket.creator?.name || 'N/A'}`);
            console.log(`  Categoria: ${ticket.category?.name || 'N/A'}`);
            console.log(`  Criado em: ${ticket.created_at}`);
            console.log(`  Atualizado em: ${ticket.updated_at}`);
            
            // Verificar se há inconsistência entre assigned_to e assignee
            if (ticket.assigned_to && !ticket.assignee) {
                console.log(`  ⚠️ INCONSISTÊNCIA: assigned_to=${ticket.assigned_to} mas assignee é null`);
            } else if (!ticket.assigned_to && ticket.assignee) {
                console.log(`  ⚠️ INCONSISTÊNCIA: assigned_to é null mas assignee=${ticket.assignee.name}`);
            }
            
            console.log('');
        });

        // Verificar tickets que estão atribuídos mas ainda permitem edição
        const assignedTickets = tickets.filter(t => t.assigned_to);
        console.log(`🔒 Tickets atribuídos: ${assignedTickets.length}`);
        
        if (assignedTickets.length > 0) {
            console.log('\n📋 Tickets que deveriam bloquear edição do cliente:');
            assignedTickets.forEach(ticket => {
                console.log(`  - ${ticket.ticket_number}: ${ticket.title} (Cliente: ${ticket.client?.user?.name})`);
            });
        }

        // Verificar se há tickets com status 'InProgress' mas sem assigned_to
        const inProgressWithoutAssignment = tickets.filter(t => t.status === 'InProgress' && !t.assigned_to);
        if (inProgressWithoutAssignment.length > 0) {
            console.log('\n⚠️ Tickets com status InProgress mas sem assigned_to:');
            inProgressWithoutAssignment.forEach(ticket => {
                console.log(`  - ${ticket.ticket_number}: ${ticket.title}`);
            });
        }

        // Verificar histórico de atribuições
        console.log('\n📋 Histórico de atribuições:');
        const assignmentHistory = await prisma.ticketHistory.findMany({
            where: {
                field_name: 'assigned_to'
            },
            include: {
                ticket: {
                    select: {
                        ticket_number: true,
                        title: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        assignmentHistory.forEach(history => {
            console.log(`  ${history.ticket.ticket_number}: ${history.old_value || 'null'} → ${history.new_value || 'null'} (${history.created_at})`);
        });

    } catch (error) {
        console.error('❌ Erro no debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugTicketAssignment();
