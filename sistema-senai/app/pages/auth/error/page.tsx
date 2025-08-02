"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addToast } from "@heroui/react";
import { PrimaryButton } from "@/components/ui/button";
import Logo from "@/components/logo";
import { FaExclamationTriangle, FaArrowLeft, FaEnvelope } from "react-icons/fa";

export default function AuthError() {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se há erros na URL (hash)
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.substring(1));
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error === 'access_denied') {
        if (errorDescription?.includes('expired')) {
          setErrorTitle("Link Expirado");
          setErrorMessage("O link de recuperação expirou. Os links de recuperação são válidos por 24 horas.");
        } else if (errorDescription?.includes('invalid') || errorDescription?.includes('not found')) {
          setErrorTitle("Email Não Encontrado");
          setErrorMessage("Este email não está cadastrado em nossa base de dados. Verifique o email ou crie uma nova conta.");
        } else {
          setErrorTitle("Acesso Negado");
          setErrorMessage("O link de recuperação é inválido ou foi usado anteriormente.");
        }
      } else {
        setErrorTitle("Erro");
        setErrorMessage("Ocorreu um erro ao processar o link de recuperação.");
      }
    } else {
      setErrorTitle("Erro");
      setErrorMessage("Link de recuperação inválido.");
    }
  }, []);

  const handleGoBack = () => {
    router.push("/pages/auth/forgot");
  };

  const handleGoToLogin = () => {
    router.push("/pages/auth/login");
  };

  const handleGoToRegister = () => {
    router.push("/pages/auth/register");
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <div className="max-w-lg w-full relative z-10">
        <div className="bg-gray-50/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <Logo />
            <div className="flex justify-center mb-4">
              <FaExclamationTriangle className="text-6xl text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {errorTitle}
            </h1>
            <p className="text-white/70 text-sm">
              {errorMessage}
            </p>
          </div>

          <div className="space-y-4">
            <PrimaryButton
              type="button"
              onClick={handleGoBack}
              icon={<FaEnvelope className="text-sm" />}
              className="w-full"
            >
              Solicitar Novo Link
            </PrimaryButton>

            <PrimaryButton
              type="button"
              onClick={handleGoToLogin}
              variant="bordered"
              icon={<FaArrowLeft className="text-sm" />}
              className="w-full"
            >
              Voltar para o Login
            </PrimaryButton>

            {errorTitle === "Email Não Encontrado" && (
              <PrimaryButton
                type="button"
                onClick={handleGoToRegister}
                variant="bordered"
                className="w-full"
              >
                Criar Nova Conta
              </PrimaryButton>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-xs">
              Dica: Verifique sua caixa de spam se não recebeu o email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
