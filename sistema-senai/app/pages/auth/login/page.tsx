"use client";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
// Tema removido - tela de login sempre em modo escuro
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaArrowRight,
  FaShieldAlt,
  FaGraduationCap,
  FaWrench,
  FaCog,
  FaQrcode,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import Logo from "../../../../components/logo";
import Link from "next/link";
import { PrimaryButton } from "../../../../components/ui/button";
import Input, { PasswordInput } from "../../../../components/ui/input";

import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { authCookies } from "../../../../utils/cookies";
import { useSupabase } from "../../../../hooks/useSupabase";

export default function Home() {
  // Tema removido - tela de login sempre em modo escuro
  const router = useRouter();
  const supabase = useSupabase();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Estados para 2FA
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [initialSmsSent, setInitialSmsSent] = useState(false);
  
  // Estados para escolha de método 2FA
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email' | null>(null);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [twoFactorContact, setTwoFactorContact] = useState("");
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [twoFactorCodeSent, setTwoFactorCodeSent] = useState(false);
  // Função de teste para cookies
  const testCookies = () => {
    console.log('🧪 Testando cookies...');
    authCookies.setToken('test-token-123', false);
    const retrievedToken = authCookies.getToken();
    console.log('Token salvo e recuperado:', retrievedToken);
    alert(`Token recuperado: ${retrievedToken}`);
  };

  



  useEffect(() => {
    const token = authCookies.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token)
        const role = decoded.role || decoded.userRole
        if (role === 'Agent' || role === 'tecnico') {
          router.push('/pages/agent/home')
        } else if (role === 'Client' || role === 'profissional') {
          router.push('/pages/client/home')
        } else {
          router.push('/pages/home')
        }
      } catch (e) {
        // Se falhar decodificação, manda para login
        router.push('/pages/auth/login')
      }
    }
  }, [router]);

  const userTypes = [
    {
      value: "admin",
      label: "Administrador",
      icon: <FaCog />,
      color: "#d32f2f",
    },
    {
      value: "profissional",
      label: "Profissional",
      icon: <FaGraduationCap />,
      color: "#1976d2",
    },
    {
      value: "tecnico",
      label: "Técnico",
      icon: <FaWrench />,
      color: "#388e3c",
    },
  ];

  // Função para detectar tipo de usuário baseado no email
  const detectUserType = (email: string) => {
    if (!email) return null;

    const emailLower = email.toLowerCase();

    // Padrões para detectar tipo de usuário
    if (
      emailLower.includes("admin") ||
      emailLower.includes("administrador") ||
      emailLower.includes("gerente")
    ) {
      return "admin";
    } else if (
      emailLower.includes("prof") ||
      emailLower.includes("profissional") ||
      emailLower.includes("instrutor")
    ) {
      return "profissional";
    } else if (
      emailLower.includes("tec") ||
      emailLower.includes("tecnico") ||
      emailLower.includes("manutencao")
    ) {
      return "tecnico";
    }

    // Se não conseguir detectar, retorna null
    return null;
  };

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData({
        ...formData,
        [field]: value,
      });

      // Detectar tipo de usuário automaticamente quando email muda
      if (field === "email") {
        const detectedType = detectUserType(value);
        setDetectedUserType(detectedType);
      }

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors({
          ...errors,
          [field]: "",
        });
      }

      // Limpar erro de login quando o usuário começa a digitar
      if (loginError) {
        setLoginError("");
      }

      // Validação em tempo real
      const newErrors = { ...errors };
      
      if (field === "email" && value && !value.includes('@')) {
        newErrors.email = "Por favor, informe um email válido";
      } else if (field === "email") {
        delete newErrors.email;
      }
      
      if (field === "password" && value && value.length < 6) {
        newErrors.password = "A senha deve ter pelo menos 6 caracteres";
      } else if (field === "password") {
        delete newErrors.password;
      }
      
      setErrors(newErrors);
    };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Por favor, informe seu email de usuário";
    } else if (!formData.email.includes('@')) {
      newErrors.email = "Por favor, informe um email válido";
    }

    if (!formData.password) {
      newErrors.password = "Por favor, informe sua senha";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (validateForm()) {
      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            rememberMe: rememberMe,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao fazer login");
        }

        // Verificar se o usuário tem 2FA habilitado
        if (data.requiresTwoFactor) {
          // Salvar credenciais para usar depois da verificação 2FA
          setUserEmail(formData.email);
          setUserPassword(formData.password);
          
          // Configurar 2FA via email
          setHasEmail(true);
          setPhoneNumber("");
          
          console.log('🔐 2FA detectado:', {
            email: formData.email,
            hasEmail: true,
            requiresTwoFactor: data.requiresTwoFactor
          });
          
          setShowTwoFactor(true);
          setTwoFactorMessage('Código de verificação será enviado para seu email');
          setTwoFactorCodeSent(false);
          setIsLoading(false);
          
          return;
        }

        // Se não tem 2FA, continuar com o login normal
        await completeLogin(data.token);
        
      } catch (error: any) {
        // Tratar erros de rede e outros erros
        let errorMessage = "Erro ao fazer login";
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setLoginError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  // Função para completar o login após verificação 2FA
  const completeLogin = async (token: string) => {
    try {
      // Armazenar token nos cookies
      authCookies.setToken(token, rememberMe);

      // Decodificar token para obter role
      const decoded: any = jwtDecode(token);
      // Verificar se o token tem o formato antigo (com userRole) ou novo (com role)
      const userRole = decoded.userRole ? decoded.userRole.toLowerCase() : decoded.role?.toLowerCase();

      setDetectedUserType(userRole);
      setIsAuthenticated(true);
      setLoginError("");

      // Redirecionamento baseado na função do usuário
      if (decoded.role === 'Agent' || decoded.userRole === 'Agent' || decoded.role === 'tecnico' || decoded.userRole === 'tecnico') {
        router.push('/pages/agent/home');
      } else if (decoded.role === 'Client' || decoded.userRole === 'Client' || decoded.role === 'profissional' || decoded.userRole === 'profissional') {
        router.push('/pages/client/home');
      } else {
        router.push('/pages/home');
      }
    } catch (error) {
              toast.error("Erro ao completar login");
    }
  };

    // Função para verificar código 2FA
  const handleVerifyTwoFactor = async () => {
    if (!verificationCode) {
      toast.error("Digite o código de verificação");
      return;
    }

    if (!twoFactorMethod) {
      toast.error("Selecione um método de verificação");
      return;
    }

    setTwoFactorLoading(true);
    try {
      // Verificar código usando a nova API
      const response = await fetch('http://localhost:3001/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao verificar código');
      }

      if (data.verified) {
        console.log('✅ Verificação bem-sucedida:', data);
        
        // Se a verificação for bem-sucedida, fazer login com as credenciais salvas
        const loginResponse = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            password: userPassword,
            twoFactorVerified: true,
            rememberMe: rememberMe,
          }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginData.message || "Erro ao fazer login");
        }

        await completeLogin(loginData.token);
        setShowTwoFactor(false);
        setVerificationCode("");
        setTwoFactorMethod(null);
      } else {
        toast.error("Código inválido");
      }
    } catch (error: any) {
      console.error('❌ Erro geral na verificação:', error);
      toast.error("Erro ao verificar código: " + error.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Função para enviar código 2FA via email
  const handleSendTwoFactorCode = async () => {
    setTwoFactorMethod('email');
    setTwoFactorLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/2fa/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar código');
      }

      setTwoFactorContact(userEmail);
      setInitialSmsSent(true);
      setTwoFactorCodeSent(true);
      toast.success(`Código enviado via Email para ${userEmail}`);
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar código:', error);
      toast.error(error.message || 'Erro ao enviar código');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Função para reenviar código SMS (mantida para compatibilidade)
  const handleResendSMS = async (phoneToUse?: string | React.MouseEvent) => {
    setTwoFactorLoading(true);
    try {
      if (!supabase) {
        toast.error("Erro de conexão com o sistema");
        return;
      }

      // Usar o telefone passado como parâmetro ou o do estado
      const phoneToSend = typeof phoneToUse === 'string' ? phoneToUse : phoneNumber;
      
      console.log('📱 Iniciando envio de SMS, phoneNumber atual:', phoneNumber, 'phoneToSend:', phoneToSend);

      // Verificar se o número de telefone está definido
      if (!phoneToSend || phoneToSend.trim() === '') {
        console.log('❌ Telefone vazio ou indefinido');
        toast.error("Número de telefone não encontrado. Entre em contato com o suporte.");
        return;
      }

      // Formatar número de telefone para o formato internacional
      let formattedPhone = phoneToSend;
      
      // Remover espaços e caracteres especiais
      formattedPhone = formattedPhone.replace(/\s+/g, '').replace(/[()-]/g, '');
      
      // Garantir que tenha o código do país
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('55')) {
          formattedPhone = '+' + formattedPhone;
        } else if (formattedPhone.startsWith('0')) {
          formattedPhone = '+55' + formattedPhone.substring(1);
        } else {
          formattedPhone = '+55' + formattedPhone;
        }
      }

      // Validar se o número tem pelo menos 10 dígitos (sem contar o código do país)
      const phoneWithoutCountry = formattedPhone.replace('+55', '');
      console.log('📱 Telefone formatado:', formattedPhone, 'Sem país:', phoneWithoutCountry, 'Tamanho:', phoneWithoutCountry.length);
      
      // Verificar se o número tem pelo menos 10 dígitos após remover o código do país
      if (phoneWithoutCountry.length < 10) {
        console.log('❌ Telefone muito curto:', phoneWithoutCountry.length, 'dígitos');
        toast.error(`Número de telefone inválido. Deve ter pelo menos 10 dígitos. (Atual: ${phoneWithoutCountry.length} dígitos)`);
        return;
      }

      console.log('📱 Enviando SMS para:', formattedPhone);

      // Reenviar SMS
      const { data, error } = await supabase!.auth.signInWithOtp({
        phone: formattedPhone
      });

      if (error) {
        console.error('❌ Erro ao reenviar SMS:', error);
        
        // Tratar erros específicos
        let errorMessage = "Erro ao reenviar SMS";
        if (error.message.includes('User not found')) {
          errorMessage = "Usuário não encontrado. Verifique se o telefone está correto.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (error.message.includes('Invalid phone')) {
          errorMessage = "Número de telefone inválido. Verifique o formato.";
        } else {
          errorMessage = "Erro ao reenviar SMS: " + error.message;
        }
        
        toast.error(errorMessage);
      } else {
        console.log('✅ SMS reenviado com sucesso:', data);
        setLoginError(""); // Limpar erro anterior
        
        // Mostrar toast de sucesso
        const message = initialSmsSent 
          ? `SMS reenviado com sucesso para ${phoneToSend}`
          : `Código de verificação enviado para ${phoneToSend}`;
        
        toast.success(message);
      }
    } catch (error: any) {
      console.error('❌ Erro geral ao reenviar SMS:', error);
      toast.error("Erro ao reenviar SMS: " + error.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        {/* Container principal com design profissional */}
        <div className="max-w-md w-full relative z-10 mx-auto min-w-0">
          {/* Card de login com design moderno e profissional */}
          <div className="bg-gradient-to-br from-gray-900/10 to-gray-800/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/20 p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden">
            {/* Efeito de brilho sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl sm:rounded-3xl"></div>

            {/* Header com design profissional */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10 relative z-10">
              <div className="mb-4 sm:mb-6">
                <Logo showBackground={true} className="mx-auto" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-white mb-2 tracking-tight">
                  Sistema de Chamados
                </h1>
                <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full"></div>
                <p className="text-white/80 text-xs sm:text-sm font-medium px-2">
                  SENAI Armando de Arruda Pereira
                </p>
              </div>
            </div>

            {/* Formulário com espaçamento melhorado */}
            {!showTwoFactor ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
                {loginError && (
                  <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mt-1 sm:mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Erro no Login</div>
                        <div className="text-red-100 text-xs sm:text-sm">{loginError}</div>
                        {loginError.includes("Email ou senha incorretos") && (
                          <div className="text-xs text-red-200 mt-2">
                            💡 Dica: Verifique se o Caps Lock está desativado
                          </div>
                        )}
                        {loginError.includes("Erro de conexão") && (
                          <div className="text-xs text-red-200 mt-2">
                            💡 Dica: Verifique sua conexão com a internet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Campo Usuário com design melhorado */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-white/90 text-xs sm:text-sm font-medium ml-1">
                    Usuário
                  </label>
                  <Input
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="Digite seu email"
                    disabled={isLoading}
                    error={errors.email}
                    icon={<FaUser className="text-white/60 text-sm" />}
                    required
                  />
                </div>

                {/* Campo Senha com design melhorado */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-white/90 text-xs sm:text-sm font-medium ml-1">
                    Senha
                  </label>
                  <PasswordInput
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Digite sua senha"
                    disabled={isLoading}
                    error={errors.password}
                    icon={<FaLock className="text-white/60 text-sm" />}
                    showPassword={showPassword}
                    onTogglePassword={handleTogglePasswordVisibility}
                    required
                  />
                </div>

               

                {/* Opções de Login com design melhorado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 text-xs sm:text-sm">
                  <label className="flex items-center text-white/70 hover:text-white/90 transition-colors cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 border-white/30 rounded focus:ring-red-400 bg-gray-50/10 mr-2 sm:mr-3 group-hover:border-white/50 transition-colors"
                      />
                    </div>
                    <span className="font-medium">Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    className="text-white/70 hover:text-red-300 transition-colors cursor-pointer font-medium hover:underline text-left sm:text-right"
                    onClick={() => router.push('/pages/auth/forgot')}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Informação sobre "Lembrar de mim" */}
                {rememberMe && (
                  <div className="bg-blue-900/20 border border-blue-700/30 text-blue-200 px-3 py-2 rounded-lg text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium mb-1">Lembrar de mim ativado</div>
                        <div className="text-blue-100 text-xs">
                          • Seu login será lembrado por 15 dias
                        </div>
                        <div className="text-blue-100 text-xs">
                          • Não será necessário código de verificação nas próximas vezes
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão Principal com design melhorado */}
                <div className="pt-1 sm:pt-2">
                  <PrimaryButton
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Entrando..."
                    icon={<FaArrowRight className="text-xs sm:text-sm" />}
                  >
                    <span className="text-sm sm:text-base">Entrar no Sistema</span>
                  </PrimaryButton>
                </div>
              </form>
            ) : (
              /* Tela de Verificação 2FA */
              <div className="space-y-4 sm:space-y-6 relative z-10">
                {loginError && (
                  <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mt-1 sm:mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Erro na Verificação</div>
                        <div className="text-red-100 text-xs sm:text-sm">{loginError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header da verificação 2FA */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaShieldAlt className="text-blue-400 text-2xl" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Verificação de Segurança</h2>
                  <p className="text-white/70 text-sm">
                    {!twoFactorMethod ? 'Escolha como receber o código de verificação' : `Código enviado via ${twoFactorMethod === 'sms' ? 'SMS' : 'Email'}`}
                  </p>
                  <p className="text-white/50 text-xs">
                    🔐 Autenticação de dois fatores obrigatória
                  </p>
                </div>

                {/* Envio de código via Email */}
                {!twoFactorCodeSent ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleSendTwoFactorCode}
                      disabled={twoFactorLoading}
                      className="w-full p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-green-400 text-xl" />
                        <div>
                          <div className="text-white font-medium">Enviar Código</div>
                          <div className="text-white/70 text-sm">Enviar código para {userEmail}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  /* Tela de inserção do código */
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-white/70 text-sm">
                        Código enviado via Email para:
                      </p>
                      <p className="text-white font-medium">{twoFactorContact}</p>
                    </div>

                    {/* Campo de código de verificação */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-white/90 text-xs sm:text-sm font-medium ml-1">
                        Código de Verificação
                      </label>
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Digite o código de 6 dígitos"
                        disabled={twoFactorLoading}
                        icon={<FaQrcode className="text-white/60 text-sm" />}
                        required
                      />
                    </div>

                    {/* Botões de ação */}
                    <div className="space-y-3">
                      <PrimaryButton
                        onClick={handleVerifyTwoFactor}
                        disabled={twoFactorLoading || !verificationCode}
                        isLoading={twoFactorLoading}
                        loadingText="Verificando..."
                        icon={<FaArrowRight className="text-xs sm:text-sm" />}
                      >
                        <span className="text-sm sm:text-base">Verificar e Entrar</span>
                      </PrimaryButton>
                      
                      <button
                        type="button"
                        onClick={handleSendTwoFactorCode}
                        disabled={twoFactorLoading}
                        className="w-full px-4 py-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
                      >
                        {twoFactorLoading ? "Enviando..." : "Reenviar código"}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFactorMethod(null);
                          setVerificationCode("");
                          setLoginError("");
                        }}
                        className="w-full px-4 py-2 text-white/50 hover:text-white/70 transition-colors text-sm"
                      >
                        Escolher outro método
                      </button>
                    </div>
                  </div>
                )}

                {/* Botão voltar */}
                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFactor(false);
                    setTwoFactorMethod(null);
                    setVerificationCode("");
                    setLoginError("");
                  }}
                  className="w-full px-4 py-2 text-white/50 hover:text-white/70 transition-colors text-sm"
                >
                  Voltar ao login
                </button>
              </div>
            )}
          </div>
        </div>
      


      </div>
    );
}