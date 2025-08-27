const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFrontendLogic() {
  try {
    console.log('🔍 Testando lógica do frontend...')
    
    // Buscar tickets com técnico atribuído
    const assignedTickets = await prisma.ticket.findMany({
      where: {
        assigned_to: {
          not: null
        }
      },
      include: {
        client: {
          include: {
            user: true
          }
        },
        assigned_to_user: true
      }
    })
    
    console.log(`\n📊 Encontrados ${assignedTickets.length} tickets com técnico atribuído`)
    
    for (const ticket of assignedTickets) {
      console.log(`\n🎫 Ticket: ${ticket.ticket_number || `#${ticket.id}`}`)
      console.log(`   Status: ${ticket.status}`)
      console.log(`   Assigned_to: ${ticket.assigned_to}`)
      console.log(`   Client: ${ticket.client?.name || 'N/A'}`)
      console.log(`   Client User ID: ${ticket.client?.user?.id || 'N/A'}`)
      console.log(`   Técnico: ${ticket.assigned_to_user?.name || 'N/A'}`)
      
      // Simular a lógica do frontend
      const currentUserId = ticket.client?.user?.id
      const canEdit = !!ticket && !ticket.assigned_to && (ticket.client?.user?.id === currentUserId)
      
      console.log(`   🔍 Lógica canEdit: ${canEdit}`)
      console.log(`   🔍 Condições:`)
      console.log(`      - ticket existe: ${!!ticket}`)
      console.log(`      - !assigned_to: ${!ticket.assigned_to}`)
      console.log(`      - client.user.id === currentUserId: ${ticket.client?.user?.id === currentUserId}`)
      
      if (canEdit) {
        console.log(`   ⚠️  PROBLEMA: Cliente ainda pode editar este ticket!`)
      } else {
        console.log(`   ✅ OK: Cliente não pode editar este ticket`)
      }
    }
    
    // Testar com um cliente específico
    const clientUser = await prisma.user.findFirst({
      where: {
        role: 'Client'
      },
      include: {
        client: true
      }
    })
    
    if (clientUser) {
      console.log(`\n👤 Testando com cliente: ${clientUser.name} (ID: ${clientUser.id})`)
      
      const clientTickets = await prisma.ticket.findMany({
        where: {
          client_id: clientUser.client?.id
        },
        include: {
          client: {
            include: {
              user: true
            }
          },
          assigned_to_user: true
        }
      })
      
      console.log(`\n📋 Tickets do cliente ${clientUser.name}:`)
      
      for (const ticket of clientTickets) {
        const currentUserId = clientUser.id
        const canEdit = !!ticket && !ticket.assigned_to && (ticket.client?.user?.id === currentUserId)
        
        console.log(`\n   🎫 ${ticket.ticket_number || `#${ticket.id}`}`)
        console.log(`      Status: ${ticket.status}`)
        console.log(`      Assigned_to: ${ticket.assigned_to}`)
        console.log(`      Can Edit: ${canEdit}`)
        
        if (ticket.assigned_to && canEdit) {
          console.log(`      ⚠️  PROBLEMA: Ticket atribuído mas ainda pode editar!`)
        }
      }
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFrontendLogic()
