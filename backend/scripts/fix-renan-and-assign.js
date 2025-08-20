import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';

async function ensureRenan() {
  const email = 'renan@gmail.com';
  const password = 'Renan123';
  let user = await prisma.user.findUnique({ where: { email } });

  const hashed = await bcrypt.hash(password, 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Renan',
        email,
        hashed_password: hashed,
        role: 'Agent',
        is_active: true,
      },
    });
    console.log('✅ Created user:', user.id);
  } else {
    // Ensure role and password
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'Agent', is_active: true, hashed_password: hashed },
    });
    console.log('✅ Updated user:', user.id);
  }

  // Ensure Agent record
  let agent = await prisma.agent.findFirst({ where: { user_id: user.id } });
  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        user_id: user.id,
        employee_id: 'RENAN-EMP',
        department: 'Manutenção',
        skills: [],
        max_tickets: 10,
      },
    });
    console.log('✅ Created agent:', agent.id);
  } else {
    console.log('ℹ️ Agent exists:', agent.id);
  }

  return { user, agent };
}

async function ensureAgentCategory(agentId, categoryId) {
  if (!categoryId) return;
  const exists = await prisma.agentCategory.findFirst({ where: { agent_id: agentId, category_id: categoryId } });
  if (!exists) {
    await prisma.agentCategory.create({ data: { agent_id: agentId, category_id: categoryId } });
    console.log(`✅ Linked agent ${agentId} to category ${categoryId}`);
  }
}

async function assignTicketToUser(ticketNumber, userId, agentId) {
  const ticket = await prisma.ticket.findFirst({ where: { ticket_number: ticketNumber } });
  if (!ticket) {
    console.log('❌ Ticket not found:', ticketNumber);
    return null;
  }
  await ensureAgentCategory(agentId, ticket.category_id);

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assigned_to: userId, status: ticket.status === 'Open' ? 'InProgress' : ticket.status },
  });
  console.log('✅ Ticket assigned:', updated.id, '-> user', userId);

  // Register assignment record (best-effort)
  try {
    await prisma.ticketAssignment.create({
      data: { ticket_id: updated.id, agent_id: agentId, assigned_by: userId },
    });
  } catch {}

  return updated;
}

async function main() {
  const ticketNumber = 'TKT-080124-921';
  const { user, agent } = await ensureRenan();
  const updated = await assignTicketToUser(ticketNumber, user.id, agent.id);
  if (updated) {
    console.log('🎯 Done. Ticket', ticketNumber, 'now assigned_to', user.id);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


