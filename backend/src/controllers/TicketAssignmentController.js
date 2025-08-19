import prisma from '../../prisma/client.js';
import notificationService from '../services/NotificationService.js';

// Controller para criar solicitações de atribuição quando um ticket é criado
async function createAssignmentRequestsController(req, res) {
    try {
        const { ticket_id } = req.params;

        // Buscar o ticket com categoria e subcategoria
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticket_id) },
            include: {
                category: true,
                subcategory: true
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket não encontrado' });
        }

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

        if (agentsInCategory.length === 0) {
            return res.status(404).json({ 
                message: 'Nenhum agente encontrado para esta categoria',
                category: ticket.category.name
            });
        }

        // Criar solicitações de atribuição para cada agente
        const assignmentRequests = [];
        for (const agentCategory of agentsInCategory) {
            // Verificar se já existe uma solicitação para este agente e ticket
            const existingRequest = await prisma.ticketAssignmentRequest.findUnique({
                where: {
                    ticket_id_agent_id: {
                        ticket_id: ticket.id,
                        agent_id: agentCategory.agent_id
                    }
                }
            });

            if (!existingRequest) {
                const request = await prisma.ticketAssignmentRequest.create({
                    data: {
                        ticket_id: ticket.id,
                        agent_id: agentCategory.agent_id
                    },
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
                                category: true,
                                subcategory: true
                            }
                        }
                    }
                });

                assignmentRequests.push(request);

                // Enviar notificação para o agente
                try {
                    await notificationService.notifyAssignmentRequest(request);
                } catch (notificationError) {
                    console.error('Erro ao enviar notificação de solicitação:', notificationError);
                }
            }
        }

        return res.status(201).json({
            message: `${assignmentRequests.length} solicitações de atribuição criadas`,
            requests: assignmentRequests
        });

    } catch (error) {
        console.error('Erro ao criar solicitações de atribuição:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Controller para listar solicitações pendentes de um agente
async function getPendingRequestsController(req, res) {
    try {
        const agentId = req.user.agent?.id;

        if (!agentId) {
            return res.status(403).json({ message: 'Acesso negado. Apenas agentes podem acessar este recurso.' });
        }

        const requests = await prisma.ticketAssignmentRequest.findMany({
            where: {
                agent_id: agentId,
                status: 'Pending'
            },
            include: {
                ticket: {
                    include: {
                        category: true,
                        subcategory: true,
                        client: {
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
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                requested_at: 'desc'
            }
        });

        return res.status(200).json(requests);

    } catch (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Controller para aceitar uma solicitação de atribuição
async function acceptAssignmentRequestController(req, res) {
    try {
        const { request_id } = req.params;
        const { response_note } = req.body;
        const agentId = req.user.agent?.id;

        if (!agentId) {
            return res.status(403).json({ message: 'Acesso negado. Apenas agentes podem acessar este recurso.' });
        }

        // Buscar a solicitação
        const request = await prisma.ticketAssignmentRequest.findUnique({
            where: { id: parseInt(request_id) },
            include: {
                ticket: true,
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

        if (!request) {
            return res.status(404).json({ message: 'Solicitação não encontrada' });
        }

        if (request.agent_id !== agentId) {
            return res.status(403).json({ message: 'Você só pode aceitar suas próprias solicitações' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Esta solicitação já foi respondida' });
        }

        // Verificar se o ticket ainda está disponível
        if (request.ticket.status !== 'Open') {
            return res.status(400).json({ message: 'Este ticket não está mais disponível para atribuição' });
        }

        // Verificar se o agente não excedeu o limite de tickets
        const currentTickets = await prisma.ticket.count({
            where: {
                assigned_to: request.agent.user.id,
                status: {
                    in: ['Open', 'InProgress', 'WaitingForClient', 'WaitingForThirdParty']
                }
            }
        });

        if (currentTickets >= request.agent.max_tickets) {
            return res.status(400).json({ 
                message: `Você já possui ${currentTickets} tickets ativos. Limite máximo: ${request.agent.max_tickets}` 
            });
        }

        // Aceitar a solicitação e atribuir o ticket
        const [updatedRequest, updatedTicket] = await prisma.$transaction([
            prisma.ticketAssignmentRequest.update({
                where: { id: parseInt(request_id) },
                data: {
                    status: 'Accepted',
                    responded_at: new Date(),
                    response_note: response_note || 'Aceito pelo agente'
                }
            }),
            prisma.ticket.update({
                where: { id: request.ticket_id },
                data: {
                    assigned_to: request.agent.user.id,
                    status: 'InProgress'
                }
            })
        ]);

        // Rejeitar todas as outras solicitações pendentes para este ticket
        await prisma.ticketAssignmentRequest.updateMany({
            where: {
                ticket_id: request.ticket_id,
                status: 'Pending',
                id: { not: parseInt(request_id) }
            },
            data: {
                status: 'Rejected',
                responded_at: new Date(),
                response_note: 'Rejeitado automaticamente - ticket aceito por outro agente'
            }
        });

        // Enviar notificação sobre a aceitação
        try {
            await notificationService.notifyAssignmentAccepted(updatedRequest, updatedTicket);
        } catch (notificationError) {
            console.error('Erro ao enviar notificação de aceitação:', notificationError);
        }

        return res.status(200).json({
            message: 'Solicitação aceita com sucesso',
            request: updatedRequest,
            ticket: updatedTicket
        });

    } catch (error) {
        console.error('Erro ao aceitar solicitação:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Controller para recusar uma solicitação de atribuição
async function rejectAssignmentRequestController(req, res) {
    try {
        const { request_id } = req.params;
        const { response_note } = req.body;
        const agentId = req.user.agent?.id;

        if (!agentId) {
            return res.status(403).json({ message: 'Acesso negado. Apenas agentes podem acessar este recurso.' });
        }

        // Buscar a solicitação
        const request = await prisma.ticketAssignmentRequest.findUnique({
            where: { id: parseInt(request_id) },
            include: {
                ticket: true
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Solicitação não encontrada' });
        }

        if (request.agent_id !== agentId) {
            return res.status(403).json({ message: 'Você só pode recusar suas próprias solicitações' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Esta solicitação já foi respondida' });
        }

        // Recusar a solicitação
        const updatedRequest = await prisma.ticketAssignmentRequest.update({
            where: { id: parseInt(request_id) },
            data: {
                status: 'Rejected',
                responded_at: new Date(),
                response_note: response_note || 'Recusado pelo agente'
            }
        });

        return res.status(200).json({
            message: 'Solicitação recusada com sucesso',
            request: updatedRequest
        });

    } catch (error) {
        console.error('Erro ao recusar solicitação:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// Controller para listar todas as solicitações de um ticket (para admins)
async function getTicketAssignmentRequestsController(req, res) {
    try {
        const { ticket_id } = req.params;

        const requests = await prisma.ticketAssignmentRequest.findMany({
            where: { ticket_id: parseInt(ticket_id) },
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
            },
            orderBy: {
                requested_at: 'desc'
            }
        });

        return res.status(200).json(requests);

    } catch (error) {
        console.error('Erro ao buscar solicitações do ticket:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

export {
    createAssignmentRequestsController,
    getPendingRequestsController,
    acceptAssignmentRequestController,
    rejectAssignmentRequestController,
    getTicketAssignmentRequestsController
};
