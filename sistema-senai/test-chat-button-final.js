// Script final para testar a correção dos nomes no botão do chat
// Execute no console do navegador

console.log('🔧 Testando correção final dos nomes no botão do chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');

// Função para testar a correção
async function testChatButtonFinal() {
    console.log('🔍 Testando correção final...');
    
    try {
        // Buscar dados do ticket
        const ticketResponse = await fetch('/helpdesk/tickets/273982-568', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            console.log('✅ Dados do ticket:', ticketData);
            
            // Verificar se há técnico atribuído
            if (ticketData.assigned_to) {
                console.log('\n🎯 Cenário atual:');
                console.log('   👤 Criador:', ticketData.creator?.name || ticketData.created_by?.name);
                console.log('   👨‍💼 Técnico:', ticketData.assigned_to.name);
                console.log('   👤 Usuário atual (Admin):', 'Administrador');
                
                console.log('\n✅ Comportamento esperado:');
                console.log('   - Se você estiver logado como TÉCNICO: botão deve mostrar nome do CRIADOR');
                console.log('   - Se você estiver logado como CRIADOR: botão deve mostrar nome do TÉCNICO');
                console.log('   - Se você estiver logado como ADMIN: botão deve mostrar nome do TÉCNICO');
                
                console.log('\n🔍 Verificando se o botão está sendo renderizado...');
                
                // Verificar se há botões de chat na página
                const chatButtons = document.querySelectorAll('button[title*="Abrir chat"]');
                console.log(`   Botões de chat encontrados: ${chatButtons.length}`);
                
                if (chatButtons.length > 0) {
                    chatButtons.forEach((button, index) => {
                        console.log(`   Botão ${index + 1}:`, button.textContent.trim());
                        console.log(`   Título: ${button.title}`);
                    });
                } else {
                    console.log('   ❌ Nenhum botão de chat encontrado na página');
                    console.log('   💡 Certifique-se de que está na página de chamados e que há técnico atribuído');
                }
                
            } else {
                console.log('❌ Nenhum técnico atribuído ao ticket');
                console.log('💡 O botão de chat não deve aparecer quando não há técnico');
            }
            
        } else {
            console.log('❌ Erro ao buscar ticket:', ticketResponse.status);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

// Executar teste
testChatButtonFinal();

console.log('\n💡 Verifique os logs acima para confirmar se a correção está funcionando');
console.log('🔍 Para testar completamente:');
console.log('   1. Faça login como técnico e verifique se o botão mostra o nome do criador');
console.log('   2. Faça login como criador e verifique se o botão mostra o nome do técnico');
console.log('   3. Faça login como admin e verifique se o botão mostra o nome do técnico');
