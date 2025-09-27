# Nutt Festas - Backend API

Backend seguro e escalável para o site Nutt Festas, desenvolvido com Node.js, Express e MongoDB.

## 🚀 Funcionalidades

- **API REST completa** para gerenciamento de galeria
- **Autenticação JWT** segura
- **Upload de arquivos** em base64 (imagens e vídeos)
- **Validação robusta** de dados
- **Rate limiting** para proteção contra ataques
- **CORS configurado** para segurança
- **Soft delete** para itens da galeria
- **Paginação** para melhor performance

## 📋 Pré-requisitos

- Node.js 16+ 
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Instalação

1. **Instalar dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/nutt-festas
   JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5500
   ```

3. **Iniciar MongoDB** (se usando local):
   ```bash
   mongod
   ```

4. **Criar usuário administrador:**
   ```bash
   node scripts/createAdmin.js
   ```

5. **Iniciar servidor:**
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Produção
   npm start
   ```

## 📚 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| POST | `/api/auth/login` | Login do usuário | Público |
| POST | `/api/auth/register` | Criar novo usuário | Admin |
| GET | `/api/auth/me` | Dados do usuário logado | Privado |
| POST | `/api/auth/logout` | Logout | Privado |

### Galeria

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/api/gallery` | Listar itens da galeria | Público |
| GET | `/api/gallery/:id` | Obter item específico | Público |
| POST | `/api/gallery` | Criar novo item | Admin |
| PUT | `/api/gallery/:id` | Atualizar item | Admin |
| DELETE | `/api/gallery/:id` | Excluir item (soft delete) | Admin |
| DELETE | `/api/gallery/:id/permanent` | Excluir permanentemente | Admin |

### Health Check

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/api/health` | Status do servidor | Público |

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu_token_jwt>
```

## 📝 Exemplos de Uso

### Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const data = await response.json();
const token = data.data.token;
```

### Criar Item da Galeria
```javascript
const response = await fetch('/api/gallery', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Festa de Aniversário',
    caption: 'Uma festa incrível!',
    fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
    fileType: 'image/jpeg'
  })
});
```

### Listar Itens da Galeria
```javascript
const response = await fetch('/api/gallery?page=1&limit=10');
const data = await response.json();
const items = data.data.items;
```

## 🛡️ Segurança

- **Helmet.js** para headers de segurança
- **Rate limiting** para prevenir ataques
- **CORS** configurado adequadamente
- **Validação** robusta de entrada
- **Senhas hasheadas** com bcrypt
- **JWT** com expiração configurável

## 📊 Estrutura do Banco

### Coleção: galleryitems
```javascript
{
  _id: ObjectId,
  title: String,
  caption: String,
  fileData: String, // Base64
  fileType: String,
  fileSize: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Coleção: users
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // Hash
  role: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deploy

### MongoDB Atlas (Recomendado)
1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster gratuito
3. Configure o IP whitelist
4. Obtenha a string de conexão
5. Atualize `MONGODB_URI` no `.env`

### Heroku
1. Instale o Heroku CLI
2. Faça login: `heroku login`
3. Crie app: `heroku create nutt-festas-api`
4. Configure variáveis: `heroku config:set JWT_SECRET=...`
5. Deploy: `git push heroku main`

## 🔧 Scripts Disponíveis

- `npm start` - Iniciar em produção
- `npm run dev` - Iniciar em desenvolvimento com nodemon
- `node scripts/createAdmin.js` - Criar usuário administrador

## 📈 Monitoramento

O servidor inclui logs detalhados e endpoint de health check para monitoramento:

```bash
curl http://localhost:3000/api/health
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.