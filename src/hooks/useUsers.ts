
import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useUsers = (userType?: string) => {
  const fetchUsers = async () => {
    let query = supabase.from('profiles').select('*');
    
    if (userType) {
      query = query.eq('user_type', userType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    // Map the Supabase profile data to our User type
    return data.map(profile => ({
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      user_type: profile.user_type,
      userType: profile.user_type, // Map to both fields for compatibility
      avatarUrl: profile.avatar_url,
      avatar_url: profile.avatar_url,
      phoneNumber: profile.phone_number,
      phone_number: profile.phone_number,
      cpf: profile.cpf,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
      // Add specialties as empty array if not present
      specialties: [],
      created_at: profile.created_at,
      updated_at: profile.updated_at
    })) as User[];
  };

  return useQuery({
    queryKey: ['users', userType],
    queryFn: fetchUsers
  });
};

export const useProfessionals = () => {
  return useUsers('professional');
};

// Function to find user by CPF - allows checking for existing users regardless of user type
// This enables the same CPF to be used for both professional and client accounts
export const useUserByCPF = (cpf: string, userType?: string) => {
  return useQuery({
    queryKey: ['user-by-cpf', cpf, userType],
    queryFn: async () => {
      // Skip the query if CPF is not provided
      if (!cpf) {
        return null;
      }
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cpf);
      
      if (userType) {
        query = query.eq('user_type', userType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching user by CPF:', error);
        return null;
      }
      
      if (data.length === 0) {
        return null;
      }
      
      const profile = data[0];
      
      // Map the profile to our User type
      return {
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        user_type: profile.user_type,
        userType: profile.user_type,
        avatarUrl: profile.avatar_url,
        avatar_url: profile.avatar_url,
        phoneNumber: profile.phone_number,
        phone_number: profile.phone_number,
        cpf: profile.cpf,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
        specialties: [],
        created_at: profile.created_at,
        updated_at: profile.updated_at
      } as User;
    },
    enabled: !!cpf
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Map the Supabase profile data to our User type
      return {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        user_type: data.user_type,
        userType: data.user_type,
        avatarUrl: data.avatar_url,
        avatar_url: data.avatar_url,
        phoneNumber: data.phone_number,
        phone_number: data.phone_number,
        cpf: data.cpf,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        specialties: [],
        created_at: data.created_at,
        updated_at: data.updated_at
      } as User;
    }
  });
};
