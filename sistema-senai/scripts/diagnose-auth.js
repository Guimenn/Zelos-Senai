#!/usr/bin/env node

/**
 * Script de Diagnóstico de Autenticação
 * Identifica problemas com tokens e autenticação
 */

const fs = require('fs')
const path = require('path')

console.log('🔐 DIAGNÓSTICO DE AUTENTICAÇÃO\n')

// Função para verificar arquivos de configuração
function checkConfigFiles() {
  console.log('📁 Verificando arquivos de configuração...')
  
  const configFiles = [
    '.env.local',
    '.env',
    'env.local.example'
  ]
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} encontrado`)
      
      // Verificar variáveis críticas
      const content = fs.readFileSync(filePath, 'utf8')
      const hasSupabaseUrl = content.includes('NEXT_PUBLIC_SUPABASE_API_URL')
      const hasSupabaseKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      
      if (hasSupabaseUrl) console.log(`   ✅ NEXT_PUBLIC_SUPABASE_API_URL configurado`)
      else console.log(`   ❌ NEXT_PUBLIC_SUPABASE_API_URL não encontrado`)
      
      if (hasSupabaseKey) console.log(`   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurado`)
      else console.log(`   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado`)
      
    } else {
      console.log(`❌ ${file} não encontrado`)
    }
  })
}

// Função para verificar dependências
function checkDependencies() {
  console.log('\n📦 Verificando dependências...')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    const requiredDeps = [
      '@supabase/supabase-js',
      'jwt-decode',
      'next'
    ]
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep} instalado`)
      } else {
        console.log(`❌ ${dep} não instalado`)
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao ler package.json:', error.message)
  }
}

// Função para verificar estrutura de arquivos
function checkFileStructure() {
  console.log('\n📂 Verificando estrutura de arquivos...')
  
  const requiredFiles = [
    'utils/tokenManager.ts',
    'utils/cookies.ts',
    'hooks/useAuth.ts',
    'lib/supabase-secure.ts'
  ]
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} encontrado`)
    } else {
      console.log(`❌ ${file} não encontrado`)
    }
  })
}

// Função para verificar configurações do navegador
function checkBrowserConfig() {
  console.log('\n🌐 Verificando configurações do navegador...')
  
  console.log('💡 Para verificar no navegador:')
  console.log('   1. Abra o DevTools (F12)')
  console.log('   2. Vá para a aba Console')
  console.log('   3. Digite: localStorage.getItem("auth_token")')
  console.log('   4. Verifique se há erros de CORS ou SSL')
  console.log('   5. Verifique a aba Network para erros 401')
}

// Função para verificar problemas comuns
function checkCommonIssues() {
  console.log('\n🔍 Verificando problemas comuns...')
  
  console.log('🚨 PROBLEMAS FREQUENTES:')
  console.log('   1. Token expirado - Verificar expiração do JWT')
  console.log('   2. Token inválido - Verificar formato e assinatura')
  console.log('   3. Problemas de CORS - Verificar configurações do backend')
  console.log('   4. Problemas de SSL - Verificar certificados')
  console.log('   5. Cache desatualizado - Limpar cache do navegador')
  console.log('   6. Sessão perdida - Verificar persistência de dados')
}

// Função para gerar soluções
function generateSolutions() {
  console.log('\n💡 SOLUÇÕES RECOMENDADAS:')
  
  console.log('1. 🔄 Renovar Token:')
  console.log('   - Implementar refresh automático')
  console.log('   - Verificar expiração antes de usar')
  console.log('   - Implementar retry em caso de falha')
  
  console.log('\n2. 🧹 Limpar Cache:')
  console.log('   - Limpar localStorage/sessionStorage')
  console.log('   - Limpar cookies de autenticação')
  console.log('   - Forçar logout e novo login')
  
  console.log('\n3. 🔒 Verificar Configurações:')
  console.log('   - Verificar variáveis de ambiente')
  console.log('   - Verificar configurações do Supabase')
  console.log('   - Verificar configurações de CORS')
  
  console.log('\n4. 🐛 Debug:')
  console.log('   - Adicionar logs detalhados')
  console.log('   - Verificar console do navegador')
  console.log('   - Verificar logs do backend')
}

// Função principal
function runDiagnosis() {
  console.log('🚀 Iniciando diagnóstico de autenticação...\n')
  
  checkConfigFiles()
  checkDependencies()
  checkFileStructure()
  checkBrowserConfig()
  checkCommonIssues()
  generateSolutions()
  
  console.log('\n✅ Diagnóstico concluído!')
  console.log('💡 Use as informações acima para resolver problemas de autenticação')
}

// Executar diagnóstico
runDiagnosis().catch(console.error)
