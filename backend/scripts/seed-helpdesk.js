import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedHelpdesk() {
    try {
        console.log('🌱 Iniciando seed do sistema de helpdesk...');

        // Criar usuários de exemplo
        const hashedPassword = await bcrypt.hash('123456', 10);

        // Criar Admin
        const admin = await prisma.user.upsert({
            where: { email: 'admin@helpdesk.com' },
            update: {},
            create: {
                name: 'Administrador',
                email: 'admin@helpdesk.com',
                hashed_password: hashedPassword,
                role: 'Admin',
                phone: '(11) 99999-9999',
            }
        });

        // Criar Agentes
        const agent1 = await prisma.user.upsert({
            where: { email: 'joao@helpdesk.com' },
            update: {},
            create: {
                name: 'João Silva',
                email: 'joao@helpdesk.com',
                hashed_password: hashedPassword,
                role: 'Agent',
                phone: '(11) 88888-8888',
            }
        });

        const agent2 = await prisma.user.upsert({
            where: { email: 'maria@helpdesk.com' },
            update: {},
            create: {
                name: 'Maria Santos',
                email: 'maria@helpdesk.com',
                hashed_password: hashedPassword,
                role: 'Agent',
                phone: '(11) 77777-7777',
            }
        });

        const agent3 = await prisma.user.upsert({
            where: { email: 'pedro@helpdesk.com' },
            update: {},
            create: {
                name: 'Pedro Costa',
                email: 'pedro@helpdesk.com',
                hashed_password: hashedPassword,
                role: 'Agent',
                phone: '(11) 66666-6666',
            }
        });

        // Criar Clientes
        const client1 = await prisma.user.upsert({
            where: { email: 'cliente1@empresa.com' },
            update: {},
            create: {
                name: 'Carlos Oliveira',
                email: 'cliente1@empresa.com',
                hashed_password: hashedPassword,
                role: 'Client',
                phone: '(11) 55555-5555',
            }
        });

        const client2 = await prisma.user.upsert({
            where: { email: 'cliente2@empresa.com' },
            update: {},
            create: {
                name: 'Ana Pereira',
                email: 'cliente2@empresa.com',
                hashed_password: hashedPassword,
                role: 'Client',
                phone: '(11) 44444-4444',
            }
        });

        // Criar registros de Agent
        const agentRecord1 = await prisma.agent.upsert({
            where: { user_id: agent1.id },
            update: {},
            create: {
                user_id: agent1.id,
                employee_id: 'AGT001',
                department: 'Suporte Técnico',
                skills: ['Hardware', 'Software', 'Rede'],
                max_tickets: 15,
            }
        });

        const agentRecord2 = await prisma.agent.upsert({
            where: { user_id: agent2.id },
            update: {},
            create: {
                user_id: agent2.id,
                employee_id: 'AGT002',
                department: 'Suporte Técnico',
                skills: ['Software', 'Banco de Dados'],
                max_tickets: 12,
            }
        });

        const agentRecord3 = await prisma.agent.upsert({
            where: { user_id: agent3.id },
            update: {},
            create: {
                user_id: agent3.id,
                employee_id: 'AGT003',
                department: 'Infraestrutura',
                skills: ['Rede', 'Servidores', 'Segurança'],
                max_tickets: 10,
            }
        });

        // Criar registros de Client
        const clientRecord1 = await prisma.client.upsert({
            where: { user_id: client1.id },
            update: {},
            create: {
                user_id: client1.id,
                company: 'Empresa ABC Ltda',
                client_type: 'Business',
            }
        });

        const clientRecord2 = await prisma.client.upsert({
            where: { user_id: client2.id },
            update: {},
            create: {
                user_id: client2.id,
                company: 'Empresa XYZ Ltda',
                client_type: 'Business',
            }
        });

        // Criar Categorias
        const categoria1 = await prisma.category.upsert({
            where: { name: 'Suporte Técnico' },
            update: {},
            create: {
                name: 'Suporte Técnico',
                description: 'Problemas relacionados a hardware, software e configurações',
                color: '#3B82F6',
                icon: '🔧',
            }
        });

        const categoria2 = await prisma.category.upsert({
            where: { name: 'Infraestrutura' },
            update: {},
            create: {
                name: 'Infraestrutura',
                description: 'Problemas de rede, servidores e conectividade',
                color: '#10B981',
                icon: '🌐',
            }
        });

        const categoria3 = await prisma.category.upsert({
            where: { name: 'Sistema' },
            update: {},
            create: {
                name: 'Sistema',
                description: 'Problemas com o sistema principal e aplicações',
                color: '#F59E0B',
                icon: '💻',
            }
        });

        const categoria4 = await prisma.category.upsert({
            where: { name: 'Dúvidas' },
            update: {},
            create: {
                name: 'Dúvidas',
                description: 'Dúvidas sobre funcionalidades e uso do sistema',
                color: '#8B5CF6',
                icon: '❓',
            }
        });

        // Criar Subcategorias
        const subcategoria1 = await prisma.subcategory.upsert({
            where: { 
                name: 'Hardware',
                category_id: categoria1.id
            },
            update: {},
            create: {
                name: 'Hardware',
                description: 'Problemas com equipamentos físicos',
                category_id: categoria1.id,
            }
        });

        const subcategoria2 = await prisma.subcategory.upsert({
            where: { 
                name: 'Software',
                category_id: categoria1.id
            },
            update: {},
            create: {
                name: 'Software',
                description: 'Problemas com programas e aplicações',
                category_id: categoria1.id,
            }
        });

        const subcategoria3 = await prisma.subcategory.upsert({
            where: { 
                name: 'Rede',
                category_id: categoria2.id
            },
            update: {},
            create: {
                name: 'Rede',
                description: 'Problemas de conectividade e rede',
                category_id: categoria2.id,
            }
        });

        const subcategoria4 = await prisma.subcategory.upsert({
            where: { 
                name: 'Login',
                category_id: categoria3.id
            },
            update: {},
            create: {
                name: 'Login',
                description: 'Problemas de acesso e autenticação',
                category_id: categoria3.id,
            }
        });

        // Criar Tickets de exemplo
        const ticket1 = await prisma.ticket.create({
            data: {
                ticket_number: 'TKT-001',
                title: 'Computador não liga',
                description: 'O computador não está ligando, verifiquei a energia e está tudo ok',
                priority: 'High',
                status: 'Open',
                category_id: categoria1.id,
                subcategory_id: subcategoria1.id,
                client_id: clientRecord1.id,
                created_by: client1.id,
                assigned_to: agent1.id,
            }
        });

        const ticket2 = await prisma.ticket.create({
            data: {
                ticket_number: 'TKT-002',
                title: 'Problema de conexão com a internet',
                description: 'A internet está muito lenta e instável',
                priority: 'Medium',
                status: 'InProgress',
                category_id: categoria2.id,
                subcategory_id: subcategoria3.id,
                client_id: clientRecord2.id,
                created_by: client2.id,
                assigned_to: agent3.id,
            }
        });

        const ticket3 = await prisma.ticket.create({
            data: {
                ticket_number: 'TKT-003',
                title: 'Não consigo fazer login no sistema',
                description: 'Estou tentando acessar o sistema mas não consigo fazer login',
                priority: 'Critical',
                status: 'WaitingForClient',
                category_id: categoria3.id,
                subcategory_id: subcategoria4.id,
                client_id: clientRecord1.id,
                created_by: client1.id,
                assigned_to: agent2.id,
            }
        });

        const ticket4 = await prisma.ticket.create({
            data: {
                ticket_number: 'TKT-004',
                title: 'Dúvida sobre nova funcionalidade',
                description: 'Como usar a nova funcionalidade de relatórios?',
                priority: 'Low',
                status: 'Open',
                category_id: categoria4.id,
                client_id: clientRecord2.id,
                created_by: client2.id,
            }
        });

        // Criar Comentários de exemplo
        await prisma.comment.create({
            data: {
                ticket_id: ticket1.id,
                user_id: agent1.id,
                content: 'Vou verificar o problema. Pode me informar qual modelo do computador?',
                is_internal: false,
            }
        });

        await prisma.comment.create({
            data: {
                ticket_id: ticket1.id,
                user_id: client1.id,
                content: 'É um Dell OptiPlex 7090',
                is_internal: false,
            }
        });

        await prisma.comment.create({
            data: {
                ticket_id: ticket2.id,
                user_id: agent3.id,
                content: 'Verificando a conexão de rede...',
                is_internal: true,
            }
        });

        await prisma.comment.create({
            data: {
                ticket_id: ticket3.id,
                user_id: agent2.id,
                content: 'Resetando sua senha. Você receberá um email com a nova senha temporária.',
                is_internal: false,
            }
        });

        // Criar SLA de exemplo
        await prisma.sLA.createMany({
            data: [
                {
                    name: 'SLA Crítico',
                    description: 'Tickets críticos devem ser respondidos em 1 hora',
                    priority: 'Critical',
                    response_time: 60,
                    resolution_time: 240,
                },
                {
                    name: 'SLA Alto',
                    description: 'Tickets de alta prioridade devem ser respondidos em 4 horas',
                    priority: 'High',
                    response_time: 240,
                    resolution_time: 1440,
                },
                {
                    name: 'SLA Médio',
                    description: 'Tickets de média prioridade devem ser respondidos em 8 horas',
                    priority: 'Medium',
                    response_time: 480,
                    resolution_time: 2880,
                },
                {
                    name: 'SLA Baixo',
                    description: 'Tickets de baixa prioridade devem ser respondidos em 24 horas',
                    priority: 'Low',
                    response_time: 1440,
                    resolution_time: 5760,
                },
            ],
            skipDuplicates: true,
        });

        // Criar Templates de Resposta
        await prisma.responseTemplate.createMany({
            data: [
                {
                    name: 'Boas-vindas',
                    subject: 'Ticket recebido',
                    content: 'Olá! Recebemos seu ticket e estamos trabalhando para resolvê-lo o mais rápido possível. Você receberá atualizações em breve.',
                    category_id: categoria4.id,
                },
                {
                    name: 'Problema de Hardware',
                    subject: 'Diagnóstico de Hardware',
                    content: 'Vou realizar um diagnóstico do seu equipamento. Por favor, mantenha o equipamento ligado e acessível para os testes.',
                    category_id: categoria1.id,
                },
                {
                    name: 'Problema de Rede',
                    subject: 'Verificação de Rede',
                    content: 'Estou verificando a conectividade de rede. Isso pode levar alguns minutos.',
                    category_id: categoria2.id,
                },
            ],
            skipDuplicates: true,
        });

        console.log('✅ Seed do sistema de helpdesk concluído com sucesso!');
        console.log('\n📋 Dados criados:');
        console.log('- 1 Admin');
        console.log('- 3 Agentes');
        console.log('- 2 Clientes');
        console.log('- 4 Categorias');
        console.log('- 4 Subcategorias');
        console.log('- 4 Tickets de exemplo');
        console.log('- 4 Comentários de exemplo');
        console.log('- 4 SLAs');
        console.log('- 3 Templates de resposta');
        
        console.log('\n🔑 Credenciais de acesso:');
        console.log('Admin: admin@helpdesk.com / 123456');
        console.log('Agente 1: joao@helpdesk.com / 123456');
        console.log('Agente 2: maria@helpdesk.com / 123456');
        console.log('Agente 3: pedro@helpdesk.com / 123456');
        console.log('Cliente 1: cliente1@empresa.com / 123456');
        console.log('Cliente 2: cliente2@empresa.com / 123456');

    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedHelpdesk(); 