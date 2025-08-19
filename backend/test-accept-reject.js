import jwt from 'jsonwebtoken'
import prisma from './prisma/client.js'

// JWT Secret (mesmo usado no backend)
const JWT_SECRET = 'your-super-secret-jwt-key-2024'

async function testAcceptRejectRoutes() {
  try {
    console.log('🔧 Testando rotas de aceitar/recusar tickets...')
    
    // 1. Buscar um agente para testar
    const agent = await prisma.agent.findFirst({
      include: {
        user: true,
        agent_categories: {
          include: {
            category: true
          }
        }
      }
    })
    
    if (!agent) {
      console.log('❌ Nenhum agente encontrado')
      return
    }
    
    console.log(`✅ Agente encontrado: ${agent.user.name} (${agent.user.email})`)
    console.log(`📋 Categorias: ${agent.agent_categories.map(ac => ac.category.name).join(', ')}`)
    
    // 2. Buscar tickets disponíveis para o agente
    const agentCategoryIds = agent.agent_categories.map(ac => ac.category_id)
    
    const availableTickets = await prisma.ticket.findMany({
      where: {
        assigned_to: null,
        status: 'Open',
        category_id: { in: agentCategoryIds }
      },
      include: {
        category: true,
        subcategory: true
      }
    })
    
    console.log(`📋 Tickets disponíveis: ${availableTickets.length}`)
    
    if (availableTickets.length === 0) {
      console.log('❌ Nenhum ticket disponível para testar')
      return
    }
    
    // 3. Criar token JWT para o agente
    const token = jwt.sign(
      {
        userId: agent.user.id,
        email: agent.user.email,
        role: 'Agent',
        agent: {
          id: agent.id
        }
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    console.log(`🔑 Token criado para: ${agent.user.email}`)
    
    // 4. Testar rota de aceitar ticket
    const ticketToAccept = availableTickets[0]
    console.log(`\n🎯 Testando aceitar ticket #${ticketToAccept.id} (${ticketToAccept.title})`)
    
    const acceptResponse = await fetch(`http://localhost:3001/api/assignment-requests/${ticketToAccept.id}/accept`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ response_note: 'Teste de aceitação' })
    })
    
    console.log(`📡 Status da resposta (aceitar): ${acceptResponse.status}`)
    
    if (acceptResponse.ok) {
      const acceptData = await acceptResponse.json()
      console.log('✅ Ticket aceito com sucesso!')
      console.log('📋 Dados da resposta:', JSON.stringify(acceptData, null, 2))
      
      // 5. Verificar se o ticket foi atribuído
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketToAccept.id },
        include: {
          assignee: {
            include: {
              user: true
            }
          }
        }
      })
      
      console.log(`🔍 Ticket atualizado - Assigned to: ${updatedTicket.assignee?.user.name || 'Ninguém'}`)
      
    } else {
      const errorData = await acceptResponse.json()
      console.log('❌ Erro ao aceitar ticket:', errorData)
    }
    
    // 6. Testar rota de recusar ticket (se houver outro ticket disponível)
    if (availableTickets.length > 1) {
      const ticketToReject = availableTickets[1]
      console.log(`\n🎯 Testando recusar ticket #${ticketToReject.id} (${ticketToReject.title})`)
      
      const rejectResponse = await fetch(`http://localhost:3001/api/assignment-requests/${ticketToReject.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response_note: 'Teste de recusa' })
      })
      
      console.log(`📡 Status da resposta (recusar): ${rejectResponse.status}`)
      
      if (rejectResponse.ok) {
        const rejectData = await rejectResponse.json()
        console.log('✅ Ticket recusado com sucesso!')
        console.log('📋 Dados da resposta:', JSON.stringify(rejectData, null, 2))
      } else {
        const errorData = await rejectResponse.json()
        console.log('❌ Erro ao recusar ticket:', errorData)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o teste
testAcceptRejectRoutes()
