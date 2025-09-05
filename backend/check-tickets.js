#!/usr/bin/env node

/**
 * Script para verificar tickets existentes no banco
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('🔧 Verificando tickets no banco...\n');

async function checkTickets() {
    try {
        // Buscar todos os tickets
        const tickets = await prisma.ticket.findMany({
            select: {
                id: true,
                ticket_number: true,
                title: true,
                status: true,
                priority: true,
                assigned_to: true,
                created_at: true
            },
            orderBy: {
                id: 'asc'
            }
        });
        
        console.log(`📋 Total de tickets encontrados: ${tickets.length}\n`);
        
        if (tickets.length > 0) {
            console.log('📝 Lista de tickets:');
            tickets.forEach(ticket => {
                console.log(`   ID: ${ticket.id} | ${ticket.ticket_number} | ${ticket.title} | Status: ${ticket.status} | Técnico: ${ticket.assigned_to || 'Nenhum'}`);
            });
            
            // Verificar se o ticket 13 existe
            const ticket13 = tickets.find(t => t.id === 13);
            if (ticket13) {
                console.log(`\n✅ Ticket 13 existe: ${ticket13.title}`);
            } else {
                console.log(`\n❌ Ticket 13 não existe`);
                console.log(`💡 Use um dos IDs disponíveis: ${tickets.map(t => t.id).join(', ')}`);
            }
            
            // Buscar tickets com técnico atribuído
            const ticketsWithAssignee = tickets.filter(t => t.assigned_to);
            console.log(`\n👤 Tickets com técnico atribuído: ${ticketsWithAssignee.length}`);
            
            if (ticketsWithAssignee.length > 0) {
                console.log('📝 Tickets com técnico:');
                ticketsWithAssignee.forEach(ticket => {
                    console.log(`   ID: ${ticket.id} | ${ticket.ticket_number} | Técnico: ${ticket.assigned_to}`);
                });
            }
            
        } else {
            console.log('❌ Nenhum ticket encontrado no banco');
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar tickets:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTickets();
