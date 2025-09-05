// Script para debug do token no frontend
// Execute no console do navegador

console.log('🔧 Debug do token de autenticação...\n');

// Verificar se existe token nos cookies
const cookies = document.cookie.split(';');
const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));

if (authCookie) {
    const token = authCookie.split('=')[1];
    console.log('✅ Token encontrado nos cookies');
    console.log('🔑 Token:', token);
    
    try {
        // Decodificar o token
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Payload do token:', payload);
        
        // Verificar se está expirado
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.log('❌ Token expirado!');
            console.log('⏰ Expirou em:', new Date(payload.exp * 1000));
            console.log('⏰ Agora:', new Date(now * 1000));
        } else {
            console.log('✅ Token válido');
            console.log('⏰ Expira em:', new Date(payload.exp * 1000));
        }
    } catch (error) {
        console.log('❌ Erro ao decodificar token:', error.message);
    }
} else {
    console.log('❌ Token não encontrado nos cookies');
    console.log('💡 Faça login novamente');
}

// Verificar localStorage
const localToken = localStorage.getItem('auth_token');
if (localToken) {
    console.log('✅ Token encontrado no localStorage:', localToken);
} else {
    console.log('❌ Token não encontrado no localStorage');
}

// Verificar sessionStorage
const sessionToken = sessionStorage.getItem('auth_token');
if (sessionToken) {
    console.log('✅ Token encontrado no sessionStorage:', sessionToken);
} else {
    console.log('❌ Token não encontrado no sessionStorage');
}
