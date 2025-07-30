import { PrismaClient } from '../generated/prisma/index.js';
import { clientCreateSchema, clientUpdateSchema } from '../schemas/client.schema.js';
import { ZodError } from 'zod/v4';
import { generateHashPassword } from '../utils/hash.js';

const prisma = new PrismaClient();


// Controller para criar um novo cliente
async function createClientController(req, res) {
    let clientData;

    try {
        clientData = clientCreateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        let userId;

        // Se dados do usuário foram fornecidos, criar novo usuário
        if (clientData.user) {
            // Verificar se o email já existe
            const existingUser = await prisma.user.findUnique({
                where: { email: clientData.user.email }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Email já está em uso' });
            }

            // Criar novo usuário com role Client
            const hashedPassword = await generateHashPassword(clientData.user.password);
            
            const newUser = await prisma.user.create({
                data: {
                    name: clientData.user.name,
                    email: clientData.user.email,
                    phone: clientData.user.phone,
                    avatar: clientData.user.avatar,
                    hashed_password: hashedPassword,
                    role: 'Client'
                }
            });

            userId = newUser.id;
        } else {
            // Usar usuário existente
            const user = await prisma.user.findUnique({
                where: { id: clientData.user_id },
                include: { client: true }
            });

            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            if (user.role !== 'Client') {
                return res.status(400).json({ message: 'O usuário deve ter o papel de Client' });
            }

            if (user.client) {
                return res.status(400).json({ message: 'Este usuário já é um cliente' });
            }

            userId = user.id;
        }

        // Criar o cliente
        const client = await prisma.client.create({
            data: {
                user_id: userId,
                company: clientData.company,
                client_type: clientData.client_type,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                },
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        return res.status(201).json(client);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        return res.status(500).json({ message: 'Erro ao criar cliente' });
    }
}

// Controller para listar todos os clientes
async function getAllClientsController(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            client_type,
            is_active,
            search 
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const where = {};
        
        if (client_type) where.client_type = client_type;
        if (is_active !== undefined) where.user = { is_active: is_active === 'true' };
        
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
        
                { company: { contains: search, mode: 'insensitive' } },
                { client_type: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true,
                            is_active: true,
                        }
                    },
                    _count: {
                        select: {
                            tickets: true,
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            }),
            prisma.client.count({ where })
        ]);

        return res.status(200).json({
            clients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
}

// Controller para obter um cliente específico por ID
async function getClientByIdController(req, res) {
    try {
        const client = await prisma.client.findUnique({
            where: { id: parseInt(req.params.clientId) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                },
                tickets: {
                    select: {
                        id: true,
                        ticket_number: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'desc' },
                    take: 10
                },
                _count: {
                    select: {
                        tickets: true,
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return res.status(500).json({ message: 'Erro ao buscar cliente' });
    }
}

// Controller para atualizar um cliente
async function updateClientController(req, res) {
    let clientData;

    try {
        clientData = clientUpdateSchema.parse(req.body);
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error['issues'].map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                message: 'Dados inválidos',
                errors: formatted,
            });
        }
    }

    try {
        const client = await prisma.client.update({
            where: { id: parseInt(req.params.clientId) },
            data: clientData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        is_active: true,
                    }
                }
            }
        });

        return res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return res.status(500).json({ message: 'Erro ao atualizar cliente' });
    }
}

// Controller para deletar um cliente
async function deleteClientController(req, res) {
    try {
        await prisma.client.delete({
            where: { id: parseInt(req.params.clientId) }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        return res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
}

export {
    createClientController,
    getAllClientsController,
    getClientByIdController,
    updateClientController,
    deleteClientController,
}; 