const fetch = require('node-fetch');

async function testBackend() {
  console.log('🧪 Testando conexão com o backend...');
  
  try {
    // Teste 1: Verificar se o servidor está rodando
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login bem-sucedido:', data.message);
      console.log('Token obtido:', data.token ? `${data.token.substring(0, 20)}...` : 'null');
      
      // Teste 2: Verificar se as rotas de agente funcionam
      const agentResponse = await fetch('http://localhost:3001/helpdesk/agents/my-statistics', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da rota de agente:', agentResponse.status);
      
      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        console.log('✅ Rota de agente funcionando:', agentData);
      } else {
        const errorData = await agentResponse.text();
        console.log('❌ Erro na rota de agente:', errorData);
      }
      
    } else {
      const errorData = await response.text();
      console.log('❌ Erro no login:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o backend:', error.message);
  }
}

testBackend();
