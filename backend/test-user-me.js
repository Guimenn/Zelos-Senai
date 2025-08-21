import fetch from 'node-fetch';

async function testUserMe() {
  try {
    // Primeiro, vamos fazer login para obter um token
    const loginResponse = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@helpdesk.com',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      console.error('Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login bem-sucedido:', loginData);

    // Agora vamos testar a rota /user/me
    const userMeResponse = await fetch('http://localhost:3000/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta /user/me:', userMeResponse.status);
    
    if (!userMeResponse.ok) {
      const errorText = await userMeResponse.text();
      console.error('Erro na rota /user/me:', errorText);
    } else {
      const userData = await userMeResponse.json();
      console.log('Dados do usuário:', userData);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testUserMe();
