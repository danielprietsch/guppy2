
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProfileImageUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onImageUploaded: (url: string) => void;
  className?: string;
}

export function ProfileImageUpload({ 
  userId, 
  currentAvatarUrl, 
  onImageUploaded,
  className = ""
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentAvatarUrl) {
      console.log("ProfileImageUpload: Setting preview from currentAvatarUrl:", currentAvatarUrl);
      setPreviewUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);
      console.log("Starting upload for user:", userId);

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo permitido: 5MB");
      }

      if (!file.type.startsWith('image/')) {
        throw new Error("Por favor, selecione apenas arquivos de imagem");
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      console.log(`Uploading to path: ${filePath} in 'avatars' bucket`);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("Image uploaded successfully, public URL:", publicUrl);

      // Use the security definer function to update both profile and auth metadata
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'update_avatar_everywhere',
        { user_id: userId, avatar_url: publicUrl }
      );

      if (updateError) {
        console.error("Error updating avatar:", updateError);
        throw new Error("Não foi possível atualizar o avatar: " + updateError.message);
      }

      console.log("Avatar updated successfully via RPC function, result:", updateResult);

      // Update user metadata directly to ensure it's updated
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      if (metadataError) {
        console.error("Error updating user metadata:", metadataError);
      } else {
        console.log("User metadata updated successfully with new avatar");
      }

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);

      // Force refresh of profile data in other components by publishing to realtime
      try {
        await supabase.rpc('force_refresh_profile', { profile_id: userId });
        console.log("Forced profile refresh signal sent");
      } catch (refreshError) {
        console.error("Error sending refresh signal:", refreshError);
      }
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao atualizar foto",
        description: error.message || "Não foi possível fazer o upload da imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
  };

  const firstLetter = userId.charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative cursor-pointer group block">
        <Avatar className="h-32 w-32 border-2 border-primary/20">
          <AvatarImage 
            src={previewUrl || undefined}
            alt="Foto de perfil" 
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-primary text-3xl">
            {firstLetter}
          </AvatarFallback>
        </Avatar>

        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white flex flex-col items-center gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-sm">Alterar foto</span>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        <label 
          className="absolute bottom-0 right-0 -translate-x-1/4 -translate-y-1/4 p-2 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors"
          title="Alterar foto de perfil"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
          <div className="absolute inset-0 -m-4 rounded-full" />
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}
