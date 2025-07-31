<<<<<<< Updated upstream
'use client'
import { useState } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import { Button, Checkbox, Card, CardBody, CardHeader, Chip } from "@heroui/react"
=======
"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Toast,
  toast,
  addToast,
} from "@heroui/react";
>>>>>>> Stashed changes
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaArrowRight,
  FaShieldAlt,
  FaGraduationCap,
  FaWrench,
<<<<<<< Updated upstream
  FaCog
} from 'react-icons/fa'
import Logo from '../../../../components/logo'
import Link from 'next/link'
import { PrimaryButton } from '../../../../components/ui/button'
import Input, { PasswordInput } from '../../../../components/ui/input'
import VantaBackground from '../../../../components/VantaBackground'
=======
  FaCog,
} from "react-icons/fa";
import Logo from "../../../../components/logo";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import { PrimaryButton } from "../../../../components/ui/button";
import Input, { PasswordInput } from "../../../../components/ui/input";


>>>>>>> Stashed changes

export default function Home() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
<<<<<<< Updated upstream
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [detectedUserType, setDetectedUserType] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
=======
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

 
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    if (!email) return null

    const emailLower = email.toLowerCase()

    // Padrões para detectar tipo de usuário
    if (emailLower.includes('admin') || emailLower.includes('administrador') || emailLower.includes('gerente')) {
      return 'admin'
    } else if (emailLower.includes('prof') || emailLower.includes('profissional') || emailLower.includes('instrutor')) {
      return 'profissional'
    } else if (emailLower.includes('tec') || emailLower.includes('tecnico') || emailLower.includes('manutencao')) {
      return 'tecnico'
    }

    // Se não conseguir detectar, retorna null
    return null
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormData({
      ...formData,
      [field]: value
    })

    // Detectar tipo de usuário automaticamente quando email muda
    if (field === 'email') {
      const detectedType = detectUserType(value)
      setDetectedUserType(detectedType)
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
=======
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
>>>>>>> Stashed changes

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (validateForm()) {
      // Simular autenticação - em produção, isso seria uma chamada para a API
<<<<<<< Updated upstream
      console.log('Tentativa de login:', formData)
=======
      console.log("Tentativa de login:", formData);
>>>>>>> Stashed changes

      // Simular delay de autenticação
      setTimeout(() => {
        // Aqui você faria a validação real com o backend
        // Simulando diferentes tipos de usuário
        const validCredentials = [
          { email: "admin@senai.com", password: "123456", type: "admin" },
          {
            email: "profissional@senai.com",
            password: "123456",
            type: "profissional",
          },
          { email: "tecnico@senai.com", password: "123456", type: "tecnico" },
          { email: "admin.senai@senai.com", password: "123456", type: "admin" },
          {
            email: "prof.senai@senai.com",
            password: "123456",
            type: "profissional",
          },
          { email: "tec.senai@senai.com", password: "123456", type: "tecnico" },
          { email: "gerente@senai.com", password: "123456", type: "admin" },
          {
            email: "instrutor@senai.com",
            password: "123456",
            type: "profissional",
          },
          {
            email: "manutencao@senai.com",
            password: "123456",
            type: "tecnico",
          },
        ];

<<<<<<< Updated upstream
        const isValid = validCredentials.some(cred =>
          cred.email === formData.email &&
          cred.password === formData.password
        )

        if (isValid) {
          // Encontrar o tipo de usuário correto
          const userCredential = validCredentials.find(cred =>
            cred.email === formData.email &&
            cred.password === formData.password
          )

          setDetectedUserType(userCredential?.type || null)
          setIsAuthenticated(true)
          setLoginError('')
=======
        const isValid = validCredentials.some(
          (cred) =>
            cred.email === formData.email && cred.password === formData.password
        );

        if (isValid) {
          // Encontrar o tipo de usuário correto
          const userCredential = validCredentials.find(
            (cred) =>
              cred.email === formData.email &&
              cred.password === formData.password
          );

          setDetectedUserType(userCredential?.type || null);
          setIsAuthenticated(true);
          setLoginError("");
>>>>>>> Stashed changes
        } else {
          setLoginError("Credenciais inválidas. Verifique usuário e senha.");
        }
        setIsLoading(false);
      }, 1500);
    } else {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isAuthenticated && detectedUserType) {
<<<<<<< Updated upstream
    const userTypeInfo = userTypes.find(type => type.value === detectedUserType)

    return (
      <div className="flex items-center justify-center p-4 min-h-screen">
        <VantaBackground />
        <div className={`max-w-2xl w-full p-8 text-center animate-fade-in backdrop-blur-sm rounded-2xl shadow-2xl border relative z-10 ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700/20' 
            : 'bg-white/95 border-white/20'
        }`}>
=======
    const userTypeInfo = userTypes.find(
      (type) => type.value === detectedUserType
    );

    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-2xl w-full p-8 text-center animate-fade-in bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 relative z-10">
>>>>>>> Stashed changes
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            {userTypeInfo?.icon || <FaCog className="text-white text-3xl" />}
          </div>
          <h1 className={`text-3xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Bem-vindo ao Sistema de Chamados SENAI!
          </h1>
<<<<<<< Updated upstream
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Você foi autenticado com sucesso como <strong>{userTypeInfo?.label}</strong>.
=======
          <p className="text-gray-600 mb-6">
            Você foi autenticado com sucesso como{" "}
            <strong>{userTypeInfo?.label}</strong>.
>>>>>>> Stashed changes
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full mb-6 shadow-lg">
            {userTypeInfo?.icon}
            <span className="font-semibold">{userTypeInfo?.label}</span>
          </div>
<<<<<<< Updated upstream
          <p className={`mb-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Usuário: {formData.email}
          </p>
=======
          <p className="text-gray-500 mb-8">Usuário: {formData.email}</p>
>>>>>>> Stashed changes
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setFormData({ email: "", password: "" });
              setDetectedUserType(null);
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 transform hover:-translate-y-1 hover:shadow-lg"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
<<<<<<< Updated upstream
      <VantaBackground />
      {/* Container principal com design profissional */}
      <div className="max-w-md w-full relative z-10">
        {/* Card de login com design moderno e profissional */}
        <div className={`bg-gradient-to-br backdrop-blur-2xl rounded-3xl shadow-2xl border p-10 relative overflow-hidden ${
          theme === 'dark' 
            ? 'from-gray-900/10 to-gray-800/5 border-gray-700/20' 
            : 'from-white/10 to-white/5 border-white/20'
        }`}>
          {/* Efeito de brilho sutil */}
          <div className={`absolute inset-0 bg-gradient-to-br rounded-3xl ${
            theme === 'dark' 
              ? 'from-red-500/10 to-transparent' 
              : 'from-red-500/5 to-transparent'
          }`}></div>

          {/* Header com design profissional */}
          <div className="text-center mb-10 relative z-10">
            <div className="mb-6">
              <Logo />
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
=======
      {/* Container principal minimalista */}
      <div className="max-w-sm w-full relative z-10">
        {/* Card de login minimalista */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          {/* Header minimalista */}
          <div className="text-center mb-8">
            <Logo />

            <h1 className="text-2xl font-bold text-white mb-1">
              Sistema de Chamados
            </h1>
            <p className="text-white/70 text-sm">
              SENAI Armando de Arruda Pereira
            </p>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
            {/* Campo Usuário com design melhorado */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium ml-1">Usuário</label>
              <Input
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="Digite seu email"
                disabled={isLoading}
                error={errors.email}
                icon={<FaUser className="text-white/60 text-sm" />}
                required
              />
            </div>

            {/* Campo Senha com design melhorado */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium ml-1">Senha</label>
              <PasswordInput
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Digite sua senha"
                disabled={isLoading}
                error={errors.password}
                icon={<FaLock className="text-white/60 text-sm" />}
                showPassword={showPassword}
                onTogglePassword={handleTogglePasswordVisibility}
                required
              />
            </div>
=======
            {/* Campo Usuário */}
            <Input
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="Usuário"
              disabled={isLoading}
              error={errors.email}
              icon={<FaUser className="text-white/50 text-sm" />}
              required
            />

            {/* Campo Senha */}
            <PasswordInput
              value={formData.password}
              onChange={handleInputChange("password")}
              placeholder="Senha"
              disabled={isLoading}
              error={errors.password}
              icon={<FaLock className="text-white/50 text-sm" />}
              showPassword={showPassword}
              onTogglePassword={handleTogglePasswordVisibility}
              required
            />
>>>>>>> Stashed changes

            {/* Opções de Login com design melhorado */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-white/70 hover:text-white/90 transition-colors cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-red-500 border-white/30 rounded focus:ring-red-400 bg-white/10 mr-3 group-hover:border-white/50 transition-colors"
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

<<<<<<< Updated upstream
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
=======
            {/* Botão Principal */}
            <PrimaryButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Entrando..."
              icon={<FaArrowRight className="text-sm" />}
            >
              Entrar
            </PrimaryButton>
           

            {/* Link para Registro */}
            <div className="text-center mt-4">
              <p className="text-white/60 text-sm">
                Não tem uma conta?{" "}
                <Link
                  href="/pages/auth/register"
                  className="text-red-300 hover:text-red-200 transition-colors"
                >
                  Criar conta
                </Link>
              </p>
>>>>>>> Stashed changes
            </div>


          </form>
<<<<<<< Updated upstream


        </div>

      </div>
          {/* Footer */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaShieldAlt className="text-sm" />
              <span className="text-sm">Sistema seguro e confiável</span>
            </div>
            <p className="text-xs opacity-80">
              © 2025 SENAI Armando de Arruda Pereira - Todos os direitos reservados
            </p>
          </div>
=======
          {/* Credenciais de teste minimalista */}
          <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <h3 className="text-white/80 font-medium mb-2 text-center text-xs">
              Credenciais de Teste
            </h3>
            <div className="space-y-1 text-white/60 text-xs">
              <p>
                <span className="text-red-300">Admin:</span> admin@senai.com /
                123456
              </p>
              <p>
                <span className="text-blue-300">Profissional:</span>{" "}
                profissional@senai.com / 123456
              </p>
              <p>
                <span className="text-green-300">Técnico:</span>{" "}
                tecnico@senai.com / 123456
              </p>
            </div>
          </div>
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  );
}
