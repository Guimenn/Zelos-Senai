import { PrismaClient } from '../src/generated/prisma/index.js';

// Configuração otimizada do Prisma para Supabase
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configurações para otimizar o pool de conexões
  log: ['error', 'warn'],
  // Configurações específicas para Supabase
  __internal: {
    engine: {
      // Reduzir o número de conexões simultâneas
      connectionLimit: 5,
      // Aumentar o timeout de conexão
      connectionTimeout: 30000,
      // Configurar pool de conexões
      pool: {
        min: 1,
        max: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
        propagateCreateError: false
      }
    }
  }
});

async function testOptimizedConnection() {
    try {
        console.log('🔧 Testando conexão otimizada com Supabase...');
        
        // Testar conexão simples
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Conexão básica funcionando:', result);
        
        // Testar contagem de usuários
        const userCount = await prisma.user.count();
        console.log('✅ Contagem de usuários:', userCount);
        
        // Testar busca de admin
        const admin = await prisma.user.findFirst({
            where: { role: 'Admin' },
            select: { id: true, name: true, email: true }
        });
        
        if (admin) {
            console.log('✅ Admin encontrado:', admin);
        } else {
            console.log('⚠️ Nenhum admin encontrado');
        }
        
        // Testar contagem de tickets
        const ticketCount = await prisma.ticket.count();
        console.log('✅ Contagem de tickets:', ticketCount);
        
        console.log('🎉 Todos os testes passaram!');
        
    } catch (error) {
        console.error('❌ Erro na conexão otimizada:', error);
        
        // Sugestões para resolver problemas de connection pool
        console.log('\n🔧 Sugestões para resolver problemas de connection pool:');
        console.log('1. Verifique se o DATABASE_URL está correto no .env');
        console.log('2. Certifique-se de que o Supabase está ativo');
        console.log('3. Verifique os limites do seu plano do Supabase');
        console.log('4. Considere usar connection pooling do Supabase');
        console.log('5. Implemente retry logic para conexões falhadas');
        
    } finally {
        await prisma.$disconnect();
    }
}

// Função para gerar configuração otimizada do Prisma
function generateOptimizedPrismaConfig() {
    console.log('\n📝 Configuração otimizada para o schema.prisma:');
    console.log(`
// Adicione estas configurações ao seu schema.prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../src/generated/prisma"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  
  // Configurações para Supabase
  relationMode = "prisma"
}

// Configuração do cliente Prisma otimizada
// No seu arquivo de configuração do Prisma Client:
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
    `);
}

// Função para verificar configurações do Supabase
function checkSupabaseConfig() {
    console.log('\n🔍 Verificações para o Supabase:');
    console.log('1. Verifique se DATABASE_URL está configurado corretamente');
    console.log('2. Certifique-se de que DIRECT_URL também está configurado');
    console.log('3. Verifique os limites do seu plano:');
    console.log('   - Free: 500MB, 2 conexões simultâneas');
    console.log('   - Pro: 8GB, 100 conexões simultâneas');
    console.log('   - Team: 100GB, 500 conexões simultâneas');
    console.log('4. Use connection pooling se disponível');
    console.log('5. Implemente retry logic para falhas de conexão');
}

testOptimizedConnection();
generateOptimizedPrismaConfig();
checkSupabaseConfig();
