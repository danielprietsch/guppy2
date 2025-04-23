
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useOwnerProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!profile) {
          toast({
            title: "Perfil não encontrado",
            description: "Não foi possível carregar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        if (profile.user_type !== "owner") {
          toast({
            title: "Acesso restrito",
            description: "Você não tem permissão para acessar esta página.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        const userData: User = {
          id: session.user.id,
          name: profile.name || session.user.email?.split('@')[0] || "Usuário",
          email: profile.email || session.user.email || "",
          userType: profile.user_type as "client" | "provider" | "owner",
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number
        };
        
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error checking auth status:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar sua autenticação.",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
    
    checkAuthStatus();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, setCurrentUser };
};
