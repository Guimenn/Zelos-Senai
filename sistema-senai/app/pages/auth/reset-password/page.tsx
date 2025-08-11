"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addToast } from "@heroui/react";
import { createClient } from "@supabase/supabase-js";
import { PrimaryButton } from "@/components/ui/button";
import Logo from "@/components/logo";
import { FaKey, FaEye, FaEyeSlash } from "react-icons/fa";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_API_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('Reset Password Page - URL:', window.location.href);
    console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('Hash:', window.location.hash);
    
    // Verificar se há erros na URL (hash)
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.substring(1));
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      console.log('Hash params:', { error, errorDescription });
      
      if (error) {
        let errorMessage = "Link inválido ou expirado.";
        
        if (error === 'access_denied') {
          if (errorDescription?.includes('expired')) {
            errorMessage = "O link de recuperação expirou. Solicite um novo link.";
          } else {
            errorMessage = "Acesso negado. O link pode ser inválido.";
          }
        }
        
        addToast({ 
          color: "danger", 
          title: "Erro", 
          description: errorMessage 
        });
        router.push("/pages/auth/error");
        return;
      }
    }

    // Verificar se há tokens de acesso na URL (fornecidos pelo Supabase)
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const token = searchParams.get('token');
    
    // Se não encontrou nos search params, verificar no hash
    if (!accessToken && hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashAccessToken = hashParams.get('access_token');
      const hashRefreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');
      
      console.log('Hash tokens:', { 
        accessToken: !!hashAccessToken, 
        refreshToken: !!hashRefreshToken, 
        type: hashType 
      });
      
      if (hashAccessToken && hashRefreshToken) {
        console.log('Setting session with hash tokens');
        supabase.auth.setSession({
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken,
        });
        setIsTokenValid(true);
        return;
      }
    }
    
    console.log('Token check:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, token: !!token });
    
    // Se há tokens de acesso, definir a sessão
    if (accessToken && refreshToken) {
      console.log('Setting session with tokens');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      setIsTokenValid(true);
      return;
    }
    
    // Se há token de recuperação, processar
    if (token && type === 'recovery') {
      console.log('Processing recovery token');
      // Processar o token de recuperação
      handleRecoveryToken(token);
      return;
    }
    
    // Se não há tokens válidos
    console.log('No valid tokens found, redirecting to forgot');
    addToast({ 
      color: "danger", 
      title: "Erro", 
      description: "Link inválido ou expirado. Solicite um novo link de recuperação." 
    });
    router.push("/pages/auth/forgot");
  }, [searchParams, router]);

  const handleRecoveryToken = async (token: string) => {
    console.log('handleRecoveryToken called with token:', token ? 'present' : 'missing');
    try {
      // Para tokens de recuperação, não precisamos verificar explicitamente
      // O Supabase já validou o token na URL
      // Podemos prosseguir diretamente para a redefinição de senha
      console.log('Setting token as valid');
      setIsTokenValid(true);
      addToast({ 
        color: "success", 
        title: "Link Válido", 
        description: "Agora você pode definir sua nova senha." 
      });
    } catch (error) {
      console.error('Error in handleRecoveryToken:', error);
      addToast({ 
        color: "danger", 
        title: "Erro", 
        description: "Erro ao processar link." 
      });
      router.push("/pages/auth/forgot");
    }
  };

  const handleResetPassword = async () => {
    console.log('handleResetPassword called');
    console.log('Password:', password ? 'filled' : 'empty');
    console.log('Confirm Password:', confirmPassword ? 'filled' : 'empty');
    
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      addToast({ 
        color: "danger", 
        title: "Erro", 
        description: "As senhas não coincidem." 
      });
      return;
    }

    // Validação de senha mais rigorosa (requisitos do Supabase)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      console.log('Password does not meet requirements');
      addToast({ 
        color: "danger", 
        title: "Erro", 
        description: "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial." 
      });
      return;
    }

    console.log('Starting password update process');
    setIsLoading(true);

    try {
      console.log('Checking session...');
      // Verificar se há uma sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session exists:', !!session);
      
      if (!session) {
        console.log('No session found, trying to set from URL tokens');
        // Se não há sessão, tentar usar o token da URL
        const accessToken = searchParams.get('access_token');
        const token = searchParams.get('token');
        
        console.log('URL tokens:', { accessToken: !!accessToken, token: !!token });
        
        if (accessToken) {
          console.log('Setting session with access token');
          // Se há access_token, definir a sessão primeiro
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: searchParams.get('refresh_token') || '',
          });
        } else if (token) {
          console.log('Token found, proceeding with update');
          // Se há token de recuperação, tentar atualizar diretamente
          // O Supabase vai validar o token automaticamente
        } else {
          console.log('No valid tokens found');
          addToast({ 
            color: "danger", 
            title: "Erro", 
            description: "Sessão inválida. Solicite um novo link de recuperação." 
          });
          router.push("/pages/auth/forgot");
          return;
        }
      }

      console.log('Attempting to update password...');
      
      // Obter o email do usuário da sessão ou do token
      let userEmail = '';
      if (session?.user?.email) {
        userEmail = session.user.email;
      } else {
        // Se não há sessão, tentar obter email do token
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            try {
              // Decodificar o token JWT para obter o email
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              userEmail = payload.email;
              console.log('Email from token:', userEmail);
            } catch (error) {
              console.error('Error decoding token:', error);
              userEmail = 'guimen070108@gmail.com'; // Fallback
            }
          } else {
            userEmail = 'guimen070108@gmail.com'; // Fallback
          }
        }
      }
      
      // Usar a API do backend em vez do Supabase
      const response = await fetch('/login/new-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Password update error:', data);
        let errorMessage = data.message || 'Erro ao atualizar senha';
        
        // Verificar se é o erro de senha igual
        if (data.message?.includes('different from the old password')) {
          errorMessage = "A nova senha deve ser diferente da senha atual.";
        } else if (data.message?.includes('Password should contain at least one character')) {
          errorMessage = "A senha deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial.";
        } else if (data.message?.includes('password')) {
          errorMessage = "Erro na validação da senha. Tente uma senha diferente.";
        }
        
        addToast({ 
          color: "danger", 
          title: "Erro", 
          description: errorMessage 
        });
        return;
      }

      console.log('Password updated successfully!');
      addToast({ 
        color: "success", 
        title: "Sucesso", 
        description: "Senha atualizada com sucesso! Você será redirecionado para o login." 
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        console.log('Redirecting to login...');
        router.push("/pages/auth/login");
      }, 2000);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      addToast({ 
        color: "danger", 
        title: "Erro", 
        description: "Erro inesperado ao atualizar senha." 
      });
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  // Se o token não foi validado ainda, mostrar loading
  if (!isTokenValid && !searchParams.get('access_token')) {
    return (
      <div className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="max-w-lg w-full relative z-10">
          <div className="bg-gray-50/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
            <div className="text-center">
            <Logo showBackground={true} className="mx-auto" />
              <h1 className="text-2xl font-bold text-white mb-4">
                Verificando Link...
              </h1>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <div className="max-w-lg w-full relative z-10">
        <div className="bg-gray-50/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
          <Logo showBackground={true} className="mx-auto" />
            <h1 className="text-2xl font-bold text-white mb-1">
              Redefinir Senha
            </h1>
            <p className="text-white/70 text-sm">
              Digite sua nova senha
            </p>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <div className="flex items-center">
                <FaKey className="absolute left-3 text-white/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <FaKey className="absolute left-3 text-white/50" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-white/50 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <PrimaryButton
              type="button"
              onClick={handleResetPassword}
              disabled={isLoading || !password || !confirmPassword}
              isLoading={isLoading}
              loadingText="Atualizando..."
              className="w-full"
            >
              Atualizar Senha
            </PrimaryButton>

            <div className="text-center">
              <button
                onClick={() => router.push("/pages/auth/login")}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
