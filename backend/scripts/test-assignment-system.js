import prisma from '../prisma/client.js';

async function testAssignmentSystem() {
    try {
        console.log('🧪 Iniciando teste do sistema de atribuição...');

        // 1. Criar um usuário agente
        const timestamp = Date.now();
        const agentUser = await prisma.user.create({
            data: {
                name: 'Técnico Teste',
                email: `tecnico${timestamp}@teste.com`,
                phone: '11999999999',
                hashed_password: '$2b$10$test', // Senha: 123456
                role: 'Agent',
                is_active: true
            }
        });

        console.log('✅ Usuário agente criado:', agentUser.id);

        // 2. Criar o agente
        const agent = await prisma.agent.create({
            data: {
                user_id: agentUser.id,
                employee_id: `TEC${timestamp}`,
                department: 'TI',
                skills: ['Manutenção', 'Suporte'],
                max_tickets: 5
            }
        });

        console.log('✅ Agente criado:', agent.id);

        // 3. Criar uma categoria
        const category = await prisma.category.create({
            data: {
                name: `Manutenção de Equipamentos ${timestamp}`,
                description: 'Problemas com equipamentos',
                color: '#3B82F6'
            }
        });

        console.log('✅ Categoria criada:', category.id);

        // 4. Associar o agente à categoria
        const agentCategory = await prisma.agentCategory.create({
            data: {
                agent_id: agent.id,
                category_id: category.id
            }
        });

        console.log('✅ Agente associado à categoria:', agentCategory.id);

        // 5. Criar um cliente
        const clientUser = await prisma.user.create({
            data: {
                name: 'Cliente Teste',
                email: `cliente${timestamp}@teste.com`,
                phone: '11888888888',
                hashed_password: '$2b$10$test', // Senha: 123456
                role: 'Client',
                is_active: true
            }
        });

        console.log('✅ Usuário cliente criado:', clientUser.id);

        const client = await prisma.client.create({
            data: {
                user_id: clientUser.id,
                department: 'Produção',
                position: 'Operador'
            }
        });

        console.log('✅ Cliente criado:', client.id);

        // 6. Simular criação de ticket usando a API manualmente
        console.log('🎫 Simulando criação de ticket através do controller...');
        
        // Primeiro, vamos criar o ticket e verificar se as solicitações são criadas
        const ticket = await prisma.ticket.create({
            data: {
                ticket_number: `TKT-TEST-${timestamp}`,
                title: 'Equipamento não liga',
                description: 'O computador da linha de produção não está ligando',
                priority: 'High',
                status: 'Open',
                category_id: category.id,
                client_id: client.id,
                created_by: clientUser.id
            },
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
            }
        });

        console.log('✅ Ticket criado:', ticket.id);

        // 7. Agora executar a lógica de criação de solicitações manualmente
        console.log(`🔍 Executando lógica de atribuição para categoria ${ticket.category_id}...`);
        
        // Buscar agentes que trabalham com essa categoria
        const agentsInCategory = await prisma.agentCategory.findMany({
            where: { category_id: ticket.category_id },
            include: {
                agent: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`📋 Encontrados ${agentsInCategory.length} agentes para a categoria ${ticket.category_id}`);

        let createdRequests = 0;
        if (agentsInCategory.length > 0) {
            // Criar solicitações de atribuição para cada agente
            for (const agentCategory of agentsInCategory) {
                console.log(`📝 Criando solicitação para agente ${agentCategory.agent.user.name}...`);
                
                await prisma.ticketAssignmentRequest.create({
                    data: {
                        ticket_id: ticket.id,
                        agent_id: agentCategory.agent_id
                    }
                });
                createdRequests++;
            }

            console.log(`✅ ${agentsInCategory.length} solicitações de atribuição criadas para o ticket ${ticket.ticket_number}`);
        } else {
            console.log(`⚠️ Nenhum agente encontrado para a categoria ${ticket.category_id}`);
        }

        // 8. Verificar se as solicitações de atribuição foram criadas
        const assignmentRequests = await prisma.ticketAssignmentRequest.findMany({
            where: { ticket_id: ticket.id },
            include: {
                agent: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                ticket: {
                    include: {
                        category: true
                    }
                }
            }
        });

        console.log('📋 Solicitações de atribuição verificadas:');
        assignmentRequests.forEach((request, index) => {
            console.log(`  ${index + 1}. Agente: ${request.agent.user.name} - Status: ${request.status}`);
        });

        // 9. Simular aceitação de uma solicitação
        if (assignmentRequests.length > 0) {
            const requestToAccept = assignmentRequests[0];
            
            const [updatedRequest, updatedTicket] = await prisma.$transaction([
                prisma.ticketAssignmentRequest.update({
                    where: { id: requestToAccept.id },
                    data: {
                        status: 'Accepted',
                        responded_at: new Date(),
                        response_note: 'Aceito para teste'
                    }
                }),
                prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        assigned_to: requestToAccept.agent.user.id,
                        status: 'InProgress'
                    }
                })
            ]);

            console.log('✅ Solicitação aceita:', updatedRequest.id);
            console.log('✅ Ticket atualizado:', updatedTicket.id);
        }

        console.log('\n🎉 Teste concluído com sucesso!');
        console.log('\n📊 Resumo:');
        console.log(`- Usuário Agente: ${agentUser.email}`);
        console.log(`- Usuário Cliente: ${clientUser.email}`);
        console.log(`- Categoria: ${category.name}`);
        console.log(`- Ticket: ${ticket.ticket_number}`);
        console.log(`- Solicitações criadas: ${assignmentRequests.length}`);

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAssignmentSystem();
