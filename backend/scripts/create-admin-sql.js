import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Criando administrador...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Usar SQL direto para evitar problemas de conexão
    const result = await prisma.$executeRaw`
      INSERT INTO "user" (name, email, hashed_password, role, is_active, phone, position, created_at, modified_at)
      VALUES ('Administrador', 'admin@senai.com', ${hashedPassword}, 'Admin', true, '(11) 99999-9999', 'Administrador do Sistema', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `;

    if (result > 0) {
      console.log('✅ Administrador criado com sucesso!');
      console.log('📧 Email: admin@senai.com');
      console.log('🔑 Senha: admin123');
    } else {
      console.log('⚠️  Administrador já existe ou não foi criado');
    }

    // Verificar se foi criado
    const admin = await prisma.user.findUnique({
      where: {
        email: 'admin@senai.com'
      }
    });

    if (admin) {
      console.log('✅ Administrador encontrado no banco:');
      console.log('🆔 ID:', admin.id);
      console.log('📧 Email:', admin.email);
      console.log('👤 Nome:', admin.name);
    }

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createAdmin();

