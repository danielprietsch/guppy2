
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useOwnerProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    debugLog("useOwnerProfile: Initializing");
    
    const checkAuthStatus = async () => {
      try {
        debugLog("useOwnerProfile: Checking auth status");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("useOwnerProfile: No session found, redirecting to login");
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        debugLog("useOwnerProfile: Session found, checking user type");
        
        // Primeiro verificar metadados do usuário (mais confiável)
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        if (userTypeFromMetadata === 'owner') {
          // Se os metadados confirmam que é franqueado, criar usuário a partir dos metadados
          debugLog("useOwnerProfile: User is owner according to metadata");
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: "owner",
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: null
          };
          
          debugLog("useOwnerProfile: Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // Se os metadados não confirmam que é franqueado, tentar buscar perfil
        debugLog("useOwnerProfile: Fetching profile");
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (error) {
            debugError("useOwnerProfile: Error fetching profile:", error);
            
            // Se os metadados indicam outro tipo de usuário, redirecionar
            if (userTypeFromMetadata && userTypeFromMetadata !== 'owner') {
              toast({
                title: "Acesso restrito",
                description: "Você não tem permissão para acessar esta página.",
                variant: "destructive",
              });
              navigate("/");
              return;
            }
            
            // Se não conseguimos determinar, tentar criar perfil a partir dos metadados
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
                email: session.user.email,
                user_type: userTypeFromMetadata || "owner",
                avatar_url: userMetadata?.avatar_url
              });
              
            if (insertError) {
              debugError("useOwnerProfile: Error creating profile:", insertError);
              
              // Se falhar na criação do perfil mas temos metadados, usar esses dados
              if (userMetadata) {
                const userData: User = {
                  id: session.user.id,
                  name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
                  email: session.user.email || "",
                  userType: "owner",
                  avatarUrl: userMetadata?.avatar_url,
                  phoneNumber: null
                };
                
                debugLog("useOwnerProfile: Setting currentUser as fallback:", userData);
                setCurrentUser(userData);
                setIsLoading(false);
                return;
              }
              
              // Se não temos nem perfil nem metadados suficientes, redirecionar
              navigate("/login");
              return;
            }
            
            // Se criamos o perfil com sucesso, buscar o perfil recém-criado
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (newProfile) {
              // Verificar se o perfil criado é de franqueado
              if (newProfile.user_type !== "owner") {
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
                name: newProfile.name || userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
                email: newProfile.email || session.user.email || "",
                userType: newProfile.user_type as "client" | "provider" | "owner",
                avatarUrl: newProfile.avatar_url || userMetadata?.avatar_url,
                phoneNumber: newProfile.phone_number
              };
              
              debugLog("useOwnerProfile: Setting currentUser from new profile:", userData);
              setCurrentUser(userData);
              setIsLoading(false);
              return;
            }
          }
          
          // Se o perfil existe, usá-lo
          if (profile) {
            // Verificar se o perfil é de franqueado
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
              name: profile.name || userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
              email: profile.email || session.user.email || "",
              userType: profile.user_type as "client" | "provider" | "owner",
              avatarUrl: profile.avatar_url || userMetadata?.avatar_url,
              phoneNumber: profile.phone_number
            };
            
            debugLog("useOwnerProfile: Setting currentUser from profile:", userData);
            setCurrentUser(userData);
          } else {
            // Se não encontramos um perfil, redirecionar
            toast({
              title: "Perfil não encontrado",
              description: "Não foi possível encontrar seu perfil de franqueado.",
              variant: "destructive",
            });
            navigate("/");
          }
        } catch (error) {
          debugError("useOwnerProfile: Error in profile section:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao buscar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } catch (error) {
        debugError("useOwnerProfile: Error checking auth status:", error);
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
      debugLog("useOwnerProfile: Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugLog("useOwnerProfile: User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        // Re-verificar perfil ao fazer login
        debugLog("useOwnerProfile: User signed in, checking auth status");
        // Pequeno timeout para evitar race conditions
        setTimeout(() => {
          checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      debugLog("useOwnerProfile: Cleaning up");
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, setCurrentUser };
};
