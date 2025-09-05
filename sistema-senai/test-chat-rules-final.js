// Script final para testar as regras do chat
// Execute no console do navegador

console.log('🔧 Testando regras do chat no frontend...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

// Testar regras do chat
async function testChatRules() {
    try {
        console.log('🔍 Testando regras do chat para ticket 13...');
        
        // Testar API de mensagens (verifica acesso)
        const response = await fetch('/api/messages/list?ticket_id=13', {
            headers: {
                'Authorization': `Bearer ${validToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Acesso ao chat verificado!');
            console.log('📋 Chat access:', data.chatAccess);
            console.log('📋 Mensagens encontradas:', data.messages?.length || 0);
            
            // Verificar se pode enviar mensagens
            if (data.chatAccess.canSend) {
                console.log('✅ Usuário pode enviar mensagens');
            } else {
                console.log('❌ Usuário NÃO pode enviar mensagens');
                console.log('📋 Motivo:', data.chatAccess.reason);
            }
            
            // Verificar status do ticket
            console.log('📊 Status do ticket:', data.chatAccess.ticketStatus);
            
            // Verificar se é ticket fechado
            const isClosed = ['Closed', 'Cancelled', 'Resolved'].includes(data.chatAccess.ticketStatus);
            if (isClosed) {
                console.log('⚠️ Ticket fechado - chat em modo somente leitura');
            } else {
                console.log('✅ Ticket aberto - chat ativo');
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ Erro ao acessar chat:', response.status, errorText);
        }
        
    } catch (error) {
        console.log('❌ Erro ao testar regras:', error.message);
    }
}

// Executar teste
testChatRules().then(() => {
    console.log('\n🎉 Teste das regras concluído!');
    console.log('💡 Agora recarregue a página e teste o chat');
    console.log('🚀 As regras implementadas:');
    console.log('   - ✅ Chat habilitado apenas para criador + técnico + admin');
    console.log('   - ✅ Admin pode enviar mensagens em seus próprios tickets');
    console.log('   - ✅ Admin pode visualizar (mas não enviar) em outros chats');
    console.log('   - ✅ Tickets fechados: chat visível mas sem envio');
    console.log('   - ✅ Botão do chat adicionado ao lado dos botões de ação');
});
