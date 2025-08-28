import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function createCategories() {
  try {
    console.log('🔧 Criando categorias básicas...');
    
    const categories = [
      {
        name: 'Sistema',
        description: 'Problemas relacionados ao sistema',
        color: '#3B82F6',
        icon: 'computer'
      },
      {
        name: 'Hardware',
        description: 'Problemas com equipamentos físicos',
        color: '#EF4444',
        icon: 'desktop'
      },
      {
        name: 'Software',
        description: 'Problemas com programas e aplicações',
        color: '#10B981',
        icon: 'code'
      },
      {
        name: 'Rede',
        description: 'Problemas de conectividade e rede',
        color: '#F59E0B',
        icon: 'wifi'
      },
      {
        name: 'Outros',
        description: 'Outros tipos de problemas',
        color: '#8B5CF6',
        icon: 'question'
      }
    ];

    for (const category of categories) {
      try {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ Categoria "${category.name}" criada`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Categoria "${category.name}" já existe`);
        } else {
          console.error(`❌ Erro ao criar categoria "${category.name}":`, error);
        }
      }
    }

    console.log('✅ Categorias criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createCategories();

