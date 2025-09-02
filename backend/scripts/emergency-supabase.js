#!/usr/bin/env node

/**
 * Script de Emergência para Supabase
 * Ativa quando o banco está muito instável
 */

import { createSupabasePrismaClient, checkSupabaseHealth, reconnectSupabase } from '../src/config/supabase-optimized.js'

console.log('🚨 ATIVANDO MODO DE EMERGÊNCIA PARA SUPABASE...\n')

// Cliente de emergência
const emergencyClient = createSupabasePrismaClient()

// Verificar saúde do Supabase
async function emergencyCheck() {
  console.log('🔍 Verificando saúde do Supabase...')
  
  const health = await checkSupabaseHealth(emergencyClient)
  
  if (!health.healthy) {
    console.log(`❌ Supabase ${health.status}: ${health.message}`)
    console.log('🚨 Ativando modo de emergência...')
    
    // Aplicar configurações de emergência
    await applyEmergencyMode()
  } else {
    console.log(`✅ Supabase funcionando: ${health.duration}ms`)
  }
}

// Modo de emergência
async function applyEmergencyMode() {
  console.log('\n🆘 APLICANDO CONFIGURAÇÕES DE EMERGÊNCIA...')
  
  // 1. Reduzir timeouts
  process.env.REQUEST_TIMEOUT = '10000'
  process.env.RESPONSE_TIMEOUT = '10000'
  
  // 2. Reduzir pool de conexões
  process.env.MAX_CONNECTIONS = '2'
  
  // 3. Ativar cache agressivo
  process.env.CACHE_TTL = '600' // 10 minutos
  process.env.CACHE_MAX_KEYS = '1000'
  
  // 4. Configurar retry agressivo
  process.env.MAX_RETRIES = '5'
  process.env.RETRY_DELAY = '500'
  
  console.log('✅ Modo de emergência ativado!')
  console.log('📋 Configurações aplicadas:')
  console.log('   - Timeouts reduzidos')
  console.log('   - Pool de conexões mínimo')
  console.log('   - Cache agressivo')
  console.log('   - Retry agressivo')
}

// Executar verificação
emergencyCheck().catch(console.error)
