// Script para restaurar o token de admin
// Execute no console do navegador

console.log('🔧 Restaurando token de admin...\n');

// Token de admin válido
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir token
document.cookie = `auth_token=${adminToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token de admin restaurado!');
console.log('💡 Agora você está logado como admin');
console.log('🔍 Recarregue a página e verifique se o botão do chat mostra o nome do técnico');

// Verificar dados do token
const tokenData = JSON.parse(atob(adminToken.split('.')[1]));
console.log('\n📋 Dados do token:');
console.log('   User ID:', tokenData.userId);
console.log('   Role:', tokenData.role);
console.log('   Name:', tokenData.name);
console.log('   Email:', tokenData.email);
