// Script para testar se o botão do chat só aparece quando há técnico atribuído
// Execute no console do navegador

console.log('🔧 Testando regra do técnico atribuído...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');
console.log('🔍 Agora teste o seguinte:');
console.log('   1. Vá para a página de chamados');
console.log('   2. Verifique chamados SEM técnico atribuído:');
console.log('      - NÃO deve aparecer botão de chat');
console.log('      - Deve mostrar "Aguardando técnico"');
console.log('   3. Verifique chamados COM técnico atribuído:');
console.log('      - DEVE aparecer botão de chat');
console.log('      - Deve permitir conversa');
console.log('\n🚀 Correção implementada:');
console.log('   - ✅ Hook verifica se há técnico atribuído ANTES de mostrar chat');
console.log('   - ✅ Se não há técnico: chat não disponível');
console.log('   - ✅ Se há técnico: verifica permissões de acesso');
console.log('   - ✅ Botão só aparece quando técnico aceita o chamado');
console.log('\n💡 Regra correta:');
console.log('   - Chat só disponível quando técnico aceita o chamado');
console.log('   - Admin pode criar chamado, mas chat só aparece após atribuição');
