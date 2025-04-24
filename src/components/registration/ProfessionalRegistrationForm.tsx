
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export const ProfessionalRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialties: '',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Here would be the actual registration logic with Supabase or other auth provider
      // For now, we'll just show a success message
      toast({
        title: "Cadastro enviado",
        description: "Seu cadastro foi recebido e está em análise.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        specialties: '',
        bio: ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-6">Cadastro de Profissional</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite seu nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="exemplo@email.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Crie uma senha segura"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirme sua senha"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(XX) XXXXX-XXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialties">Especialidades</Label>
          <Input
            id="specialties"
            name="specialties"
            value={formData.specialties}
            onChange={handleChange}
            placeholder="Ex: Cabeleireiro, Maquiador, Manicure"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Conte um pouco sobre você e sua experiência profissional"
            rows={4}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Cadastrando...' : 'Concluir cadastro'}
        </Button>
      </form>
    </div>
  );
};
