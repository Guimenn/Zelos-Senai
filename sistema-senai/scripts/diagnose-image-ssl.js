#!/usr/bin/env node

/**
 * Script para diagnosticar problemas SSL com imagens do Supabase
 * Executa testes de conectividade e sugere soluções
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')

// Configurações
const SUPABASE_URLS = [
  'https://pyrxlymsoidmjxjenesb.supabase.co',
  'https://pyrxlymsoidmjxjenesb.supabase.co/storage/v1/object/public/avatars',
  'https://pyrxlymsoidmjxjenesb.supabase.co/storage/v1/object/public'
]

const TEST_IMAGES = [
  'https://pyrxlymsoidmjxjenesb.supabase.co/storage/v1/object/public/avatars/user-1756324628127.jpg',
  'https://pyrxlymsoidmjxjenesb.supabase.co/storage/v1/object/public/avatars/default-avatar.png'
]

/**
 * Testa conectividade HTTPS com diferentes configurações
 */
async function testHTTPSConnectivity(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    const config = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: options.timeout || 10000,
      rejectUnauthorized: options.rejectUnauthorized !== false,
      ...options
    }

    const req = https.request(config, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        headers: res.headers,
        url: url
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code,
        url: url
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Timeout',
        code: 'TIMEOUT',
        url: url
      })
    })

    req.setTimeout(config.timeout)
    req.end()
  })
}

/**
 * Testa conectividade HTTP (fallback)
 */
async function testHTTPConnectivity(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url.replace('https://', 'http://'))
    const config = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: options.timeout || 10000,
      ...options
    }

    const req = http.request(config, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        headers: res.headers,
        url: url.replace('https://', 'http://')
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code,
        url: url.replace('https://', 'http://')
      })
      req.destroy()
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Timeout',
        code: 'TIMEOUT',
        url: url.replace('https://', 'http://')
      })
    })

    req.setTimeout(config.timeout)
    req.end()
  })
}

/**
 * Testa carregamento de imagem específica
 */
async function testImageLoad(imageUrl) {
  console.log(`\n🔍 Testando carregamento de imagem: ${imageUrl}`)
  
  // Teste 1: HTTPS com verificação SSL
  console.log('  📡 Testando HTTPS com verificação SSL...')
  const httpsResult = await testHTTPSConnectivity(imageUrl, { rejectUnauthorized: true })
  
  if (httpsResult.success) {
    console.log(`  ✅ HTTPS funcionando: Status ${httpsResult.statusCode}`)
    return { success: true, method: 'https', result: httpsResult }
  }
  
  console.log(`  ❌ HTTPS falhou: ${httpsResult.error} (${httpsResult.code})`)
  
  // Teste 2: HTTPS sem verificação SSL
  console.log('  📡 Testando HTTPS sem verificação SSL...')
  const httpsInsecureResult = await testHTTPSConnectivity(imageUrl, { rejectUnauthorized: false })
  
  if (httpsInsecureResult.success) {
    console.log(`  ⚠️  HTTPS funciona sem verificação SSL: Status ${httpsInsecureResult.statusCode}`)
    return { success: true, method: 'https_insecure', result: httpsInsecureResult }
  }
  
  console.log(`  ❌ HTTPS sem verificação SSL falhou: ${httpsInsecureResult.error}`)
  
  // Teste 3: HTTP (fallback)
  console.log('  📡 Testando HTTP como fallback...')
  const httpResult = await testHTTPConnectivity(imageUrl)
  
  if (httpResult.success) {
    console.log(`  ⚠️  HTTP funciona: Status ${httpResult.statusCode}`)
    return { success: true, method: 'http', result: httpResult }
  }
  
  console.log(`  ❌ HTTP falhou: ${httpResult.error}`)
  
  return { success: false, method: 'none', result: null }
}

/**
 * Testa conectividade geral do Supabase
 */
async function testSupabaseConnectivity() {
  console.log('\n🌐 Testando conectividade geral do Supabase...')
  
  for (const url of SUPABASE_URLS) {
    console.log(`\n  📡 Testando: ${url}`)
    
    // Teste HTTPS
    const httpsResult = await testHTTPSConnectivity(url)
    if (httpsResult.success) {
      console.log(`    ✅ HTTPS: Status ${httpsResult.statusCode}`)
    } else {
      console.log(`    ❌ HTTPS: ${httpsResult.error} (${httpsResult.code})`)
    }
    
    // Teste HTTP
    const httpResult = await testHTTPConnectivity(url)
    if (httpResult.success) {
      console.log(`    ⚠️  HTTP: Status ${httpResult.statusCode}`)
    } else {
      console.log(`    ❌ HTTP: ${httpResult.error}`)
    }
  }
}

/**
 * Gera relatório de diagnóstico
 */
function generateDiagnosticReport(results) {
  console.log('\n📊 RELATÓRIO DE DIAGNÓSTICO')
  console.log('=' .repeat(50))
  
  const workingImages = results.filter(r => r.success)
  const failedImages = results.filter(r => !r.success)
  
  console.log(`\n📈 RESULTADOS:`)
  console.log(`  ✅ Imagens funcionando: ${workingImages.length}`)
  console.log(`  ❌ Imagens com falha: ${failedImages.length}`)
  console.log(`  📊 Taxa de sucesso: ${((workingImages.length / results.length) * 100).toFixed(1)}%`)
  
  if (workingImages.length > 0) {
    console.log(`\n✅ IMAGENS FUNCIONANDO:`)
    workingImages.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.method.toUpperCase()}: ${result.result.url}`)
    })
  }
  
  if (failedImages.length > 0) {
    console.log(`\n❌ IMAGENS COM FALHA:`)
    failedImages.forEach((result, index) => {
      console.log(`  ${index + 1}. Método: ${result.method}`)
      console.log(`     URL: ${result.result?.url || 'N/A'}`)
      console.log(`     Erro: ${result.result?.error || 'N/A'}`)
    })
  }
}

/**
 * Sugere soluções baseadas nos resultados
 */
function suggestSolutions(results) {
  console.log('\n💡 SUGESTÕES DE SOLUÇÃO')
  console.log('=' .repeat(50))
  
  const hasSSLIssues = results.some(r => !r.success && r.method === 'https')
  const hasWorkingInsecure = results.some(r => r.success && r.method === 'https_insecure')
  const hasWorkingHTTP = results.some(r => r.success && r.method === 'http')
  
  if (hasSSLIssues) {
    console.log('\n🔒 PROBLEMAS SSL DETECTADOS:')
    console.log('  • Certificado SSL inválido ou expirado')
    console.log('  • Problemas de configuração do servidor')
    console.log('  • Firewall ou proxy interferindo')
    
    if (hasWorkingInsecure) {
      console.log('\n✅ SOLUÇÃO TEMPORÁRIA DISPONÍVEL:')
      console.log('  • Usar HTTPS sem verificação SSL (não recomendado para produção)')
      console.log('  • Implementar fallback para HTTP')
    }
    
    if (hasWorkingHTTP) {
      console.log('\n✅ SOLUÇÃO DE FALLBACK DISPONÍVEL:')
      console.log('  • Usar HTTP como fallback quando HTTPS falhar')
      console.log('  • Implementar sistema de retry automático')
    }
  }
  
  console.log('\n🛠️  SOLUÇÕES RECOMENDADAS:')
  console.log('  1. Implementar componente SecureImage com fallbacks')
  console.log('  2. Usar sistema de retry automático para imagens')
  console.log('  3. Configurar fallback para imagens padrão')
  console.log('  4. Implementar cache local de imagens')
  console.log('  5. Usar CDN alternativo se disponível')
  
  console.log('\n📝 CÓDIGO DE EXEMPLO:')
  console.log('  • Substituir <img> por <SecureImage>')
  console.log('  • Usar hook useSupabaseImage para estado')
  console.log('  • Implementar fallback automático')
}

/**
 * Executa diagnóstico completo
 */
async function runDiagnosis() {
  console.log('🔍 DIAGNÓSTICO DE IMAGENS SUPABASE')
  console.log('=' .repeat(50))
  console.log('Data/Hora:', new Date().toLocaleString('pt-BR'))
  console.log('URLs de teste:', TEST_IMAGES.length)
  
  try {
    // Teste de conectividade geral
    await testSupabaseConnectivity()
    
    // Teste de carregamento de imagens específicas
    const imageResults = []
    for (const imageUrl of TEST_IMAGES) {
      const result = await testImageLoad(imageUrl)
      imageResults.push(result)
    }
    
    // Gerar relatório
    generateDiagnosticReport(imageResults)
    
    // Sugerir soluções
    suggestSolutions(imageResults)
    
    console.log('\n✅ Diagnóstico concluído!')
    
  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.message)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runDiagnosis()
}

module.exports = {
  testHTTPSConnectivity,
  testHTTPConnectivity,
  testImageLoad,
  testSupabaseConnectivity,
  runDiagnosis
}
