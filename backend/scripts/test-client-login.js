import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

async function testClientLogin() {
    try {
        console.log('🧪 Testando login de cliente...');
        
        // Buscar um usuário cliente
        const clientUser = await prisma.user.findFirst({
            where: { role: 'Client' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                hashed_password: true,
                is_active: true
            }
        });
        
        if (!clientUser) {
            console.log('❌ Nenhum usuário cliente encontrado');
            return;
        }
        
        console.log('👤 Usuário cliente encontrado:', {
            id: clientUser.id,
            name: clientUser.name,
            email: clientUser.email,
            role: clientUser.role,
            is_active: clientUser.is_active
        });
        
        // Verificar a senha hash atual
        console.log('🔐 Hash da senha atual:', clientUser.hashed_password);
        
        // Testar diferentes senhas comuns
        const testPasswords = ['123456', 'password', 'admin', '123456789', 'qwerty'];
        
        let foundPassword = null;
        for (const password of testPasswords) {
            const correctPassword = await bcrypt.compare(password, clientUser.hashed_password);
            console.log(`🔐 Testando senha '${password}': ${correctPassword ? '✅ Correta' : '❌ Incorreta'}`);
            if (correctPassword) {
                console.log('✅ Senha encontrada:', password);
                foundPassword = password;
                break;
            }
        }
        
        if (!foundPassword) {
            console.log('❌ Nenhuma senha comum funcionou');
            return;
        }
        
        console.log('✅ Senha correta:', foundPassword);
        
        // Gerar token como no login controller
        const payload = {
            userId: clientUser.id,
            name: clientUser.name,
            email: clientUser.email,
            userRole: clientUser.role
        };
        
        console.log('🔐 Payload do token:', payload);
        
        const token = jwt.sign(payload, SECRET, {
            expiresIn: '24h',
        });
        
        console.log('🔐 Token gerado:', token.substring(0, 50) + '...');
        
        // Decodificar token para verificar
        const decoded = jwt.verify(token, SECRET);
        console.log('🔍 Token decodificado:', {
            userId: decoded.userId,
            name: decoded.name,
            email: decoded.email,
            userRole: decoded.userRole,
            role: decoded.role
        });
        
        // Testar role comparison
        const userRole = decoded.userRole || decoded.role;
        const allowedRoles = ['Client'];
        
        console.log('🔍 Teste de permissão:', {
            userRole,
            allowedRoles,
            hasRole: !!userRole,
            isAllowed: allowedRoles.includes(userRole),
            comparison: userRole === 'Client'
        });
        
        if (allowedRoles.includes(userRole)) {
            console.log('✅ Usuário tem permissão para acessar páginas de Client');
        } else {
            console.log('❌ Usuário NÃO tem permissão para acessar páginas de Client');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testClientLogin();
