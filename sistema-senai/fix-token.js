// Script para corrigir o token no frontend
// Execute no console do navegador

console.log('🔧 Corrigindo token de autenticação...\n');

// Token válido gerado pelo backend
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc';

// Definir o token nos cookies
document.cookie = `auth_token=${validToken}; path=/; max-age=${24 * 60 * 60}`;

console.log('✅ Token válido definido nos cookies');

// Verificar se foi definido corretamente
const cookies = document.cookie.split(';');
const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));

if (authCookie) {
    const token = authCookie.split('=')[1];
    console.log('✅ Token encontrado nos cookies:', token.substring(0, 20) + '...');
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Payload do token:', payload);
        console.log('⏰ Expira em:', new Date(payload.exp * 1000));
    } catch (error) {
        console.log('❌ Erro ao decodificar token:', error.message);
    }
} else {
    console.log('❌ Token não foi definido corretamente');
}

console.log('\n🎉 Agora recarregue a página e teste o chat!');
console.log('💡 O erro "Ticket não encontrado" deve desaparecer');
