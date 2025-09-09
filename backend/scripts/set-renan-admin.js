import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setRenanAsAdmin() {
  try {
    console.log('🔧 Definindo renan.queiroz08sr@gmail.com como Admin Master...');
    
    const email = 'renan.queiroz08sr@gmail.com';
    
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      console.log('❌ Usuário não encontrado:', email);
      console.log('💡 Criando usuário como Admin Master...');
      
      // Hash da senha padrão
      const hashedPassword = await bcrypt.hash('Renan123', 12);

      // Criar usuário como Admin
      const newUser = await prisma.user.create({
        data: {
          name: 'Renan Queiroz',
          email: email,
          hashed_password: hashedPassword,
          role: 'Admin',
          is_active: true,
          phone: '(11) 99999-9999',
          position: 'Administrador Master'
        }
      });

      console.log('✅ Usuário criado como Admin Master!');
      console.log('📧 Email:', newUser.email);
      console.log('👤 Nome:', newUser.name);
      console.log('🔑 Senha: Renan123');
      console.log('🆔 ID:', newUser.id);
      console.log('👑 Role:', newUser.role);

    } else {
      console.log('✅ Usuário encontrado:', existingUser.email);
      console.log('🔧 Atualizando role para Admin Master...');
      
      // Atualizar role para Admin
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          role: 'Admin',
          is_active: true,
          position: 'Administrador Master'
        }
      });

      console.log('✅ Usuário atualizado para Admin Master!');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Nome:', updatedUser.name);
      console.log('🆔 ID:', updatedUser.id);
      console.log('👑 Role:', updatedUser.role);
      console.log('📋 Position:', updatedUser.position);
    }

    // Verificar se foi aplicado corretamente
    const finalUser = await prisma.user.findUnique({
      where: { email }
    });

    if (finalUser && finalUser.role === 'Admin') {
      console.log('🎉 SUCESSO! Usuário renan.queiroz08sr@gmail.com é agora Admin Master!');
      console.log('📊 Status final:');
      console.log('   - ID:', finalUser.id);
      console.log('   - Email:', finalUser.email);
      console.log('   - Nome:', finalUser.name);
      console.log('   - Role:', finalUser.role);
      console.log('   - Ativo:', finalUser.is_active);
      console.log('   - Position:', finalUser.position);
    } else {
      console.log('❌ ERRO! Não foi possível definir como Admin Master');
    }

  } catch (error) {
    console.error('❌ Erro ao definir usuário como Admin Master:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
setRenanAsAdmin();
