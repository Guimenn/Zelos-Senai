# Hook de Autenticação - useAuth

Este hook fornece uma maneira centralizada e reutilizável de gerenciar autenticação em toda a aplicação, verificando automaticamente se o token existe, é válido e não está expirado.

## Funcionalidades

- ✅ Verificação automática de token no localStorage
- ✅ Validação de expiração do token
- ✅ Redirecionamento automático para login quando necessário
- ✅ Verificação de roles/permissões
- ✅ Limpeza automática de tokens inválidos
- ✅ Suporte a tokens antigos e novos (compatibilidade)

## Hooks Disponíveis

### `useAuth(options)`

Hook principal com opções configuráveis.

```typescript
interface UseAuthOptions {
  redirectTo?: string        // Página para redirecionar (padrão: '/pages/auth/login')
  requireAuth?: boolean      // Se requer autenticação (padrão: true)
  allowedRoles?: string[]    // Roles permitidas (opcional)
}
```

### `useRequireAuth(redirectTo?)`

Hook simplificado que requer autenticação.

```typescript
const { user, isAuthenticated, isLoading } = useRequireAuth()
```

### `useRequireRole(allowedRoles, redirectTo?)`

Hook que requer roles específicas.

```typescript
const { user, isAuthenticated, isLoading } = useRequireRole(['Admin', 'Manager'])
```

## Exemplos de Uso

### 1. Página que requer autenticação simples

```typescript
'use client'

import { useRequireAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <h1>Bem-vindo, {user?.name}!</h1>
      <p>Email: {user?.email}</p>
    </div>
  )
}
```

### 2. Página que requer role específica

```typescript
'use client'

import { useRequireRole } from '@/hooks/useAuth'

export default function AdminPage() {
  const { user, isLoading } = useRequireRole(['Admin'])

  if (isLoading) {
    return <div>Verificando permissões...</div>
  }

  return (
    <div>
      <h1>Painel Administrativo</h1>
      <p>Olá, {user?.name}! Você tem acesso de administrador.</p>
    </div>
  )
}
```

### 3. Página com verificação condicional

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'

export default function PublicPage() {
  const { user, isAuthenticated, hasRole } = useAuth({ requireAuth: false })

  return (
    <div>
      <h1>Página Pública</h1>
      {isAuthenticated ? (
        <div>
          <p>Logado como: {user?.name}</p>
          {hasRole('Admin') && (
            <button>Painel Admin</button>
          )}
        </div>
      ) : (
        <p>Você não está logado</p>
      )}
    </div>
  )
}
```

### 4. Verificação manual de roles

```typescript
'use client'

import { useRequireAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, hasRole, hasAnyRole, getUserRole } = useRequireAuth()

  const userRole = getUserRole()
  const isAdmin = hasRole('Admin')
  const canManageUsers = hasAnyRole(['Admin', 'Manager'])

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Sua role: {userRole}</p>
      
      {isAdmin && (
        <section>
          <h2>Seção Administrativa</h2>
          <p>Apenas administradores veem isso</p>
        </section>
      )}
      
      {canManageUsers && (
        <button>Gerenciar Usuários</button>
      )}
    </div>
  )
}
```

### 5. Logout programático

```typescript
'use client'

import { useRequireAuth } from '@/hooks/useAuth'

export default function Header() {
  const { user, logout } = useRequireAuth()

  const handleLogout = () => {
    logout() // Remove token e redireciona para login
  }

  return (
    <header>
      <span>Olá, {user?.name}</span>
      <button onClick={handleLogout}>Sair</button>
    </header>
  )
}
```

## Retorno do Hook

```typescript
interface UseAuthReturn {
  isAuthenticated: boolean | null  // null durante carregamento
  user: DecodedToken | null       // Dados do usuário do token
  isLoading: boolean              // Se está verificando autenticação
  logout: () => void              // Função para fazer logout
  getUserRole: () => string | null // Obtém a role do usuário
  hasRole: (role: string) => boolean // Verifica se tem role específica
  hasAnyRole: (roles: string[]) => boolean // Verifica se tem alguma das roles
}
```

## Comportamentos Automáticos

### Token Inválido ou Expirado
- Remove automaticamente do localStorage
- Redireciona para página de login
- Exibe log no console para debug

### Role Insuficiente
- Redireciona para `/pages/auth/unauthorized`
- Mantém o token válido
- Exibe log com roles necessárias

### Sem Token
- Redireciona imediatamente para login (se `requireAuth: true`)
- Permite acesso (se `requireAuth: false`)

## Compatibilidade

O hook suporta tanto tokens antigos quanto novos:

```typescript
// Token antigo
{
  userId: 123,
  userRole: "Admin",
  name: "João",
  email: "joao@email.com"
}

// Token novo
{
  id: 123,
  role: "Admin",
  name: "João",
  email: "joao@email.com"
}
```

## Páginas de Erro

- `/pages/auth/login` - Página de login padrão
- `/pages/auth/unauthorized` - Página para usuários sem permissão

## Debugging

O hook exibe logs úteis no console:

```
Token não encontrado, redirecionando para login
Token expirado, removendo do localStorage e redirecionando
Usuário com role 'User' não tem permissão. Roles permitidas: Admin, Manager
```

## Migração

Para migrar código existente:

### Antes
```typescript
useEffect(() => {
  const token = authCookies.getToken()
  if (!token) {
    router.push('/pages/auth/login')
    return
  }
  
  try {
    const decoded = jwtDecode(token)
    // verificações manuais...
  } catch (error) {
    router.push('/pages/auth/login')
  }
}, [])
```

### Depois
```typescript
const { user, isLoading } = useRequireAuth()

if (isLoading) return <Loading />
// user já está validado e disponível
```