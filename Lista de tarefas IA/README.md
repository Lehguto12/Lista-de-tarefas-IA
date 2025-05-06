# Sistema de Gerenciamento de Tarefas com IA

Sistema inteligente para gerenciamento de tarefas que utiliza Inteligência Artificial para otimizar sua produtividade.

## Funcionalidades

- Adição de tarefas por voz ou texto
- Classificação automática de tarefas
- Sugestões inteligentes de horários
- Integração com Google Calendar
- Notificações personalizadas
- Análise de produtividade
- Reconhecimento de padrões
- Interface responsiva
- API REST para integrações

## Tecnologias Utilizadas

- Frontend: React.js
- Backend: Node.js com Express
- Banco de Dados: MongoDB
- IA: OpenAI API
- Autenticação: JWT
- Integração: Google Calendar API

## Requisitos

- Node.js 14+
- MongoDB
- Conta Google (para integração com Calendar)
- Chave API OpenAI

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
```

2. Instale as dependências do backend:
```bash
npm install
```

3. Instale as dependências do frontend:
```bash
cd client
npm install
```

4. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
MONGODB_URI=sua_uri_mongodb
JWT_SECRET=seu_segredo_jwt
OPENAI_API_KEY=sua_chave_api_openai
GOOGLE_CLIENT_ID=seu_client_id_google
GOOGLE_CLIENT_SECRET=seu_client_secret_google
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev:full
```

## Uso

1. Acesse `http://localhost:3000` no seu navegador
2. Faça login ou crie uma nova conta
3. Comece a adicionar suas tarefas!

## API Endpoints

- POST /api/tasks - Criar nova tarefa
- GET /api/tasks - Listar tarefas
- PUT /api/tasks/:id - Atualizar tarefa
- DELETE /api/tasks/:id - Remover tarefa
- GET /api/analytics - Obter relatórios de produtividade

## Contribuição

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de submeter pull requests.

## Licença

MIT 