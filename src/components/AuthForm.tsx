import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Scissors, User, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuthFormMode = "login" | "register";

interface AuthFormProps {
  mode: AuthFormMode;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

// Definição de ícones em formato svg, mantendo padronização visual nos três
const userTypes = [
  {
    key: "client",
    label: "Cliente",
    desc: "Estou procurando profissionais",
    icon: <User className="w-8 h-8 text-purple-400" />,
  },
  {
    key: "provider",
    label: "Prestador de Serviço",
    desc: "Cabeleireiro, barbeiro, manicure etc.",
    icon: <Scissors className="w-8 h-8 text-pink-400" />,
  },
  {
    key: "owner",
    label: "Dono/Franqueado",
    desc: "Local de serviços ou franquia",
    icon: <Briefcase className="w-8 h-8 text-blue-400" />,
  },
];

const AuthForm = ({ mode, onSubmit, isLoading }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"client" | "provider" | "owner">("client");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "login") {
        await onSubmit({ email, password });
      } else {
        await onSubmit({ name, email, password, userType });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) {
        console.error("Erro ao fazer login com Google:", error);
        toast({
          title: "Erro ao fazer login com Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao autenticar com Google:", error);
      toast({
        title: "Erro ao processar autenticação",
        description: "Ocorreu um problema ao tentar autenticar com Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {mode === "login" ? "Login" : "Criar Conta"}
        </h1>
        <p className="text-gray-500">
          {mode === "login"
            ? "Entre com sua conta para continuar"
            : "Preencha os dados abaixo para se cadastrar"}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Digite seu nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="nome@exemplo.com"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label>Tipo de Usuário</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {userTypes.map(type => (
                <button
                  type="button"
                  key={type.key}
                  onClick={() => setUserType(type.key as "client" | "provider" | "owner")}
                  className={[
                    "flex flex-col items-center ring-1 ring-muted p-3 rounded-lg transition shadow-sm group",
                    userType === type.key
                      ? "border-2 border-primary ring-2 ring-primary bg-muted"
                      : "hover:ring-primary hover:border-primary/20 bg-background"
                  ].join(" ")}
                  aria-pressed={userType === type.key}
                >
                  <div className="mb-2">
                    {type.icon}
                  </div>
                  <span className="font-semibold text-md">{type.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 text-center">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </Button>
      </form>

      <div className="text-center text-sm">
        {mode === "login" ? (
          <>
            Não tem uma conta?{" "}
            <Link to="/register" className="underline">
              Cadastre-se
            </Link>
          </>
        ) : (
          <>
            Já tem uma conta?{" "}
            <Link to="/login" className="underline">
              Faça login
            </Link>
          </>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google
        </Button>
        <Button variant="outline" className="w-full" disabled>
          Facebook
        </Button>
        <Button variant="outline" className="w-full" disabled>
          LinkedIn
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
