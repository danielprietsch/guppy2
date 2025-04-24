import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ProfileImageUpload } from "../profile/ProfileImageUpload";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
});

interface OwnerProfileFormProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

export function OwnerProfileForm({ currentUser, setCurrentUser }: OwnerProfileFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber || "",
    avatarUrl: currentUser.avatarUrl || "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || "",
        avatarUrl: currentUser.avatarUrl || "",
      });
    }
  }, [currentUser]);

  async function handleSaveProfile() {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phoneNumber,
          avatar_url: formData.avatarUrl,
        })
        .eq('id', currentUser.id);
        
      if (error) {
        throw error;
      }
      
      const updatedUser = {
        ...currentUser,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        avatarUrl: formData.avatarUrl,
      };
      
      setCurrentUser(updatedUser);
      
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar seus dados.",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <ProfileImageUpload
        userId={currentUser.id}
        currentAvatarUrl={currentUser.avatarUrl}
        onImageUploaded={(url) => {
          setFormData(prev => ({ ...prev, avatarUrl: url }));
        }}
        className="mb-6"
      />
      
      <FormField
        control={useForm().control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input 
                placeholder="Seu nome completo" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={useForm().control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input 
                placeholder="seu@email.com" 
                value={formData.email}
                type="email" 
                readOnly
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={useForm().control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input 
                placeholder="(00) 00000-0000" 
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          type="button"
        >
          Cancelar
        </Button>
        <Button type="button" onClick={handleSaveProfile}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
