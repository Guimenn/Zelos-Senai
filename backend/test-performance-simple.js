#!/usr/bin/env node

/**
 * Script simples para testar performance das otimizações
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, name) {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const status = duration < 1000 ? '✅' : '❌';
        console.log(`${status} ${name}: ${duration}ms`);
        
        return { success: duration < 1000, duration };
    } catch (error) {
        console.log(`❌ ${name}: ERRO - ${error.message}`);
        return { success: false, duration: 9999 };
    }
}

async function runTests() {
    console.log('🚀 Testando performance das otimizações...\n');
    
    const tests = [
        { endpoint: '/health', name: 'Health Check' },
        { endpoint: '/admin/statistics', name: 'Estatísticas Admin' },
        { endpoint: '/helpdesk/tickets', name: 'Lista de Tickets' },
        { endpoint: '/helpdesk/tickets?status=Open', name: 'Tickets Abertos' },
        { endpoint: '/helpdesk/tickets?priority=High', name: 'Tickets Prioritários' }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testEndpoint(test.endpoint, test.name);
        results.push(result);
        
        // Aguardar um pouco entre os testes
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Resumo
    console.log('\n📊 Resumo:');
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    console.log(`✅ Sucessos: ${successful}/${total}`);
    console.log(`📈 Tempo médio: ${avgTime.toFixed(2)}ms`);
    
    if (successful === total) {
        console.log('\n🎉 TODAS AS REQUISIÇÕES RESPONDERAM EM MENOS DE 1 SEGUNDO!');
        console.log('🚀 Otimizações funcionando perfeitamente!');
    } else {
        console.log('\n⚠️ Algumas requisições ainda estão lentas.');
        console.log('🔧 Revise as otimizações implementadas.');
    }
}

// Executar testes
runTests().catch(console.error);
