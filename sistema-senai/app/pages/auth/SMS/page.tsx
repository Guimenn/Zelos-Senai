"use client";
import { useState, useEffect } from "react";
  import { useRouter } from "next/navigation";
import { addToast } from "@heroui/react";
import { createClient } from "@supabase/supabase-js";
import { InputOtp } from '@heroui/react';
import { NumberWithInputField } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/button";
import Logo from "@/components/logo";
import { FaMobile, FaKey, FaArrowRight } from "react-icons/fa";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
export default function SMS() {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const sendOtp = async () => {
    setIsLoading(true);
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true,
        channel: "sms",
      },
    });
    setIsLoading(false);
    if (error) {
      addToast({ color: "danger", title: "Erro", description: `Erro ao enviar SMS: ${error.message}` });
    } else {
      addToast({ color: "success", title: "Sucesso", description: "Código enviado com sucesso!" });
      setStep("verify");
    }
  };
  useEffect(() => {
    if (otp.length === 6 && !isLoading && !verified) {
      verifyOtp();
    }
  }, [otp, isLoading, verified]);

  const verifyOtp = async () => {
    setIsLoading(true);
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });
    setIsLoading(false);
    if (error) {
      addToast({ color: "danger", title: "Erro", description: `Código inválido: ${error.message}` });
      setOtp("");
    } else {
      addToast({ color: "success", title: "Sucesso", description: "Login Realizado com Sucesso!" });
      setVerified(true);
      setOtp("");
      router.push("/pages/auth/login");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <div className="max-w-lg w-full relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold text-white mb-1">
              {step === "input"
                ? "Autenticação via SMS"
                : "Verificação de Código"}
            </h1>
            <p className="text-white/70 text-sm">
              {step === "input"
                ? "Digite seu número de telefone para receber o código"
                : "Insira o código recebido via SMS"}
            </p>
          </div>

          {step === "input" ? (
            <div className="space-y-5">
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

              <PrimaryButton
                type="button"
                onClick={sendOtp}
                disabled={isLoading || !phone}
                isLoading={isLoading}
                loadingText="Enviando..."
                icon={<FaArrowRight className="text-sm" />}
                className="w-full"
              >
                Enviar Código
              </PrimaryButton>
            </div>
          
          ) : (
              <div className="space-y-5">
              <div className="relative flex justify-center items-center">
                  <InputOtp
                    length={6}
                    value={otp}
                    onValueChange={setOtp}
                    classNames={{
                      base: "w-full flex justify-center items-center",
                      input:
                        "bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-0 focus:ring-red-500 focus:border-transparent text-center flex justify-center items-center",
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
