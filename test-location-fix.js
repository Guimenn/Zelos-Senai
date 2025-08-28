// Usar fetch nativo do Node.js (disponível a partir do Node.js 18)

async function testLocationFix() {
  console.log('🧪 Testando correção da localização dos técnicos...');
  
  try {
    // 1. Fazer login como admin
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login bem-sucedido');
    
    // 2. Testar a API de agentes
    console.log('🔍 Testando API de agentes...');
    const agentsResponse = await fetch('http://localhost:3001/admin/agent?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!agentsResponse.ok) {
      console.log('❌ Erro na API de agentes:', await agentsResponse.text());
      return;
    }
    
    const agentsData = await agentsResponse.json();
    console.log('✅ API de agentes funcionando');
    
    // 3. Verificar se o campo address está presente
    console.log('📋 Verificando campo address...');
    const agents = agentsData.agents || [];
    
    if (agents.length === 0) {
      console.log('⚠️ Nenhum agente encontrado');
      return;
    }
    
    console.log(`📊 Encontrados ${agents.length} agentes`);
    
    agents.forEach((agent, index) => {
      console.log(`\n👤 Agente ${index + 1}: ${agent.user?.name || 'Sem nome'}`);
      console.log(`   📧 Email: ${agent.user?.email || 'N/A'}`);
      console.log(`   📱 Telefone: ${agent.user?.phone || 'N/A'}`);
      console.log(`   📍 Endereço: ${agent.user?.address || 'Não informado'}`);
      console.log(`   🏢 Departamento: ${agent.department || 'N/A'}`);
    });
    
    // 4. Verificar se pelo menos um agente tem endereço
    const agentsWithAddress = agents.filter(agent => agent.user?.address);
    console.log(`\n📈 Resumo:`);
    console.log(`   - Total de agentes: ${agents.length}`);
    console.log(`   - Com endereço: ${agentsWithAddress.length}`);
    console.log(`   - Sem endereço: ${agents.length - agentsWithAddress.length}`);
    
    if (agentsWithAddress.length > 0) {
      console.log('✅ Campo address está sendo retornado corretamente!');
    } else {
      console.log('⚠️ Nenhum agente tem endereço cadastrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testLocationFix();
