import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔐 Testando login do admin...');
    
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

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login realizado com sucesso!');
      console.log('👤 Usuário:', data.user);
      console.log('🔑 Token recebido');
    } else {
      console.log('❌ Erro no login:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testLogin();
