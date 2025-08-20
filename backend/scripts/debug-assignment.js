import prisma from '../prisma/client.js';

async function main() {
  const [,, emailArg, ticketNumberArg] = process.argv;
  const email = emailArg || 'renan@gmail.com';
  const ticketNumber = ticketNumberArg || 'TKT-080124-921';

  console.log('Checking assignment for:', { email, ticketNumber });

  const user = await prisma.user.findFirst({ where: { email }, include: { agent: true } });
  if (!user) {
    console.log('User not found for email:', email);
    return;
  }
  console.log('User:', { id: user.id, role: user.role, is_active: user.is_active, agentId: user.agent?.id });

  const ticket = await prisma.ticket.findFirst({
    where: { ticket_number: ticketNumber },
    include: { category: true, subcategory: true, assignee: true, client: { include: { user: true } } }
  });

  if (!ticket) {
    console.log('Ticket not found:', ticketNumber);
    return;
  }

  console.log('Ticket:', { id: ticket.id, status: ticket.status, assigned_to: ticket.assigned_to, category_id: ticket.category_id });
  console.log('Assignee:', ticket.assignee ? { id: ticket.assignee.id, name: ticket.assignee.name, email: ticket.assignee.email } : null);

  const matches = ticket.assigned_to === user.id;
  console.log('Assigned to this user?', matches);

  // Also show if my-tickets query would return it
  const myTicketsCount = await prisma.ticket.count({ where: { assigned_to: user.id } });
  console.log('My tickets count for user:', myTicketsCount);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });


