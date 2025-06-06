
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
          // Start with user metadata (most reliable source)
          let userData: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || '',
            email: session.user.email || '',
            user_type: (session.user.user_metadata?.userType as "professional" | "client" | "owner" | "global_admin") || 'client',
            avatarUrl: session.user.user_metadata?.avatar_url,
            avatar_url: session.user.user_metadata?.avatar_url,
            specialties: []
          };
          
          // Then try to enhance with profile data if available
          try {
            // Direct query to profiles table instead of using any function that might trigger recursion
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileData) {
              userData = {
                ...userData,
                name: profileData.name || userData.name,
                email: profileData.email || userData.email,
                user_type: profileData.user_type as "professional" | "client" | "owner" | "global_admin",
                avatarUrl: profileData.avatar_url,
                avatar_url: profileData.avatar_url,
                phoneNumber: profileData.phone_number,
                phone_number: profileData.phone_number,
                cpf: profileData.cpf,
                address: profileData.address,
                city: profileData.city,
                state: profileData.state,
                zip_code: profileData.zip_code
              };
            }
          } catch (profileError) {
            console.error("Error fetching profile in auth hook:", profileError);
            // Continue with user metadata only
          }
          
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth hook:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Setup auth state change listener with improved handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          // When signed out, immediately clear the user state
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (session) {
          // Call getUser with a small delay to ensure we don't trigger recursion
          setTimeout(() => {
            getUser();
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Setup real-time subscription for profile updates
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log("Profile update received via realtime:", payload);
          // Check if update is for current user
          if (user && payload.new.id === user.id) {
            // Update user data with new profile information
            setUser(prev => {
              if (!prev) return null;
              return {
                ...prev,
                name: payload.new.name || prev.name,
                avatarUrl: payload.new.avatar_url,
                avatar_url: payload.new.avatar_url,
                phoneNumber: payload.new.phone_number,
                phone_number: payload.new.phone_number
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return { user, loading };
};
