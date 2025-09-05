// Script para testar se o botão do chat não abre mais o modal de visualização
// Execute no console do navegador

console.log('🔧 Testando correção do botão do chat...\n');

// Token válido
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token definido');
console.log('🔍 Agora teste o seguinte:');
console.log('   1. Vá para a página de chamados');
console.log('   2. Clique no botão do chat (ícone de mensagem)');
console.log('   3. Verifique se abre APENAS o modal do chat');
console.log('   4. Verifique se NÃO abre o modal de visualização');
console.log('\n💡 Se ainda abrir o modal de visualização, o problema pode ser:');
console.log('   - Cache do navegador (tente Ctrl+F5)');
console.log('   - O componente ChatButtonSimple não está usando stopPropagation');
console.log('\n🚀 Correção implementada:');
console.log('   - ✅ Adicionado stopPropagation no wrapper do botão do chat');
console.log('   - ✅ Funciona tanto na visualização em lista quanto em grid');
console.log('   - ✅ Botão do chat agora é independente do modal de visualização');
