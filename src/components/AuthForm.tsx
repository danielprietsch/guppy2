
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

type AuthFormMode = "login" | "register";

interface AuthFormProps {
  mode: AuthFormMode;
  onSubmit: (data: any) => void;
}

const AuthForm = ({ mode, onSubmit }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"client" | "provider">("client");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real application, this would call an authentication service
      if (mode === "login") {
        await onSubmit({ email, password });
      } else {
        await onSubmit({ name, email, password, userType });
      }
      toast({
        title: mode === "login" ? "Login realizado com sucesso!" : "Cadastro realizado com sucesso!",
        description: mode === "login" ? "Bem-vindo de volta." : "Sua conta foi criada.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "client" | "provider")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">Cliente (estou procurando profissionais)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="provider" id="provider" />
                <Label htmlFor="provider">Prestador de Serviço (cabeleireiro/barbeiro/manicure/etc)</Label>
              </div>
            </RadioGroup>
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
        <Button variant="outline" className="w-full">
          Google
        </Button>
        <Button variant="outline" className="w-full">
          Facebook
        </Button>
        <Button variant="outline" className="w-full">
          LinkedIn
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
