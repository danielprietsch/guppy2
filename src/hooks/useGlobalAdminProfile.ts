
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

        const userData: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
          email: session.user.email || "",
          userType: "global_admin",
          avatarUrl: session.user.user_metadata?.avatar_url,
          phoneNumber: session.user.user_metadata?.phone_number
        };

        setCurrentUser(userData);
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
      
      const { data, error } = await supabase.rpc('update_admin_profile', {
        user_id: currentUser.id,
        user_name: values.name || currentUser.name,
        user_email: values.email || currentUser.email,
        user_phone: values.phoneNumber || null,
        user_avatar: values.avatarUrl || null
      });

      if (error) throw error;

      // Atualizar o estado local
      setCurrentUser(prev => prev ? { ...prev, ...values } : null);
      
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
    } catch (err) {
      debugError("useGlobalAdminProfile: Error updating profile:", err);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar seus dados.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { currentUser, isLoading, error, updateProfile };
}
