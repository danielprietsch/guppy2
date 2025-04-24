
import { useState } from "react";
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

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);

      // Verificar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo permitido: 5MB");
      }

      // Verificar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error("Por favor, selecione apenas arquivos de imagem");
      }

      // Criar nome único para o arquivo usando userId
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload do arquivo para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar avatar no perfil do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
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
