import fetch from 'node-fetch';

async function createAdmin() {
  try {
    console.log('🔧 Criando administrador via API...');
    
    const adminData = {
      name: 'Administrador',
      email: 'admin@senai.com',
      password: 'admin123',
      role: 'Admin',
      phone: '(11) 99999-9999',
      position: 'Administrador do Sistema'
    };

    const response = await fetch('http://localhost:3001/helpdesk/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Administrador criado com sucesso!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Senha:', adminData.password);
      console.log('📄 Resposta:', result);
    } else {
      const error = await response.text();
      console.log('❌ Erro ao criar administrador:', error);
      console.log('📊 Status:', response.status);
    }

  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.log('💡 Certifique-se de que o backend está rodando na porta 3001');
  }
}

// Executar o script
createAdmin();

