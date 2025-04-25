
# Sistema de Gestão de Espaços para Profissionais da Beleza

## 📝 Sobre o Projeto

Este é um sistema web desenvolvido para gerenciar espaços e cabines para profissionais da beleza. A plataforma permite que proprietários disponibilizem seus espaços para aluguel, e profissionais possam reservá-los de forma eficiente.

## 🚀 Funcionalidades Principais

- **Sistema de Autenticação**
  - Login/Registro com múltiplos tipos de usuário (cliente, profissional, proprietário, admin)
  - Recuperação de senha
  - Perfis personalizados por tipo de usuário

- **Gestão de Espaços**
  - Cadastro e gerenciamento de locais
  - Sistema de aprovação de novos espaços
  - Configuração de cabines e equipamentos
  - Definição de preços e disponibilidade

- **Sistema de Reservas**
  - Agendamento de cabines
  - Visualização de disponibilidade
  - Histórico de reservas
  - Confirmação e cancelamento

- **Painel Administrativo**
  - Gestão de usuários
  - Aprovação de locais
  - Monitoramento de reservas
  - Configurações do sistema

## 🛠 Tecnologias Utilizadas

- **Frontend**
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui
  - React Router
  - React Query
  - Framer Motion
  - Lucide Icons

- **Backend**
  - Supabase (Banco de dados e autenticação)
  - PostgreSQL
  - Row Level Security (RLS)

## 📦 Instalação e Execução

1. Clone o repositório
```bash
git clone <URL_DO_REPOSITÓRIO>
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
# Crie um arquivo .env na raiz do projeto com as seguintes variáveis:
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

4. Execute o projeto
```bash
npm run dev
```

## 🔒 Tipos de Usuário

### Cliente
- Visualiza profissionais e locais
- Faz reservas
- Gerencia seu perfil

### Profissional
- Gerencia sua agenda
- Reserva cabines
- Configura seus serviços

### Proprietário
- Cadastra e gerencia locais
- Configura cabines e preços
- Visualiza relatórios

### Administrador Global
- Gerencia todos os usuários
- Aprova novos locais
- Configura o sistema

## 📱 Layout Responsivo

O sistema é totalmente responsivo, adaptando-se a diferentes tamanhos de tela:
- Desktop
- Tablet
- Dispositivos móveis

## 🔐 Segurança

- Autenticação segura via Supabase
- Políticas de Row Level Security (RLS)
- Validação de dados em tempo real
- Proteção contra XSS e CSRF

## 🌐 Endpoints da API

### Autenticação
- POST /auth/login
- POST /auth/register
- POST /auth/reset-password

### Locais
- GET /locations
- POST /locations
- PUT /locations/:id
- DELETE /locations/:id

### Reservas
- GET /bookings
- POST /bookings
- PUT /bookings/:id
- DELETE /bookings/:id

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- users
- profiles
- locations
- cabins
- bookings
- services

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para support@seudominio.com ou abra uma issue no repositório.

## 🎉 Agradecimentos

- Equipe de desenvolvimento
- Contribuidores
- Comunidade open source

---

Desenvolvido com ❤️ pela sua equipe

