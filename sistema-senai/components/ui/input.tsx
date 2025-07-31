import React from 'react'
import { Input as HeroInput } from "@heroui/react"
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface InputProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  disabled?: boolean
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
  maxLength?: number
  className?: string
  required?: boolean
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  icon,
  rightIcon,
  onRightIconClick,
  maxLength,
  className = '',
  required = false
}: InputProps) {
  const baseClasses = "w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm"
  const errorClasses = error ? 'border-red-400' : ''
  const combinedClasses = `${baseClasses} ${errorClasses} ${className}`

  return (
    <div className="space-y-1">
      <HeroInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={disabled}
        maxLength={maxLength}
        isRequired={required}
        startContent={icon}
        endContent={rightIcon ? (
          <button
            type="button"
            onClick={onRightIconClick}
            disabled={disabled}
            className="text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {rightIcon}
          </button>
        ) : undefined}
        classNames={{
          base: combinedClasses,
          input: "text-white",
          inputWrapper: "bg-transparent shadow-none",
          innerWrapper: "bg-transparent",
          label: "text-white/70"
        }}
      />
      {error && (
        <p className="text-red-300 text-xs ml-1">{error}</p>
      )}
    </div>
  )
}

// Componente específico para campos de senha
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon' | 'onRightIconClick'> {
  showPassword: boolean
  onTogglePassword: () => void
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Senha",
  disabled = false,
  error,
  icon,
  showPassword,
  onTogglePassword,
  maxLength,
  className = '',
  required = false
}: PasswordInputProps) {
  return (
    <Input
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      icon={icon}
      rightIcon={showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
      onRightIconClick={onTogglePassword}
      maxLength={maxLength}
      className={className}
      required={required}
    />
  )
}

// Componente específico para campos de email
export function EmailInput({
  value,
  onChange,
  placeholder = "Email",
  disabled = false,
  error,
  icon,
  className = '',
  required = false
}: Omit<InputProps, 'type'>) {
  return (
    <Input
      type="email"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      icon={icon}
      className={className}
      required={required}
    />
  )
}

// Componente específico para campos de telefone
export function PhoneInput({
  value,
  onChange,
  placeholder = "Telefone",
  disabled = false,
  error,
  icon,
  className = '',
  required = false
}: Omit<InputProps, 'type'>) {
  return (
    <Input
      type="tel"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      icon={icon}
      className={className}
      required={required}
    />
  )
}

/*
EXEMPLOS DE USO:

// Input básico
<Input
  value={formData.nome}
  onChange={handleInputChange('nome')}
  placeholder="Nome completo"
  icon={<FaUser className="text-white/50 text-sm" />}
  error={errors.nome}
  required
/>

// Input de senha
<PasswordInput
  value={formData.senha}
  onChange={handleInputChange('senha')}
  placeholder="Senha"
  icon={<FaLock className="text-white/50 text-sm" />}
  error={errors.senha}
  showPassword={showPassword}
  onTogglePassword={handleTogglePassword}
  required
/>

// Input de email
<EmailInput
  value={formData.email}
  onChange={handleInputChange('email')}
  placeholder="Email"
  icon={<FaEnvelope className="text-white/50 text-sm" />}
  error={errors.email}
  required
/>

// Input de telefone
<PhoneInput
  value={formData.telefone}
  onChange={handleInputChange('telefone')}
  placeholder="Telefone"
  icon={<FaPhone className="text-white/50 text-sm" />}
  error={errors.telefone}
  required
/>

PROPRIEDADES DISPONÍVEIS:

- value: Valor do input
- onChange: Função de mudança
- placeholder: Texto de placeholder
- type: Tipo do input ('text', 'email', 'password', 'tel', 'number')
- disabled: Desabilita o input
- error: Mensagem de erro
- icon: Ícone esquerdo
- rightIcon: Ícone direito
- onRightIconClick: Função do ícone direito
- maxLength: Limite de caracteres
- className: Classes CSS adicionais
- required: Campo obrigatório
*/ 