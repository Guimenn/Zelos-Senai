#!/usr/bin/env node

/**
 * Script para testar a performance das otimizações
 * Valida se o sistema está respondendo em menos de 1 segundo
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const TEST_ENDPOINTS = [
    '/health',
    '/admin/statistics',
    '/helpdesk/tickets',
    '/api/notifications',
    '/metrics'
];

const PERFORMANCE_THRESHOLD = 1000; // 1 segundo em ms

async function testEndpoint(endpoint, method = 'GET', body = null) {
    const startTime = Date.now();
    
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip, deflate'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
            endpoint,
            method,
            status: response.status,
            duration,
            size: response.headers.get('content-length') || 'unknown',
            compressed: response.headers.get('content-encoding') || 'none',
            success: response.ok && duration < PERFORMANCE_THRESHOLD
        };
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        return {
            endpoint,
            method,
            status: 'ERROR',
            duration,
            error: error.message,
            success: false
        };
    }
}

async function runPerformanceTests() {
    console.log('🚀 Iniciando testes de performance...\n');
    console.log(`📊 Limite de performance: ${PERFORMANCE_THRESHOLD}ms\n`);

    const results = [];

    // Teste 1: Endpoints básicos
    console.log('📋 Teste 1: Endpoints básicos');
    for (const endpoint of TEST_ENDPOINTS) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${endpoint} - ${result.duration}ms - ${result.status}`);
        
        if (result.compressed !== 'none') {
            console.log(`   📦 Compressão: ${result.compressed}`);
        }
    }

    // Teste 2: Cache de estatísticas
    console.log('\n📋 Teste 2: Cache de estatísticas');
    const cacheTest1 = await testEndpoint('/admin/statistics');
    const cacheTest2 = await testEndpoint('/admin/statistics');
    
    results.push(cacheTest1, cacheTest2);
    
    console.log(`🔄 Primeira requisição: ${cacheTest1.duration}ms`);
    console.log(`🔄 Segunda requisição: ${cacheTest2.duration}ms`);
    
    if (cacheTest2.duration < cacheTest1.duration * 0.5) {
        console.log('✅ Cache funcionando corretamente');
    } else {
        console.log('⚠️ Cache pode não estar funcionando');
    }

    // Teste 3: Lista de tickets com filtros
    console.log('\n📋 Teste 3: Lista de tickets com filtros');
    const ticketTests = [
        await testEndpoint('/helpdesk/tickets'),
        await testEndpoint('/helpdesk/tickets?status=Open'),
        await testEndpoint('/helpdesk/tickets?priority=High'),
        await testEndpoint('/helpdesk/tickets?page=1&limit=5')
    ];
    
    results.push(...ticketTests);
    
    ticketTests.forEach((test, index) => {
        const status = test.success ? '✅' : '❌';
        const filter = test.endpoint.includes('?') ? ` (${test.endpoint.split('?')[1]})` : '';
        console.log(`${status} Tickets${filter} - ${test.duration}ms`);
    });

    // Teste 4: Stress test
    console.log('\n📋 Teste 4: Teste de stress (10 requisições simultâneas)');
    const stressPromises = Array(10).fill().map(() => testEndpoint('/health'));
    const stressResults = await Promise.all(stressPromises);
    
    results.push(...stressResults);
    
    const avgStressTime = stressResults.reduce((sum, r) => sum + r.duration, 0) / stressResults.length;
    const maxStressTime = Math.max(...stressResults.map(r => r.duration));
    
    console.log(`📊 Tempo médio: ${avgStressTime.toFixed(2)}ms`);
    console.log(`📊 Tempo máximo: ${maxStressTime}ms`);
    
    if (avgStressTime < PERFORMANCE_THRESHOLD) {
        console.log('✅ Sistema estável sob carga');
    } else {
        console.log('⚠️ Sistema pode estar sobrecarregado');
    }

    // Resumo dos resultados
    console.log('\n📊 Resumo dos testes:');
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Testes falharam: ${failedTests.length}/${results.length}`);
    
    if (failedTests.length > 0) {
        console.log('\n❌ Endpoints que falharam:');
        failedTests.forEach(test => {
            console.log(`   - ${test.endpoint}: ${test.duration}ms (${test.status})`);
        });
    }

    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`📈 Tempo médio geral: ${avgTime.toFixed(2)}ms`);

    // Recomendações
    console.log('\n💡 Recomendações:');
    
    if (avgTime < 500) {
        console.log('🎉 Excelente! O sistema está muito rápido.');
    } else if (avgTime < 1000) {
        console.log('✅ Bom! O sistema está dentro do limite de 1 segundo.');
    } else {
        console.log('⚠️ Atenção! O sistema está acima do limite de 1 segundo.');
        console.log('   Considere:');
        console.log('   - Otimizar consultas do banco de dados');
        console.log('   - Implementar mais cache');
        console.log('   - Revisar índices do banco');
    }

    // Verificar compressão
    const compressedResponses = results.filter(r => r.compressed !== 'none');
    if (compressedResponses.length > 0) {
        console.log(`📦 Compressão ativa em ${compressedResponses.length} respostas`);
    } else {
        console.log('⚠️ Compressão não detectada');
    }

    console.log('\n🚀 Testes de performance concluídos!');
    
    return {
        totalTests: results.length,
        successfulTests: successfulTests.length,
        failedTests: failedTests.length,
        averageTime: avgTime,
        allUnderThreshold: failedTests.length === 0
    };
}

// Executar testes se o script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runPerformanceTests()
        .then(result => {
            if (result.allUnderThreshold) {
                console.log('\n🎯 OBJETIVO ALCANÇADO: Sistema respondendo em menos de 1 segundo!');
                process.exit(0);
            } else {
                console.log('\n⚠️ Alguns endpoints ainda estão lentos. Revise as otimizações.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Erro durante os testes:', error);
            process.exit(1);
        });
}

export { runPerformanceTests };
