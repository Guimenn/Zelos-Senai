# Sistema de Dark Mode e Sidebar Responsiva - SENAI

## Visão Geral

O sistema de dark mode foi implementado com sucesso em todo o projeto, permitindo que os usuários alternem entre os modos claro e escuro. O modo escuro é o padrão inicial. Além disso, foi implementado um sistema de sidebar responsiva que se adapta automaticamente ao conteúdo principal.

## Características

### ✅ Implementado
- **Tema padrão**: Dark mode como padrão inicial
- **Toggle na sidebar**: Botão para alternar entre dark/light mode
- **Persistência**: O tema escolhido é salvo no localStorage
- **Transições suaves**: Animações de transição entre os temas
- **Compatibilidade**: Funciona em todas as páginas principais
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Sidebar responsiva**: Se adapta automaticamente ao conteúdo principal
- **Toggle de sidebar**: Botão para minimizar/expandir a sidebar
- **Transições fluidas**: Animações suaves na mudança de tamanho

### 📱 Páginas Suportadas
- ✅ Dashboard (página principal)
- ✅ Login
- ✅ Registro
- ✅ Página inicial (home)
- ✅ Páginas de erro (404, error)
- ✅ Sidebar com toggle de tema

## Como Usar

### Para Usuários
1. **Dark Mode**: Na sidebar, procure pelo botão "Modo Claro" ou "Modo Escuro" e clique para alternar
2. **Sidebar Responsiva**: Use o botão de seta (← →) no topo da sidebar para minimizar/expandir
3. **Persistência**: Suas preferências serão salvas automaticamente

### Para Desenvolvedores

#### Adicionando Dark Mode e Sidebar Responsiva a uma Nova Página

1. **Importe os hooks e componentes necessários**:
```tsx
import { useTheme } from '../hooks/useTheme'
import Sidebar from '../components/sidebar'
import MainContent from '../components/main-content'
```

2. **Use os componentes no seu layout**:
```tsx
export default function MinhaPagina() {
  const { theme } = useTheme()
  
  return (
    <div className={`flex h-screen min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar 
        userType="admin"
        userName="Administrador SENAI"
        userEmail="admin@senai.com"
        notifications={5}
      />
      <MainContent>
        {/* Seu conteúdo aqui */}
        <h1>Minha Página</h1>
      </MainContent>
    </div>
  )
}
```

#### Classes CSS Comuns para Dark Mode

```tsx
// Backgrounds
className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}

// Cards
className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}

// Textos
className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}

// Bordas
className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
```

## Estrutura de Arquivos

```
sistema-senai/
├── hooks/
│   └── useTheme.ts              # Hook personalizado para gerenciar tema
├── contexts/
│   └── SidebarContext.tsx       # Contexto para gerenciar estado da sidebar
├── components/
│   ├── theme-toggle.tsx         # Componente de toggle de tema
│   ├── theme-provider.tsx       # Provider do tema
│   ├── sidebar.tsx              # Sidebar responsiva
│   └── main-content.tsx         # Wrapper para conteúdo principal
├── app/
│   ├── providers.tsx            # Providers da aplicação
│   ├── layout.tsx               # Layout principal
│   └── pages/                   # Páginas com dark mode e sidebar implementados
└── styles/
    └── globals.css              # Estilos globais com transições
```

## Tecnologias Utilizadas

- **next-themes**: Biblioteca para gerenciamento de temas
- **Tailwind CSS**: Classes utilitárias para estilização
- **React Hooks**: Gerenciamento de estado do tema
- **React Context**: Compartilhamento de estado da sidebar
- **TypeScript**: Tipagem para melhor desenvolvimento

## Configuração

O sistema está configurado para:
- Usar `class` como atributo para mudança de tema
- Ter `dark` como tema padrão
- Desabilitar detecção automática do sistema
- Aplicar transições suaves entre temas

## Manutenção

### Adicionando Novos Componentes
1. Use o hook `useTheme()` para acessar o tema atual
2. Aplique classes condicionais baseadas no `theme`
3. Teste em ambos os modos (dark/light)

### Troubleshooting
- **Problemas de hidratação**: O hook personalizado resolve isso
- **Flashes de tema**: Use o `suppressHydrationWarning` no HTML
- **Transições quebradas**: Verifique se as classes estão corretas

## Exemplo de Implementação

```tsx
'use client'

import { useTheme } from '../hooks/useTheme'

export default function MeuComponente() {
  const { theme } = useTheme()
  
  return (
    <div className={`p-6 rounded-xl border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h1 className="text-2xl font-bold mb-4">Meu Título</h1>
      <p className={`${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Conteúdo do componente
      </p>
    </div>
  )
}
```

## Status do Projeto

✅ **Concluído**: Sistema de dark mode totalmente funcional
✅ **Concluído**: Sidebar responsiva implementada
✅ **Testado**: Funciona em todas as páginas principais
✅ **Documentado**: Guia completo de uso e implementação
✅ **Otimizado**: Transições suaves e performance adequada 