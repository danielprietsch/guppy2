
import React, { useState } from 'react';
import { UserTypeSelector } from '@/components/registration/UserTypeSelector';
import { ProfessionalRegistrationForm } from '@/components/registration/ProfessionalRegistrationForm';
import { ClientRegistrationForm } from '@/components/registration/ClientRegistrationForm';
import { OwnerRegistrationForm } from '@/components/registration/OwnerRegistrationForm';

const RegisterPage: React.FC = () => {
  const [selectedUserType, setSelectedUserType] = useState<'client' | 'professional' | 'owner' | null>(null);

  const handleUserTypeSelection = (type: 'client' | 'professional' | 'owner') => {
    setSelectedUserType(type);
  };

  const renderRegistrationForm = () => {
    switch(selectedUserType) {
      case 'professional':
        return <ProfessionalRegistrationForm />;
      case 'client':
        return <ClientRegistrationForm />;
      case 'owner':
        return <OwnerRegistrationForm />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Faça seu cadastro no Guppy</h1>
        <p className="text-gray-600">Escolha um tipo de conta para continuar</p>
      </div>

      {!selectedUserType ? (
        <UserTypeSelector onSelectUserType={handleUserTypeSelection} />
      ) : (
        renderRegistrationForm()
      )}
    </div>
  );
};

export default RegisterPage;
