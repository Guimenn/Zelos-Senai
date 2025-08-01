import { Input as HeroInput, Select, SelectSection, SelectItem } from "@heroui/react"
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface InputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  maxLength?: number;
  className?: string;
  required?: boolean;
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  error,
  icon,
  rightIcon,
  onRightIconClick,
  maxLength,
  className = "",
  required = false,
}: InputProps) {
  const baseClasses = `
    w-full 
    bg-white/5 
    backdrop-blur-sm 
    border border-white/10 
    rounded-lg 
    text-white 
    placeholder-white/50 
    focus:ring-0 focus:border-transparent 
    hover:border-white/20 hover:bg-white/10
    transition-all duration-200 
    text-sm 
    ${error ? 'border-red-400/60 bg-red-500/10' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `
  const combinedClasses = `${baseClasses} ${className}`

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
        startContent={icon && (
          <div className="text-white/60 mr-2">
            {icon}
          </div>
        )}
        endContent={rightIcon ? (
          <button
            type="button"
            onClick={onRightIconClick}
            disabled={disabled}
            className="text-white/60 hover:text-white/90 transition-all duration-200 cursor-pointer p-2 rounded-lg hover:bg-white/10 active:scale-95"
          >
            {rightIcon}
          </button>
        ) : undefined}
        classNames={{
          base: combinedClasses,
          input: error ? 'text-red-300 placeholder-red-400' : 'text-white placeholder-white/50',
          inputWrapper: "bg-transparent shadow-none border-none",
          innerWrapper: "bg-transparent"
        }}
      />
      {error && (
        <div className="flex items-center gap-1.5 mt-1 text-red-300 text-xs">
          <div className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></div>
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

// Componente específico para campos de senha
interface PasswordInputProps
  extends Omit<InputProps, "type" | "rightIcon" | "onRightIconClick"> {
  showPassword: boolean;
  onTogglePassword: () => void;
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
  className = "",
  required = false,
}: PasswordInputProps) {
  return (
    <Input
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      icon={icon}
      rightIcon={showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
      onRightIconClick={onTogglePassword}
      maxLength={maxLength}
      className={className}
      required={required}
    />
  );
}

// Componente específico para campos de email
export function EmailInput({
  value,
  onChange,
  placeholder = "Email",
  disabled = false,
  error,
  icon,
  className = "",
  required = false,
}: Omit<InputProps, "type">) {
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
  );
}

// Componente específico para campos de telefone
export function PhoneInput({
  value,
  onChange,
  placeholder = "Telefone",
  disabled = false,
  error,
  icon,
  className = "",
  required = false,
}: Omit<InputProps, "type">) {
  const countryOptions = [
    { label: "Brazil (+55)", value: "+55" },
    { label: "USA (+1)", value: "+1" },
    { label: "France (+33)", value: "+33" },
    { label: "UK (+44)", value: "+44" },
    { label: "Spain (+34)", value: "+34" },
    { label: "Portugal (+351)", value: "+351" },
  ];

  return (
    <div className="flex gap-2">
      <Select
        defaultSelectedKeys={["+55"]}
        className="w-40 min-w-fit"
        classNames={{
          base: "bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white",
          trigger: "text-white",
        }}
      >
        <SelectSection>
          {countryOptions.map((option) => (
            <SelectItem key={option.value}>{option.label}</SelectItem>
          ))}
        </SelectSection>
      </Select>
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
    </div>
  );
}
export function NumberWithInputField({
  value,
  onChange,
  inputValue,
  onInputChange,
  options,
  placeholder,
  inputPlaceholder = "Enter text",
  disabled = false,
  error,
  className = "",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  inputPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select
          selectedKeys={value ? [value] : []}
          onSelectionChange={(selectedKeys) => {
            const newValue =
              selectedKeys instanceof Set
                ? Array.from(selectedKeys)[0]?.toString() || ""
                : selectedKeys?.toString() || "";
            onChange(newValue);
          }}
          placeholder={placeholder}
          isDisabled={disabled}
          isRequired={required}
          className="w-36"
          classNames={{
            base: "bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-white/20 focus:border-transparent focus:ring-0 transition-all duration-200",
            trigger: "text-white bg-transparent",
            value: "text-white",
            selectorIcon: "text-white/50",
            listbox: "bg-gray-800/95 backdrop-blur-xl border border-white/10",
          }}
        >
          <SelectSection>
            {options.map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectSection>
        </Select>

        <Input
          type="tel"
          value={inputValue}
          onChange={onInputChange}
          placeholder={inputPlaceholder}
          disabled={disabled}
          required={required}
          className={className}
        />
      </div>
      {error && <p className="text-red-300 text-xs ml-1">{error}</p>}
    </div>
  );
}

/*
Example usage:

<NumberWithInputField
  value={selectedNumber}
  onChange={handleNumberChange}
  inputValue={textValue}
  onInputChange={handleTextChange}
  options={[
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" }
  ]}
  placeholder="Num"
  inputPlaceholder="Enter description"
  error={errors.field}
  required
/>
*/

/*
EXEMPLOS DE USO:

// Input básico
<Input
  value={formData.nome}
  onChange={handleInputChange('nome')}
  placeholder="Nome completo"
  icon={<FaUser className="text-white/60 text-sm" />}
  error={errors.nome}
  required
/>

// Input de senha
<PasswordInput
  value={formData.senha}
  onChange={handleInputChange('senha')}
  placeholder="Senha"
  icon={<FaLock className="text-white/60 text-sm" />}
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
  icon={<FaEnvelope className="text-white/60 text-sm" />}
  error={errors.email}
  required
/>

// Input de telefone
<PhoneInput
  value={formData.telefone}
  onChange={handleInputChange('telefone')}
  placeholder="Telefone"
  icon={<FaPhone className="text-white/60 text-sm" />}
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
