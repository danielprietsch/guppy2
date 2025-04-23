
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
    console.log("useOwnerProfile: Initializing");
    
    const checkAuthStatus = async () => {
      try {
        console.log("useOwnerProfile: Checking auth status");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("useOwnerProfile: No session found, redirecting to login");
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        console.log("useOwnerProfile: Session found, fetching profile");
        // Fix: Using let instead of const for profile since we need to reassign later
        let profileData;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("useOwnerProfile: Error fetching profile:", error);
          toast({
            title: "Perfil não encontrado",
            description: "Não foi possível carregar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        // Use the profile data or create a new one
        if (profile) {
          profileData = profile;
        } else {
          console.log("useOwnerProfile: No profile found, creating one from metadata");
          
          // Tentar criar perfil a partir dos metadados
          if (session.user.user_metadata) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                name: session.user.user_metadata.name || session.user.email?.split('@')[0] || "Usuário",
                email: session.user.email,
                user_type: session.user.user_metadata.userType || "owner",
                avatar_url: session.user.user_metadata.avatar_url
              });
              
            if (insertError) {
              console.error("useOwnerProfile: Error creating profile:", insertError);
              toast({
                title: "Erro ao criar perfil",
                description: "Não foi possível criar seu perfil.",
                variant: "destructive",
              });
              navigate("/login");
              return;
            }
            
            // Buscar o perfil recém-criado
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (newProfileError || !newProfile) {
              console.error("useOwnerProfile: Error fetching new profile:", newProfileError);
              navigate("/login");
              return;
            }
            
            profileData = newProfile;
          } else {
            console.log("useOwnerProfile: No metadata available to create profile");
            navigate("/login");
            return;
          }
        }
        
        if (profileData.user_type !== "owner") {
          console.log("useOwnerProfile: User is not an owner, redirecting");
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
          name: profileData.name || session.user.email?.split('@')[0] || "Usuário",
          email: profileData.email || session.user.email || "",
          userType: profileData.user_type as "client" | "provider" | "owner",
          avatarUrl: profileData.avatar_url,
          phoneNumber: profileData.phone_number
        };
        
        console.log("useOwnerProfile: Setting current user:", userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("useOwnerProfile: Error checking auth status:", error);
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
      console.log("useOwnerProfile: Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        console.log("useOwnerProfile: User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        // Refetch profile when signed in
        console.log("useOwnerProfile: User signed in, checking auth status");
        checkAuthStatus();
      }
    });
    
    checkAuthStatus();
    
    return () => {
      console.log("useOwnerProfile: Cleaning up");
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, setCurrentUser };
};
