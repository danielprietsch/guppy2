
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users2, Scissors, Building2 } from 'lucide-react';

interface UserTypeOption {
  type: 'client' | 'professional' | 'owner';
  label: string;
  description: string;
  icon: React.ElementType;
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'client',
    label: 'Cliente',
    description: 'Busco serviços de beleza',
    icon: Users2
  },
  {
    type: 'professional',
    label: 'Profissional',
    description: 'Presto serviços de beleza',
    icon: Scissors
  },
  {
    type: 'owner',
    label: 'Franqueado',
    description: 'Quero disponibilizar espaços',
    icon: Building2
  }
];

interface UserTypeSelectorProps {
  onSelectUserType: (type: UserTypeOption['type']) => void;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ onSelectUserType }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {userTypeOptions.map((option) => {
        const Icon = option.icon;
        return (
          <div 
            key={option.type}
            className="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectUserType(option.type)}
          >
            <div className="flex justify-center mb-4">
              <Icon className="h-12 w-12 text-guppy-primary" />
            </div>
            <h3 className="text-lg font-semibold">{option.label}</h3>
            <p className="text-sm text-gray-600">{option.description}</p>
          </div>
        );
      })}
    </div>
  );
};
