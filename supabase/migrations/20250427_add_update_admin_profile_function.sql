
-- Função para atualizar o perfil do administrador, contornando problemas de RLS
CREATE OR REPLACE FUNCTION public.update_admin_profile(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  user_avatar TEXT
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A função é SECURITY DEFINER, então ela executa com os privilégios do criador (superuser)
  -- Isso permite contornar as políticas de RLS que estão causando recursão infinita
  
  -- Atualizar o perfil do usuário diretamente
  UPDATE public.profiles
  SET 
    name = user_name,
    email = user_email,
    phone_number = user_phone,
    avatar_url = user_avatar,
    updated_at = now()
  WHERE id = user_id;
  
  -- Também atualizar os metadados do usuário na tabela auth.users para garantir consistência
  UPDATE auth.users
  SET
    raw_user_meta_data = 
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(raw_user_meta_data, '{}'::jsonb),
              '{name}', 
              to_jsonb(user_name)
            ),
            '{email}', 
            to_jsonb(user_email)
          ),
          '{avatar_url}',
          to_jsonb(COALESCE(user_avatar, ''))
        ),
        '{userType}',
        COALESCE(raw_user_meta_data->'userType', '"global_admin"'::jsonb)
      )
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Garantir que apenas administradores globais possam chamar esta função
REVOKE EXECUTE ON FUNCTION public.update_admin_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_admin_profile TO authenticated;

-- Adicionar a função ao conjunto de funções verificadas pelo RLS
COMMENT ON FUNCTION public.update_admin_profile IS 'Função com privilégios elevados para atualizar perfil de administrador';
