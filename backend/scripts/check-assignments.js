import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAssignments() {
    try {
        console.log('🔍 Verificando assignment requests...');
        
        // Verificar tickets
        const tickets = await prisma.ticket.findMany({
            include: {
                category: true,
                subcategory: true
            }
        });
        
        console.log(`📋 Tickets encontrados: ${tickets.length}`);
        tickets.forEach(t => {
            console.log(`- #${t.ticket_number}: ${t.title} (${t.category.name}) - Status: ${t.status} - Assigned: ${t.assigned_to || 'Nenhum'}`);
        });
        
        // Verificar assignment requests
        const requests = await prisma.ticketAssignmentRequest.findMany({
            include: {
                ticket: {
                    include: {
                        category: true
                    }
                },
                agent: {
                    include: {
                        user: true
                    }
                }
            }
        });
        
        console.log(`\n📋 Assignment requests encontrados: ${requests.length}`);
        requests.forEach(r => {
            console.log(`- Request #${r.id}: Ticket #${r.ticket.ticket_number} -> ${r.agent.user.name} (${r.status})`);
        });
        
        // Se não há requests, criar alguns
        if (requests.length === 0 && tickets.length > 0) {
            console.log('\n🔧 Criando assignment requests...');
            
            for (const ticket of tickets) {
                if (ticket.status === 'Open' && !ticket.assigned_to) {
                    // Buscar agentes para a categoria do ticket
                    const agentsInCategory = await prisma.agentCategory.findMany({
                        where: { category_id: ticket.category_id },
                        include: {
                            agent: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    });
                    
                    console.log(`📝 Criando requests para ticket #${ticket.ticket_number} (${agentsInCategory.length} agentes)`);
                    
                    for (const agentCategory of agentsInCategory) {
                        const request = await prisma.ticketAssignmentRequest.create({
                            data: {
                                ticket_id: ticket.id,
                                agent_id: agentCategory.agent_id
                            },
                            include: {
                                agent: {
                                    include: {
                                        user: true
                                    }
                                },
                                ticket: {
                                    include: {
                                        category: true
                                    }
                                }
                            }
                        });
                        
                        console.log(`✅ Request criado: Ticket #${request.ticket.ticket_number} -> ${request.agent.user.name}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAssignments();
