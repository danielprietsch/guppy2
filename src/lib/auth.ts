
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setUser({
              id: profileData.id,
              name: profileData.name || '',
              email: profileData.email || '',
              user_type: profileData.user_type as "professional" | "client" | "owner" | "global_admin",
              avatarUrl: profileData.avatar_url,
              avatar_url: profileData.avatar_url,
              phoneNumber: profileData.phone_number,
              phone_number: profileData.phone_number,
              specialties: [],
              cpf: profileData.cpf,
              address: profileData.address,
              city: profileData.city,
              state: profileData.state,
              zip_code: profileData.zip_code
            });
          } else {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || '',
              email: session.user.email || '',
              user_type: (session.user.user_metadata?.user_type as "professional" | "client" | "owner" | "global_admin") || 'client',
              avatarUrl: session.user.user_metadata?.avatar_url,
              avatar_url: session.user.user_metadata?.avatar_url,
              specialties: []
            });
          }
        }
      } catch (error) {
        console.error("Error in auth hook:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          getUser();
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
