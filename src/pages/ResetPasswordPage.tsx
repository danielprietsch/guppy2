import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const translatedError = translateSupabaseError(error.message);
        throw new Error(translatedError);
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso!"
      });

      navigate("/login");
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Redefinir Senha</h1>
          <p className="text-gray-500">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isResetting}>
            {isResetting ? "Redefinindo..." : "Redefinir Senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
