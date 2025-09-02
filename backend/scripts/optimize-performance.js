#!/usr/bin/env node

/**
 * Script de Otimização de Performance
 * Sistema de Helpdesk SENAI
 * 
 * Este script configura automaticamente todas as otimizações de performance
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🚀 Iniciando otimização de performance do Sistema de Helpdesk SENAI...\n')

// Função para executar comandos
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`)
    execSync(command, { cwd: rootDir, stdio: 'inherit' })
    console.log(`✅ ${description} concluído!\n`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao ${description.toLowerCase()}:`, error.message)
    return false
  }
}

// Função para verificar se arquivo existe
function checkFile(path) {
  return existsSync(join(rootDir, path))
}

// Função para criar arquivo se não existir
function createFileIfNotExists(path, content) {
  const fullPath = join(rootDir, path)
  if (!existsSync(fullPath)) {
    writeFileSync(fullPath, content)
    console.log(`📄 Arquivo ${path} criado`)
  }
}

// Função para verificar dependências
function checkDependencies() {
  console.log('🔍 Verificando dependências...')
  
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'))
  const requiredDeps = [
    'express-rate-limit',
    'ioredis',
    'node-cache',
    'rate-limit-redis',
    'compression',
    'helmet'
  ]
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep])
  
  if (missingDeps.length > 0) {
    console.log(`⚠️ Dependências faltando: ${missingDeps.join(', ')}`)
    console.log('📦 Instalando dependências faltantes...')
    
    const installCommand = `npm install ${missingDeps.join(' ')}`
    if (!runCommand(installCommand, 'Instalação de dependências')) {
      console.error('❌ Falha ao instalar dependências')
      process.exit(1)
    }
  } else {
    console.log('✅ Todas as dependências estão instaladas\n')
  }
}

// Função para configurar banco de dados
function setupDatabase() {
  console.log('🗄️ Configurando banco de dados...')
  
  // Gerar cliente Prisma
  if (!runCommand('npx prisma generate', 'Geração do cliente Prisma')) {
    console.error('❌ Falha ao gerar cliente Prisma')
    return false
  }
  
  // Verificar status das migrações
  try {
    execSync('npx prisma migrate status', { cwd: rootDir, stdio: 'pipe' })
    console.log('✅ Migrações do banco verificadas\n')
  } catch (error) {
    console.log('⚠️ Migrações não encontradas, criando migração inicial...')
    if (!runCommand('npx prisma migrate dev --name init', 'Migração inicial do banco')) {
      console.error('❌ Falha ao criar migração inicial')
      return false
    }
  }
  
  return true
}

// Função para configurar cache Redis
function setupRedis() {
  console.log('🔴 Configurando Redis...')
  
  // Verificar se Redis está rodando
  try {
    execSync('redis-cli ping', { stdio: 'pipe' })
    console.log('✅ Redis está rodando\n')
  } catch (error) {
    console.log('⚠️ Redis não está rodando')
    console.log('💡 Para instalar Redis:')
    console.log('   Windows: https://github.com/microsoftarchive/redis/releases')
    console.log('   macOS: brew install redis')
    console.log('   Linux: sudo apt-get install redis-server')
    console.log('   Docker: docker run -d -p 6379:6379 redis:alpine\n')
  }
}

// Função para configurar variáveis de ambiente
function setupEnvironment() {
  console.log('⚙️ Configurando variáveis de ambiente...')
  
  const envPath = join(rootDir, '.env')
  const envExamplePath = join(rootDir, 'env.example')
  
  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    console.log('📋 Copiando arquivo de exemplo...')
    const envContent = readFileSync(envExamplePath, 'utf8')
    writeFileSync(envPath, envContent)
    console.log('✅ Arquivo .env criado a partir do exemplo')
    console.log('⚠️ IMPORTANTE: Edite o arquivo .env com suas configurações reais!\n')
  } else if (existsSync(envPath)) {
    console.log('✅ Arquivo .env já existe\n')
  } else {
    console.log('⚠️ Arquivo .env não encontrado, criando básico...')
    const basicEnv = `# Configurações básicas
DATABASE_URL="postgresql://username:password@localhost:5432/helpdesk_db"
DIRECT_URL="postgresql://username:password@localhost:5432/helpdesk_db"
JWT_SECRET="your-secret-key-here"
PORT=3001
NODE_ENV=development`
    
    writeFileSync(envPath, basicEnv)
    console.log('✅ Arquivo .env básico criado')
    console.log('⚠️ IMPORTANTE: Configure as variáveis de ambiente no arquivo .env!\n')
  }
}

// Função para criar diretórios necessários
function createDirectories() {
  console.log('📁 Criando diretórios necessários...')
  
  const dirs = [
    'uploads',
    'logs',
    'temp',
    'cache'
  ]
  
  dirs.forEach(dir => {
    const fullPath = join(rootDir, dir)
    if (!existsSync(fullPath)) {
      execSync(`mkdir -p "${fullPath}"`, { cwd: rootDir })
      console.log(`📁 Diretório ${dir} criado`)
    }
  })
  
  console.log('✅ Diretórios criados\n')
}

// Função para configurar logs
function setupLogging() {
  console.log('📝 Configurando sistema de logs...')
  
  const logConfig = `// Configuração de logs otimizada
export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  transports: [
    {
      filename: 'logs/app.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }
  ]
}`
  
  createFileIfNotExists('src/config/logging.js', logConfig)
  console.log('✅ Sistema de logs configurado\n')
}

// Função para criar script de monitoramento
function createMonitoringScript() {
  console.log('📊 Criando script de monitoramento...')
  
  const monitoringScript = `#!/usr/bin/env node

/**
 * Script de Monitoramento de Performance
 */

import { getPerformanceStats, clearPerformanceMetrics } from '../src/middlewares/performance.js'

console.log('📊 Estatísticas de Performance do Sistema')
console.log('=====================================\n')

// Mostrar estatísticas atuais
const stats = getPerformanceStats()
console.log('📈 Estatísticas Gerais:')
console.log(`   Uptime: ${stats.uptime}s`)
console.log(`   Total de Requisições: ${stats.totalRequests}`)
console.log(`   Requisições Lentas: ${stats.slowRequests}`)
console.log(`   Erros: ${stats.errors}`)
console.log(`   Tempo Médio de Resposta: ${stats.averageResponseTime}ms`)
console.log(`   Taxa de Erro: ${stats.errorRate}%`)
console.log(`   Taxa de Requisições Lentas: ${stats.slowRequestRate}%\n`)

// Limpar métricas se solicitado
if (process.argv.includes('--clear')) {
  clearPerformanceMetrics()
  console.log('🧹 Métricas limpas!')
}

console.log('\n💡 Use --clear para limpar métricas acumuladas')`
  
  createFileIfNotExists('scripts/monitor-performance.js', monitoringScript)
  
  // Tornar executável
  try {
    execSync(`chmod +x "${join(rootDir, 'scripts/monitor-performance.js')}"`)
  } catch (error) {
    // Windows não suporta chmod
  }
  
  console.log('✅ Script de monitoramento criado\n')
}

// Função para executar testes de performance
async function runPerformanceTests() {
  console.log('🧪 Executando testes de performance...')
  
  // Teste básico de conectividade
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    console.log(`✅ Teste de conectividade: ${duration}ms`)
    
    if (duration > 1000) {
      console.log('⚠️ Conexão lenta detectada - considere otimizar configurações')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.log('❌ Erro no teste de conectividade:', error.message)
  }
  
  console.log('✅ Testes de performance concluídos\n')
}

// Função principal
async function main() {
  try {
    // Verificar dependências
    checkDependencies()
    
    // Configurar variáveis de ambiente
    setupEnvironment()
    
    // Criar diretórios
    createDirectories()
    
    // Configurar banco de dados
    if (!setupDatabase()) {
      console.error('❌ Falha na configuração do banco')
      process.exit(1)
    }
    
    // Configurar Redis
    setupRedis()
    
    // Configurar logs
    setupLogging()
    
    // Criar script de monitoramento
    createMonitoringScript()
    
    // Executar testes
    await runPerformanceTests()
    
    console.log('🎉 Otimização de performance concluída com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Configure suas variáveis de ambiente no arquivo .env')
    console.log('2. Inicie o servidor: npm run dev')
    console.log('3. Monitore performance: node scripts/monitor-performance.js')
    console.log('4. Verifique logs em: logs/app.log')
    
  } catch (error) {
    console.error('❌ Erro durante otimização:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default main
