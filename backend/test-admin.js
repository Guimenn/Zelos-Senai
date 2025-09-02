// Script simples para testar a API de admin
const fetch = require('node-fetch');

async function testAdminAPI() {
    try {
        console.log('🔍 Testando rota /admin/1...');

        const response = await fetch('http://localhost:3001/admin/1', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwiZW1haWwiOiJhZG1pbkBoZWxwZGVzay5jb20iLCJ1c2VyUm9sZSI6IkFkbWluIiwiaWF0IjoxNzU2ODQ0MTM4LCJleHAiOjE3NTY5MzA1Mzh9.-PcMuXp4JkNc_NHaf4_6BidKV8M9r2I_9z91bRpKWdM'
            }
        });

        console.log('📊 Status:', response.status);
        console.log('📝 Headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.text();
        console.log('📄 Response:', data);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    try {
        console.log('\n🔍 Testando rota /test-admin/1 (sem middleware)...');

        const response = await fetch('http://localhost:3001/test-admin/1', {
            method: 'GET'
        });

        console.log('📊 Status:', response.status);
        const data = await response.text();
        console.log('📄 Response:', data);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testAdminAPI();
