// Script para testar se a API está retornando o avatar corretamente
// Execute este script no console do navegador quando estiver logado

async function testAvatarAPI() {
  try {
    // Pegar o token de autenticação
    const token = document.cookie.split('auth_token=')[1]?.split(';')[0]
    if (!token) {
      console.error('❌ Token não encontrado. Faça login primeiro.')
      return
    }

    console.log('🔍 Testando API de avatar...')
    
    // Testar API /user/me
    console.log('1. Testando /user/me...')
    const meResponse = await fetch('/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (meResponse.ok) {
      const meData = await meResponse.json()
      console.log('✅ /user/me response:', meData)
      console.log('✅ Avatar do usuário atual:', meData.avatar)
    } else {
      console.error('❌ Erro na API /user/me:', meResponse.status, meResponse.statusText)
    }

    // Testar API de tickets para ver se retorna avatar
    console.log('2. Testando API de tickets...')
    const ticketsResponse = await fetch('/helpdesk/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (ticketsResponse.ok) {
      const ticketsData = await ticketsResponse.json()
      console.log('✅ Tickets response:', ticketsData)
      
      if (ticketsData.tickets && ticketsData.tickets.length > 0) {
        const firstTicket = ticketsData.tickets[0]
        console.log('✅ Primeiro ticket:', firstTicket)
        console.log('✅ Creator avatar:', firstTicket.creator?.avatar)
        console.log('✅ Assignee avatar:', firstTicket.assignee?.avatar)
      }
    } else {
      console.error('❌ Erro na API de tickets:', ticketsResponse.status, ticketsResponse.statusText)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar o teste
testAvatarAPI()
