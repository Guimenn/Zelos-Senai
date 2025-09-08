import jwt from 'jsonwebtoken';

// Teste de token
const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

// Token de exemplo (você pode substituir por um token real)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJBZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ1c2VyUm9sZSI6IkFkbWluIiwiaWF0IjoxNzM2MzI0MDAwLCJleHAiOjE3MzY0MTA0MDB9.test';

try {
    const decoded = jwt.verify(testToken, secret);
    console.log('✅ Token válido:', decoded);
} catch (error) {
    console.log('❌ Token inválido:', error.message);
}

// Teste com token real do sistema
console.log('\n🔍 Testando com token real...');
console.log('Secret:', secret);
