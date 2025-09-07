// Usando fetch nativo do Node.js

async function testMessagesAPI() {
    try {
console.log('🔧 Testando API de mensagens...\n');

        // Gerar token
        const { execSync } = await import('child_process');
        const tokenOutput = execSync('node generate-test-token.js', { encoding: 'utf8' });
        const tokenMatch = tokenOutput.match(/Bearer (.+)/);
        
        if (!tokenMatch) {
            console.error('❌ Não foi possível extrair o token');
            return;
        }
        
        const token = tokenMatch[1];
        console.log('🔑 Token extraído com sucesso');

        // Testar listagem de mensagens
        console.log('\n📋 Testando listagem de mensagens...');
        const listResponse = await fetch('http://localhost:3000/api/messages/list?ticket_id=15', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📊 Status da resposta:', listResponse.status);
        
        if (listResponse.ok) {
            const listData = await listResponse.json();
            console.log('✅ Listagem de mensagens:', JSON.stringify(listData, null, 2));
        } else {
            const errorText = await listResponse.text();
            console.log('❌ Erro na listagem:', errorText);
        }

        // Testar envio de mensagem
        console.log('\n📤 Testando envio de mensagem...');
        const sendResponse = await fetch('http://localhost:3000/api/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: 15,
                content: 'Teste API ' + new Date().toLocaleTimeString()
            })
        });

        console.log('📊 Status do envio:', sendResponse.status);
        
        if (sendResponse.ok) {
            const sendData = await sendResponse.json();
            console.log('✅ Mensagem enviada:', JSON.stringify(sendData, null, 2));
        } else {
            const errorText = await sendResponse.text();
            console.log('❌ Erro no envio:', errorText);
        }

    } catch (error) {
        console.error('❌ Erro ao testar API:', error);
    }
}

testMessagesAPI();