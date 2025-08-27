import fetch from 'node-fetch'

async function testApiEdit() {
  try {
    console.log('🔍 Testando API de edição...')
    
    // Primeiro, fazer login como cliente
    const loginResponse = await fetch('http://localhost:3001/helpdesk/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'cleisson@teste.com',
        password: '123456'
      })
    })
    
    if (!loginResponse.ok) {
      console.error('❌ Falha no login')
      return
    }
    
    const loginData = await loginResponse.json()
    const token = loginData.token
    
    console.log('✅ Login realizado com sucesso')
    
    // Buscar tickets do cliente
    const ticketsResponse = await fetch('http://localhost:3001/helpdesk/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!ticketsResponse.ok) {
      console.error('❌ Falha ao buscar tickets')
      return
    }
    
    const tickets = await ticketsResponse.json()
    console.log(`📋 Encontrados ${tickets.length} tickets`)
    
    // Encontrar um ticket atribuído
    const assignedTicket = tickets.find(t => t.assigned_to)
    
    if (!assignedTicket) {
      console.log('❌ Nenhum ticket atribuído encontrado')
      return
    }
    
    console.log(`🎫 Testando edição do ticket: ${assignedTicket.ticket_number || assignedTicket.id}`)
    console.log(`   Assigned_to: ${assignedTicket.assigned_to}`)
    
    // Tentar editar o ticket
    const editResponse = await fetch(`http://localhost:3001/helpdesk/tickets/${assignedTicket.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Teste de edição - ' + new Date().toISOString(),
        description: 'Teste de edição bloqueada'
      })
    })
    
    console.log(`📡 Status da resposta: ${editResponse.status}`)
    
    if (editResponse.ok) {
      console.log('❌ PROBLEMA: Edição foi permitida quando deveria ser bloqueada!')
      const responseData = await editResponse.json()
      console.log('Resposta:', responseData)
    } else {
      const errorData = await editResponse.json()
      console.log('✅ OK: Edição foi bloqueada corretamente')
      console.log('Mensagem de erro:', errorData.message)
    }
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

testApiEdit()
