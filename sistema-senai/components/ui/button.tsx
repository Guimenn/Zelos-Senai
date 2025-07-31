import React from 'react'
import { Button as HeroButton } from "@heroui/react"

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  icon?: React.ReactNode
}

export default function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon
}: ButtonProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
    secondary: "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700",
    outline: "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const combinedClasses = `${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`

  return (
    <HeroButton
      type={type}
      onClick={onClick}
      isDisabled={disabled || isLoading}
      isLoading={isLoading}
      className={combinedClasses}
      startContent={!isLoading && icon ? icon : undefined}
    >
      {isLoading ? (loadingText || 'Carregando...') : children}
    </HeroButton>
  )
}

// Componente específico para botões de ação principal (como login/registro)
export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText,
  fullWidth = true,
  icon
}: Omit<ButtonProps, 'variant' | 'size'>) {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      variant="primary"
      size="md"
      fullWidth={fullWidth}
      icon={icon}
    >
      {children}
    </Button>
  )
}

// Componente específico para botões secundários
export function SecondaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText,
  fullWidth = false,
  icon
}: Omit<ButtonProps, 'variant' | 'size'>) {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      variant="secondary"
      size="md"
      fullWidth={fullWidth}
      icon={icon}
    >
      {children}
    </Button>
  )
}

// Componente específico para botões outline
export function OutlineButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText,
  fullWidth = false,
  icon
}: Omit<ButtonProps, 'variant' | 'size'>) {
  return (
    <Button
      onClick={onClick}
      type={type}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      variant="outline"
      size="md"
      fullWidth={fullWidth}
      icon={icon}
    >
      {children}
    </Button>
  )
}

/*
EXEMPLOS DE USO:

// Botão primário (padrão para ações principais)
<PrimaryButton
  onClick={() => console.log('Clicou!')}
  isLoading={isLoading}
  loadingText="Salvando..."
  icon={<FaSave />}
>
  Salvar
</PrimaryButton>

// Botão secundário
<SecondaryButton
  onClick={() => console.log('Cancelar')}
  icon={<FaTimes />}
>
  Cancelar
</SecondaryButton>

// Botão outline
<OutlineButton
  onClick={() => console.log('Editar')}
  icon={<FaEdit />}
>
  Editar
</OutlineButton>

// Botão customizado
<Button
  variant="primary"
  size="lg"
  fullWidth={false}
  onClick={() => console.log('Customizado')}
  className="custom-class"
>
  Botão Customizado
</Button>

PROPRIEDADES DISPONÍVEIS:

- children: Conteúdo do botão (texto, ícones, etc.)
- onClick: Função executada ao clicar
- type: Tipo do botão ('button', 'submit', 'reset')
- disabled: Desabilita o botão
- isLoading: Mostra spinner de loading
- loadingText: Texto exibido durante o loading
- variant: Variante visual ('primary', 'secondary', 'outline')
- size: Tamanho ('sm', 'md', 'lg')
- fullWidth: Ocupa toda a largura disponível
- className: Classes CSS adicionais
- icon: Ícone exibido antes do texto
*/