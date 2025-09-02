#!/usr/bin/env node

/**
 * Script de Diagnóstico de SSL para Supabase
 * Identifica problemas de certificado e conectividade
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')

const SUPABASE_URL = 'https://pyrxlymsoidmjxjenesb.supabase.co'

console.log('🔍 DIAGNÓSTICO DE SSL PARA SUPABASE\n')

// Função para verificar certificado SSL
async function checkSSLCertificate(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      method: 'GET',
      path: '/auth/v1/health',
      rejectUnauthorized: false, // Para capturar erros de certificado
      timeout: 10000
    }
    
    const req = https.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`)
      console.log(`✅ Headers: ${JSON.stringify(res.headers, null, 2)}`)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log(`✅ Resposta: ${data}`)
        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })
    
    req.on('error', (error) => {
      console.error(`❌ Erro de SSL: ${error.message}`)
      console.error(`❌ Código: ${error.code}`)
      
      if (error.code === 'ERR_CERT_AUTHORITY_INVALID') {
        console.error('🚨 PROBLEMA CRÍTICO: Certificado SSL inválido!')
        console.error('💡 Soluções:')
        console.error('   1. Verificar se o domínio está correto')
        console.error('   2. Verificar se o certificado não expirou')
        console.error('   3. Verificar configurações de DNS')
        console.error('   4. Contatar suporte do Supabase')
      }
      
      resolve({
        success: false,
        error: error.message,
        code: error.code
      })
    })
    
    req.on('timeout', () => {
      console.error('⏰ Timeout na requisição')
      req.destroy()
      resolve({
        success: false,
        error: 'Timeout',
        code: 'TIMEOUT'
      })
    })
    
    req.end()
  })
}

// Função para verificar conectividade HTTP
async function checkHTTPConnectivity(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      method: 'GET',
      path: '/auth/v1/health',
      timeout: 10000
    }
    
    const req = http.request(options, (res) => {
      console.log(`✅ HTTP Status: ${res.statusCode}`)
      resolve({
        success: true,
        statusCode: res.statusCode
      })
    })
    
    req.on('error', (error) => {
      console.error(`❌ Erro HTTP: ${error.message}`)
      resolve({
        success: false,
        error: error.message
      })
    })
    
    req.on('timeout', () => {
      console.error('⏰ Timeout HTTP')
      req.destroy()
      resolve({
        success: false,
        error: 'Timeout'
      })
    })
    
    req.end()
  })
}

// Função para verificar DNS
async function checkDNS(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    const dns = require('dns')
    
    dns.lookup(urlObj.hostname, (err, address, family) => {
      if (err) {
        console.error(`❌ Erro DNS: ${err.message}`)
        resolve({
          success: false,
          error: err.message
        })
      } else {
        console.log(`✅ DNS: ${urlObj.hostname} -> ${address} (IPv${family})`)
        resolve({
          success: true,
          address: address,
          family: family
        })
      }
    })
  })
}

// Função para verificar conectividade de rede
async function checkNetworkConnectivity() {
  console.log('🌐 Verificando conectividade de rede...')
  
  try {
    const dns = require('dns')
    const util = require('util')
    const lookup = util.promisify(dns.lookup)
    
    // Verificar conectividade com Google DNS
    await lookup('8.8.8.8')
    console.log('✅ Conectividade de rede: OK')
    return true
  } catch (error) {
    console.error('❌ Problema de conectividade de rede:', error.message)
    return false
  }
}

// Função principal de diagnóstico
async function runDiagnosis() {
  console.log('🚀 Iniciando diagnóstico completo...\n')
  
  // 1. Verificar conectividade de rede
  const networkOk = await checkNetworkConnectivity()
  if (!networkOk) {
    console.error('❌ Problema de conectividade de rede detectado')
    console.error('💡 Verifique sua conexão com a internet')
    return
  }
  
  console.log('')
  
  // 2. Verificar DNS
  console.log('🔍 Verificando resolução DNS...')
  const dnsResult = await checkDNS(SUPABASE_URL)
  
  console.log('')
  
  // 3. Verificar conectividade HTTP (se disponível)
  console.log('🔍 Verificando conectividade HTTP...')
  const httpResult = await checkHTTPConnectivity(SUPABASE_URL)
  
  console.log('')
  
  // 4. Verificar certificado SSL
  console.log('🔍 Verificando certificado SSL...')
  const sslResult = await checkSSLCertificate(SUPABASE_URL)
  
  console.log('\n📊 RESUMO DO DIAGNÓSTICO')
  console.log('========================')
  console.log(`🌐 Rede: ${networkOk ? '✅ OK' : '❌ PROBLEMA'}`)
  console.log(`🔍 DNS: ${dnsResult.success ? '✅ OK' : '❌ PROBLEMA'}`)
  console.log(`🌐 HTTP: ${httpResult.success ? '✅ OK' : '❌ PROBLEMA'}`)
  console.log(`🔒 SSL: ${sslResult.success ? '✅ OK' : '❌ PROBLEMA'}`)
  
  if (!sslResult.success) {
    console.log('\n🚨 PROBLEMA PRINCIPAL: SSL/Certificado')
    console.log('💡 SOLUÇÕES RECOMENDADAS:')
    console.log('   1. Verificar se o domínio está correto')
    console.log('   2. Limpar cache do navegador')
    console.log('   3. Verificar configurações de proxy/firewall')
    console.log('   4. Contatar suporte do Supabase')
    console.log('   5. Verificar se há problemas regionais')
  } else {
    console.log('\n✅ Todos os testes passaram!')
    console.log('💡 Se ainda houver problemas, pode ser:')
    console.log('   - Configuração incorreta do cliente')
    console.log('   - Problemas de CORS')
    console.log('   - Rate limiting')
  }
}

// Executar diagnóstico
runDiagnosis().catch(console.error)
