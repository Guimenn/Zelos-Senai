import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Criando administrador...');
    
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'Admin'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Já existe um administrador no sistema:', existingAdmin.email);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@senai.com',
        hashed_password: hashedPassword,
        role: 'Admin',
        is_active: true,
        phone: '(11) 99999-9999',
        position: 'Administrador do Sistema'
      }
    });

    console.log('✅ Administrador criado com sucesso!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createAdmin();

