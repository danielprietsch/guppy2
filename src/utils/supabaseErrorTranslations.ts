
export const translateSupabaseError = (error: string): string => {
  const errorMessages: { [key: string]: string } = {
    "Invalid login credentials": "Credenciais de login inválidas",
    "Email not confirmed": "Email não confirmado",
    "Invalid email or password": "Email ou senha inválidos",
    "Email already registered": "Email já cadastrado",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
    "User already registered": "Usuário já cadastrado",
    "Network request failed": "Falha na conexão com o servidor",
    "Invalid email": "Email inválido",
    "Unable to validate email": "Não foi possível validar o email",
    "Rate limit exceeded": "Limite de tentativas excedido",
    "Password recovery failed": "Falha na recuperação de senha",
    "Token expired": "Token expirado",
    "JWT expired": "Sessão expirada",
    "Session not found": "Sessão não encontrada",
    "requested path is invalid": "Caminho solicitado é inválido"
  };

  // Try to find an exact match first
  if (errorMessages[error]) {
    return errorMessages[error];
  }

  // If no exact match, try to find a partial match
  for (const key in errorMessages) {
    if (error.includes(key)) {
      return errorMessages[key];
    }
  }

  // If no match found, return a generic error message
  return "Ocorreu um erro inesperado. Por favor, tente novamente.";
};
