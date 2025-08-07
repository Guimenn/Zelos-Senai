"use client";
import { useState, useEffect } from "react";
import { useTheme } from "../../../../hooks/useTheme";
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
} from "react-icons/fa";
import Logo from "../../../../components/logo";
import Link from "next/link";
import { PrimaryButton } from "../../../../components/ui/button";
import Input, { PasswordInput } from "../../../../components/ui/input";
import VantaBackground from "../../../../components/VantaBackground";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/pages/home');
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
    };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Usuário é obrigatório";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
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
        const response = await fetch("http://localhost:3001/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao fazer login");
        }

        // Armazenar token
        localStorage.setItem("token", data.token);

        // Decodificar token para obter role
        const decoded: any = jwtDecode(data.token);
        // Verificar se o token tem o formato antigo (com userRole) ou novo (com role)
        const userRole = decoded.userRole ? decoded.userRole.toLowerCase() : decoded.role?.toLowerCase();

        setDetectedUserType(userRole);
        setIsAuthenticated(true);
        setLoginError("");

       
        router.push('/pages/home');
        
      } catch (error: any) {
        setLoginError(
          error.message || "Credenciais inválidas. Verifique usuário e senha."
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
      <div className="h-screen flex items-center justify-center relative overflow-hidden">
        <VantaBackground />
        {/* Container principal com design profissional */}
        <div className="max-w-md w-full relative z-10">
          {/* Card de login com design moderno e profissional */}
          <div
            className={`bg-gradient-to-br backdrop-blur-2xl rounded-3xl shadow-2xl border p-10 relative overflow-hidden ${
              theme === "dark"
                ? "from-gray-900/10 to-gray-800/5 border-gray-700/20"
                : "from-white/10 to-white/5 border-white/20"
            }`}
          >
            {/* Efeito de brilho sutil */}
            <div
              className={`absolute inset-0 bg-gradient-to-br rounded-3xl ${
                theme === "dark"
                  ? "from-red-500/10 to-transparent"
                  : "from-red-500/5 to-transparent"
              }`}
            ></div>

            {/* Header com design profissional */}
            <div className="text-center mb-10 relative z-10">
              <div className="mb-6">
                <Logo showBackground={true} className="mx-auto" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Sistema de Chamados
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full"></div>
                <p className="text-white/80 text-sm font-medium">
                  SENAI Armando de Arruda Pereira
                </p>
              </div>
            </div>

            {/* Formulário com espaçamento melhorado */}
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {loginError && (
                <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/40 text-red-100 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    {loginError}
                  </div>
                </div>
              )}

              {/* Campo Usuário com design melhorado */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium ml-1">
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
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium ml-1">
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
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center text-white/70 hover:text-white/90 transition-colors cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-red-500 border-white/30 rounded focus:ring-red-400 bg-gray-50/10 mr-3 group-hover:border-white/50 transition-colors"
                    />
                  </div>
                  <span className="font-medium">Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  className="text-white/70 hover:text-red-300 transition-colors cursor-pointer font-medium hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão Principal com design melhorado */}
              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  disabled={isLoading}
                  isLoading={isLoading}
                  loadingText="Entrando..."
                  icon={<FaArrowRight className="text-sm" />}
                >
                  Entrar no Sistema
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaShieldAlt className="text-sm" />
            <span className="text-sm">Sistema seguro e confiável</span>
          </div>
          <p className="text-xs opacity-80">
            © 2025 SENAI Armando de Arruda Pereira - Todos os direitos
            reservados
          </p>
        </div>
      </div>
    );
}
