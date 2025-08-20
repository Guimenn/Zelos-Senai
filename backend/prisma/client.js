import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garantir que o .env do diretório backend seja carregado ANTES de importar o PrismaClient
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug mínimo para verificar carregamento do .env
if (!process.env.DATABASE_URL) {
  console.error('[Prisma client] DATABASE_URL ausente após dotenv.config()');
}

// Import dinâmico para garantir que dotenv já foi aplicado
const { PrismaClient } = await import('../src/generated/prisma/client.js');

// Instância única do Prisma
const prisma = new PrismaClient();

export default prisma;
