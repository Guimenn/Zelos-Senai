import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createColaborador() {
  try {
    console.log('👤 Criando colaborador...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('colaborador123', 12);

    // Criar usuário colaborador (Client)
    const result = await prisma.$executeRaw`
      INSERT INTO "user" (name, email, hashed_password, role, is_active, phone, position, created_at, modified_at)
      VALUES ('Colaborador Teste', 'colaborador@senai.com', ${hashedPassword}, 'Client', true, '(11) 77777-7777', 'Colaborador', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `;

    if (result > 0) {
      console.log('✅ Colaborador criado com sucesso!');
      console.log('📧 Email: colaborador@senai.com');
      console.log('🔑 Senha: colaborador123');
    } else {
      console.log('⚠️  Colaborador já existe ou não foi criado');
    }

    // Verificar se foi criado
    const colaborador = await prisma.user.findUnique({
      where: {
        email: 'colaborador@senai.com'
      }
    });

    if (colaborador) {
      console.log('✅ Colaborador encontrado no banco:');
      console.log('🆔 ID:', colaborador.id);
      console.log('📧 Email:', colaborador.email);
      console.log('👤 Nome:', colaborador.name);
      console.log('🔧 Role:', colaborador.role);
      console.log('✅ Ativo:', colaborador.is_active);

      // Criar registro de Client se não existir
      const existingClient = await prisma.client.findFirst({
        where: {
          user_id: colaborador.id
        }
      });

      if (!existingClient) {
        const client = await prisma.client.create({
          data: {
            user_id: colaborador.id,
            company: 'SENAI',
            client_type: 'Individual',
            department: 'TI'
          }
        });
        console.log('✅ Registro de Client criado:', client.id);
      } else {
        console.log('ℹ️  Registro de Client já existe:', existingClient.id);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao criar colaborador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createColaborador();

