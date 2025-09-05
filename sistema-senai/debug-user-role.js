// Script para debugar o role do usuário
// Digite no console

// 1. Verificar dados do token diretamente
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';
const userData = JSON.parse(atob(token.split('.')[1]));
console.log('🔍 Dados do token:', userData);
console.log('👤 User ID:', userData.userId);
console.log('👤 Role:', userData.role);
console.log('👤 UserRole:', userData.userRole);
console.log('👤 Name:', userData.name);

// 2. Verificar se há logs do AuthManager no console
console.log('\n🔍 Verifique se há logs do AuthManager no console acima');
console.log('💡 Procure por: "DEBUG - AuthManager decoded token"');

// 3. Verificar se o hook está retornando dados corretos
console.log('\n🔍 Para verificar o hook useRequireAuth:');
console.log('1. Abra o DevTools');
console.log('2. Vá para a aba "Components" (React DevTools)');
console.log('3. Encontre o componente ChatButtonSimple');
console.log('4. Verifique as props "user" e "user.role"');

// 4. Verificar se há problemas de cache
console.log('\n🔍 Para limpar o cache de autenticação:');
console.log('localStorage.clear(); sessionStorage.clear(); location.reload();');
