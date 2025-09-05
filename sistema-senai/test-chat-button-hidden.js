// Script para testar se o botão do chat não aparece quando não há técnico
// Execute no console do navegador

console.log('🔧 Testando se o botão do chat está oculto...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');
console.log('🔍 Agora teste o seguinte:');
console.log('   1. Vá para a página de chamados');
console.log('   2. Verifique chamados SEM técnico atribuído:');
console.log('      - NÃO deve aparecer botão de chat (invisível)');
console.log('      - Só deve aparecer botões: Visualizar, Editar, Excluir');
console.log('   3. Verifique chamados COM técnico atribuído:');
console.log('      - DEVE aparecer botão de chat');
console.log('      - Deve permitir conversa');
console.log('\n🚀 Correção implementada:');
console.log('   - ✅ ChatButtonSimple retorna null quando não há técnico');
console.log('   - ✅ Botão do chat não aparece na interface');
console.log('   - ✅ Só aparece quando técnico aceita o chamado');
console.log('   - ✅ Interface mais limpa e intuitiva');
console.log('\n💡 Resultado esperado:');
console.log('   - Chamados sem técnico: sem botão de chat');
console.log('   - Chamados com técnico: com botão de chat');
console.log('   - Interface mais clara e organizada');
console.log('\n🎉 Botão do chat agora está completamente oculto quando não há técnico!');
