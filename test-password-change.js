import fetch from 'node-fetch';

async function testPasswordChange() {
  try {
    // 1. Fazer login para obter token
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch('http://localhost:3000/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginData);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    const token = loginData.token;

    // 2. Tentar alterar a senha
    console.log('🔑 Alterando senha...');
    const changePasswordResponse = await fetch('http://localhost:3000/user/me/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: 'novaSenha123'
      })
    });

    const changePasswordData = await changePasswordResponse.json();
    
    if (!changePasswordResponse.ok) {
      console.error('❌ Erro ao alterar senha:', changePasswordData);
      return;
    }

    console.log('✅ Senha alterada com sucesso:', changePasswordData);

    // 3. Tentar fazer login com a nova senha
    console.log('🔐 Testando login com nova senha...');
    const newLoginResponse = await fetch('http://localhost:3000/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'novaSenha123'
      })
    });

    const newLoginData = await newLoginResponse.json();
    
    if (!newLoginResponse.ok) {
      console.error('❌ Erro no login com nova senha:', newLoginData);
      return;
    }

    console.log('✅ Login com nova senha realizado com sucesso!');

    // 4. Voltar a senha original
    console.log('🔄 Voltando senha original...');
    const revertResponse = await fetch('http://localhost:3000/user/me/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${newLoginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'novaSenha123',
        newPassword: 'admin123'
      })
    });

    const revertData = await revertResponse.json();
    
    if (!revertResponse.ok) {
      console.error('❌ Erro ao voltar senha original:', revertData);
      return;
    }

    console.log('✅ Senha original restaurada com sucesso!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testPasswordChange();
