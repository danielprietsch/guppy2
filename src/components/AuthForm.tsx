import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Scissors, User, Briefcase } from "lucide-react";

const userTypes = [
  {
    key: "client",
    label: "Cliente",
    desc: "Estou procurando profissionais",
    img: "/icons/client-icon.svg", // Clean, minimalist icon representing a client
    icon: <User className="w-8 h-8 text-purple-400" />,
  },
  {
    key: "provider",
    label: "Prestador",
    desc: "Cabeleireiro, barbeiro, manicure etc.",
    img: "/icons/scissors-icon.svg", // Scissors icon representing service providers
    icon: <Scissors className="w-8 h-8 text-pink-400" />,
  },
  {
    key: "owner",
    label: "Dono/Franqueado",
    desc: "Local de serviços ou franquia",
    img: "/icons/business-icon.svg", // Minimalist business/building icon
    icon: <Briefcase className="w-8 h-8 text-blue-400" />,
  },
];

const AuthForm = ({ mode, onSubmit }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"client" | "provider" | "owner">("client");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
                    {type.img ? (
                      <img
                        src={type.img}
                        alt={type.label}
                        className="w-12 h-12 object-cover rounded-full border shadow"
                      />
                    ) : (
                      type.icon
                    )}
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
