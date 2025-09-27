# Guia de Instalação e Teste - Nutt Festas

## 🚀 Migração Concluída: LocalStorage → Banco de Dados Remoto

A migração do sistema de armazenamento local (LocalStorage) para um banco de dados remoto foi **concluída com sucesso**! 

### ✅ O que foi implementado:

1. **Backend Node.js completo** com Express e MongoDB
2. **API REST segura** com autenticação JWT
3. **Frontend atualizado** para usar a API remota
4. **Sistema de autenticação** robusto
5. **Validação e segurança** implementadas

## 📋 Pré-requisitos

Antes de testar o sistema, você precisa instalar:

### 1. Node.js
- Baixe e instale o Node.js em: https://nodejs.org/
- Versão recomendada: 18.x ou superior
- Verifique a instalação: `node --version` e `npm --version`

### 2. MongoDB
Escolha uma das opções:

#### Opção A: MongoDB Local
- Baixe em: https://www.mongodb.com/try/download/community
- Instale e inicie o serviço

#### Opção B: MongoDB Atlas (Recomendado)
- Crie uma conta gratuita em: https://www.mongodb.com/atlas
- Crie um cluster gratuito
- Obtenha a string de conexão
- Atualize `MONGODB_URI` no arquivo `.env`

## 🛠️ Instalação

### 1. Instalar dependências do backend
```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente
- O arquivo `.env` já foi criado no diretório `backend/`
- Se usar MongoDB Atlas, atualize a `MONGODB_URI`
- Altere o `JWT_SECRET` para uma chave mais segura em produção

### 3. Criar usuário administrador
```bash
cd backend
node scripts/createAdmin.js
```

## 🚀 Executar o Sistema

### 1. Iniciar o backend
```bash
cd backend
npm start
```
O servidor estará disponível em: http://localhost:3000

### 2. Servir o frontend
Você pode usar qualquer servidor web local. Exemplos:

#### Opção A: Live Server (VS Code)
- Instale a extensão "Live Server"
- Clique com botão direito no `index.html`
- Selecione "Open with Live Server"

#### Opção B: Python (se instalado)
```bash
# Python 3
python -m http.server 3001

# Python 2
python -m SimpleHTTPServer 3001
```

#### Opção C: Node.js http-server
```bash
npm install -g http-server
http-server -p 3001
```

O frontend estará disponível em: http://localhost:3001

## 🧪 Testando o Sistema

### 1. Teste da API (Backend)
Acesse: http://localhost:3000/api/health
Deve retornar: `{"status": "OK", "message": "Server is running"}`

### 2. Teste do Frontend Público
- Acesse: http://localhost:3001
- Verifique se a galeria carrega (pode estar vazia inicialmente)

### 3. Teste do Painel Administrativo
- Acesse: http://localhost:3001/admin/login.html
- Use as credenciais criadas pelo script `createAdmin.js`
- Teste adicionar, editar e excluir itens da galeria

## 🔧 Funcionalidades Implementadas

### Backend (API)
- ✅ Autenticação JWT
- ✅ CRUD completo para galeria
- ✅ Upload de imagens/vídeos em base64
- ✅ Validação de dados
- ✅ Segurança (CORS, Helmet, Rate Limiting)
- ✅ Soft delete para itens
- ✅ Paginação e ordenação

### Frontend
- ✅ Galeria pública atualizada para usar API
- ✅ Painel admin migrado para API
- ✅ Sistema de login com JWT
- ✅ Feedback visual (loading, erros)
- ✅ Tratamento de erros

## 🔍 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (admin only)
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/logout` - Logout

### Galeria
- `GET /api/gallery` - Listar itens (público)
- `GET /api/gallery/:id` - Item específico
- `POST /api/gallery` - Criar item (admin)
- `PUT /api/gallery/:id` - Atualizar item (admin)
- `DELETE /api/gallery/:id` - Excluir item (admin)

## 🚨 Solução de Problemas

### Erro de CORS
- Verifique se `FRONTEND_URL` no `.env` está correto
- Certifique-se que o frontend está rodando na porta especificada

### Erro de Conexão MongoDB
- Verifique se o MongoDB está rodando (local)
- Verifique a string de conexão (Atlas)
- Verifique as credenciais de acesso

### Erro 401 (Não autorizado)
- Faça login novamente
- Verifique se o token JWT não expirou
- Limpe o localStorage do navegador se necessário

## 📈 Próximos Passos (Opcional)

1. **Deploy em produção** (Heroku, Vercel, etc.)
2. **Otimização de imagens** (compressão, redimensionamento)
3. **Cache** para melhor performance
4. **Backup automático** do banco de dados
5. **Monitoramento** e logs

## 🎉 Conclusão

O sistema foi migrado com sucesso do LocalStorage para um banco de dados remoto seguro e escalável. Agora você tem:

- **Persistência real** dos dados
- **Acesso multi-dispositivo**
- **Segurança robusta**
- **Escalabilidade** para crescimento futuro
- **Backup e recuperação** de dados

Qualquer dúvida ou problema, consulte os logs do servidor ou entre em contato!