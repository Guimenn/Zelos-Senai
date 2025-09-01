"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { useSupabase } from "@/hooks/useSupabase";
import { InputOtp } from '@heroui/react';
import { NumberWithInputField } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/button";
import Logo from "@/components/logo";
import { FaMobile, FaKey, FaArrowRight, FaEnvelope, FaSms, FaCheckCircle } from "react-icons/fa";

type RecoveryMethod = "sms" | "email";

export default function ForgotPassword() {
  const supabase = useSupabase();
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("sms");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"method" | "input" | "verify" | "confirmation">("method");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const router = useRouter();

  const sendOtp = async () => {
    setIsLoading(true);
    
    if (!supabase) {
      toast.error("Erro de configuração do sistema");
      setIsLoading(false);
      return;
    }
    
    if (recoveryMethod === "sms") {
      const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
      const { error } = await supabase!.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
          channel: "sms",
        },
      });
      
      if (error) {
        toast.error(`Erro ao enviar SMS: ${error.message}`);
      } else {
        setSentTo(formattedPhone);
        setStep("confirmation");
      }
    } else {
      // Recuperação por email
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pages/auth/reset-password`,
      });
      
      if (error) {
        let errorMessage = `Erro ao enviar email: ${error.message}`;
        
        // Verificar se o erro é porque o email não existe
        if (error.message.includes('User not found') || error.message.includes('not found')) {
          errorMessage = "Este email não está cadastrado em nossa base de dados. Verifique o email ou crie uma nova conta.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        }
        
        toast.error(errorMessage);
      } else {
        setSentTo(email);
        setStep("confirmation");
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (otp.length === 6 && !isLoading && !verified && recoveryMethod === "sms" && step === "confirmation") {
      verifyOtp();
    }
  }, [otp, isLoading, verified, recoveryMethod, step]);

  const verifyOtp = async () => {
    setIsLoading(true);
    
    if (!supabase) {
      toast.error("Erro de configuração do sistema");
      setIsLoading(false);
      return;
    }
    
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    const { error } = await supabase!.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });
    setIsLoading(false);
    if (error) {
      toast.error(`Código inválido: ${error.message}`);
      setOtp("");
    } else {
      toast.success("Verificação realizada com sucesso!");
      setVerified(true);
      setOtp("");
      // Redirecionar para reset-password com o telefone como parâmetro
      router.push(`/pages/auth/reset-password?phone=${encodeURIComponent(formattedPhone)}&method=sms`);
    }
  };

  const handleMethodSelect = (method: RecoveryMethod) => {
    setRecoveryMethod(method);
    setStep("input");
  };

  const getStepTitle = () => {
    if (step === "method") return "Escolha o método de recuperação";
    if (step === "input") {
      return recoveryMethod === "sms" ? "Recuperação via SMS" : "Recuperação via Email";
    }
    if (step === "confirmation") {
      return recoveryMethod === "sms" ? "SMS Enviado!" : "Email Enviado!";
    }
    return "Verificação de Código";
  };

  const getStepDescription = () => {
    if (step === "method") return "Selecione como deseja recuperar sua senha";
    if (step === "input") {
      return recoveryMethod === "sms" 
        ? "Digite seu número de telefone para receber o código"
        : "Digite seu email para receber o link de recuperação";
    }
    if (step === "confirmation") {
      return recoveryMethod === "sms" 
        ? `Código enviado para ${sentTo}. Verifique sua mensagem e insira o código abaixo.`
        : `Link de recuperação enviado para ${sentTo}. Verifique sua caixa de entrada e spam.`;
    }
    return "Insira o código recebido via SMS";
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <div className="max-w-lg w-full relative z-10">
        <div className="bg-gray-50/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
          <Logo showBackground={true} className="mx-auto" />
            <h1 className="text-2xl font-bold text-white mb-1">
              {getStepTitle()}
            </h1>
            <p className="text-white/70 text-sm">
              {getStepDescription()}
            </p>
          </div>

          {step === "method" ? (
            <div className="space-y-4">
              <div 
                className="flex items-center p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-gray-50/5 transition-colors"
                onClick={() => handleMethodSelect("sms")}
              >
                <FaSms className="text-2xl text-blue-400 mr-4" />
                <div className="text-left">
                  <h3 className="text-white font-semibold">Recuperação via SMS</h3>
                  <p className="text-white/70 text-sm">Receba um código no seu telefone</p>
                </div>
              </div>
              
              <div 
                className="flex items-center p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-gray-50/5 transition-colors"
                onClick={() => handleMethodSelect("email")}
              >
                <FaEnvelope className="text-2xl text-green-400 mr-4" />
                <div className="text-left">
                  <h3 className="text-white font-semibold">Recuperação via Email</h3>
                  <p className="text-white/70 text-sm">Receba um link no seu email</p>
                </div>
              </div>
            </div>
          ) : step === "input" ? (
            <div className="space-y-5">
              {recoveryMethod === "sms" ? (
                <div className="relative flex items-center justify-center">
                  <NumberWithInputField
                    value={countryCode}
                    onChange={setCountryCode}
                    inputValue={phone}
                    onInputChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 0) {
                        value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7,11)}`;
                      }
                      setPhone(value);
                    }}
                    options={[
                      { label: "Brazil (+55)", value: "+55" },
                      { label: "United States (+1)", value: "+1" },
                      { label: "Portugal (+351)", value: "+351" },
                      { label: "United Kingdom (+44)", value: "+44" },
                      { label: "Spain (+34)", value: "+34" },
                      { label: "France (+33)", value: "+33" },
                      { label: "Germany (+49)", value: "+49" },
                      { label: "Italy (+39)", value: "+39" },
                      { label: "Japan (+81)", value: "+81" },
                      { label: "China (+86)", value: "+86" },
                    ]}
                    placeholder="Select your country"
                    inputPlaceholder="Enter your phone number"
                    error={undefined}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                    className="w-full px-4 py-3 bg-gray-50/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <PrimaryButton
                type="button"
                onClick={sendOtp}
                disabled={isLoading || (recoveryMethod === "sms" ? !phone : !email)}
                isLoading={isLoading}
                loadingText={recoveryMethod === "sms" ? "Enviando..." : "Enviando email..."}
                icon={<FaArrowRight className="text-sm" />}
                className="w-full"
              >
                {recoveryMethod === "sms" ? "Enviar Código" : "Enviar Email"}
              </PrimaryButton>

              <div className="text-center">
                <button
                  onClick={() => setStep("method")}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Escolher outro método
                </button>
              </div>
            </div>
          ) : step === "confirmation" ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <FaCheckCircle className="text-3xl text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {recoveryMethod === "sms" ? "SMS Enviado com Sucesso!" : "Email Enviado com Sucesso!"}
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  {recoveryMethod === "sms" 
                    ? `Enviamos um código de verificação para ${sentTo}. Verifique suas mensagens e insira o código abaixo.`
                    : `Enviamos um link de recuperação para ${sentTo}. Verifique sua caixa de entrada e pasta de spam.`
                  }
                </p>
              </div>

              {recoveryMethod === "sms" ? (
                <div className="space-y-4">
                  <div className="relative flex justify-center items-center">
                    <InputOtp
                      length={6}
                      value={otp}
                      onValueChange={setOtp}
                      classNames={{
                        base: "w-full flex justify-center items-center gap-2",
                        input:
                          "w-12 h-12 bg-gray-50/10 border border-white/20 rounded-lg text-white text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      }}
                    />
                  </div>

                  {isLoading && <p className="text-center text-white">Verificando...</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-300 text-sm text-center">
                      O link de recuperação expira em 24 horas. Se não recebeu o email, verifique sua pasta de spam.
                    </p>
                  </div>
                  
                  <PrimaryButton
                    type="button"
                    onClick={() => router.push("/pages/auth/login")}
                    className="w-full"
                  >
                    Voltar para o Login
                  </PrimaryButton>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => {
                    setStep("method");
                    setOtp("");
                    setSentTo("");
                  }}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative flex justify-center items-center">
                <InputOtp
                  length={6}
                  value={otp}
                  onValueChange={setOtp}
                  classNames={{
                    base: "w-full flex justify-center items-center gap-2",
                    input:
                      "w-12 h-12 bg-gray-50/10 border border-white/20 rounded-lg text-white text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  }}
                />
              </div>

              {isLoading && <p className="text-center text-white">Verificando...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
