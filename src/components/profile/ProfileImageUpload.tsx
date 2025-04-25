
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, Camera } from "lucide-react";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);

  // Effect to update preview URL when currentAvatarUrl changes
  useEffect(() => {
    if (currentAvatarUrl) {
      setPreviewUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);
      console.log("Starting upload for user:", userId);

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo permitido: 5MB");
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error("Por favor, selecione apenas arquivos de imagem");
      }

      // Create unique filename using userId
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Make sure avatars bucket exists
      console.log("Checking if avatars bucket exists");
      const { data: bucketExists } = await supabase.storage
        .getBucket('avatars');
      
      if (!bucketExists) {
        console.log("Creating avatars bucket");
        const { error: bucketError } = await supabase.storage
          .createBucket('avatars', { public: true });
        
        if (bucketError) {
          console.error("Error creating bucket:", bucketError);
          // Continue anyway, as the bucket might already exist
        }
      }

      // Upload file to 'avatars' bucket
      console.log("Uploading file to path:", filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("Image uploaded successfully, public URL:", publicUrl);

      // Update both user metadata and profile with separate calls instead of using RPC
      try {
        // Update user metadata with new avatar URL
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
        });

        if (userUpdateError) {
          console.error("Error updating user metadata:", userUpdateError);
          throw userUpdateError;
        }

        // Update profile in profiles table
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileUpdateError) {
          console.error("Error updating profile:", profileUpdateError);
          throw new Error("Não foi possível atualizar o perfil no banco de dados");
        }
        
        console.log("Profile and user metadata updated successfully");
      } catch (rpcError) {
        console.error("Error updating avatar:", rpcError);
        throw new Error("Não foi possível atualizar o avatar em todos os sistemas");
      }

      // Update local preview
      setPreviewUrl(publicUrl);
      
      // Notify parent component
      onImageUploaded(publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
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
      <div className="relative cursor-pointer group">
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
        
        <label 
          className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors"
          title="Alterar foto de perfil"
        >
          <Camera className="h-5 w-5" />
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
        </label>

        <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <span className="text-sm">Alterar foto</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          asChild
        >
          <label className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Atualizar foto
              </>
            )}
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
