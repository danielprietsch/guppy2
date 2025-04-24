
import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { debugLog, debugError } from '@/utils/debugLogger';

interface UseGlobalAdminProfileReturn {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (values: Partial<User>) => Promise<void>;
}

export function useGlobalAdminProfile(): UseGlobalAdminProfileReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Sessão não encontrada");
          return;
        }

        // Primeiro, tentamos carregar os dados do perfil do banco de dados
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, email, phone_number, avatar_url')
          .eq('id', session.user.id)
          .single();

        // Se conseguimos dados do perfil, usamos eles
        if (profileData && !profileError) {
          const userData: User = {
            id: session.user.id,
            name: profileData.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
            email: profileData.email || session.user.email || "",
            userType: "global_admin",
            avatarUrl: profileData.avatar_url || session.user.user_metadata?.avatar_url,
            phoneNumber: profileData.phone_number || session.user.user_metadata?.phone_number
          };
          setCurrentUser(userData);
          debugLog("useGlobalAdminProfile: Perfil carregado do banco de dados:", userData);
        } 
        // Se não conseguimos, usamos os metadados do usuário
        else {
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
            email: session.user.email || "",
            userType: "global_admin",
            avatarUrl: session.user.user_metadata?.avatar_url,
            phoneNumber: session.user.user_metadata?.phone_number
          };
          setCurrentUser(userData);
          debugLog("useGlobalAdminProfile: Perfil carregado dos metadados:", userData);
          
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = No rows returned
            debugError("useGlobalAdminProfile: Erro ao carregar perfil do banco:", profileError);
          }
        }
      } catch (err) {
        debugError("useGlobalAdminProfile: Error loading profile:", err);
        setError("Erro ao carregar perfil");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (values: Partial<User>) => {
    if (!currentUser) return;

    try {
      debugLog("useGlobalAdminProfile: Updating profile:", values);
      
      // Primeiro, tentamos atualizar usando a função RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_admin_profile', {
        user_id: currentUser.id,
        user_name: values.name || currentUser.name,
        user_email: values.email || currentUser.email,
        user_phone: values.phoneNumber || null,
        user_avatar: values.avatarUrl || null
      });

      if (rpcError) {
        debugError("useGlobalAdminProfile: Erro na função RPC:", rpcError);
        throw rpcError;
      }

      // Como backup, também atualizamos os metadados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: values.name || currentUser.name,
          email: values.email || currentUser.email,
          avatar_url: values.avatarUrl || currentUser.avatarUrl,
          userType: 'global_admin'
        }
      });

      if (updateError) {
        debugError("useGlobalAdminProfile: Erro ao atualizar metadados:", updateError);
      } else {
        debugLog("useGlobalAdminProfile: Metadados atualizados com sucesso");
      }

      // Atualizar o estado local independentemente do resultado
      const updatedUser = { ...currentUser, ...values };
      setCurrentUser(updatedUser);
      
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
      
      debugLog("useGlobalAdminProfile: Perfil atualizado localmente:", updatedUser);
    } catch (err) {
      debugError("useGlobalAdminProfile: Error updating profile:", err);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar seus dados. Tente novamente mais tarde.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { currentUser, isLoading, error, updateProfile };
}
