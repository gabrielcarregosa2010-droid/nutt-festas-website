# 🏗️ Arquitetura da API - Nutt Festas

## 📋 Visão Geral

Este documento descreve a arquitetura da API do Nutt Festas, explicando como as rotas são organizadas e como o sistema funciona em produção (Vercel) e desenvolvimento local.

## 🔄 Fluxo de Requisições

### Ambiente de Produção (Vercel)

```
Cliente → Vercel → backend/server.js → Rotas Express → MongoDB Atlas
```

### Ambiente de Desenvolvimento (Local)

```
Cliente → http://localhost:3000 → backend/server.js → Rotas Express → MongoDB Atlas
```

## 🛣️ Estrutura de Rotas

Todas as rotas da API são gerenciadas pelo servidor Express em `backend/server.js` e seguem o padrão `/api/*`:

| Rota | Método | Descrição | Acesso |
|------|--------|-----------|--------|
| `/api/health` | GET | Verificação de saúde do servidor | Público |
| `/api/auth/login` | POST | Autenticação de usuários | Público |
| `/api/auth/validate` | GET | Validação de token JWT | Autenticado |
| `/api/gallery` | GET | Lista de itens da galeria | Público |
| `/api/gallery` | POST | Adicionar item à galeria | Admin |
| `/api/gallery/:id` | PUT | Atualizar item da galeria | Admin |
| `/api/gallery/:id` | DELETE | Remover item da galeria | Admin |
| `/api/site-images` | GET | Imagens do site | Público |
| `/api/site-images` | POST | Adicionar imagem do site | Admin |
| `/api/site-images/:id` | PUT | Atualizar imagem do site | Admin |
| `/api/site-images/:id` | DELETE | Remover imagem do site | Admin |

## ⚠️ Importante: Evitar Conflitos de Rotas

Para evitar erros como o 405 "Method Not Allowed", é crucial seguir estas diretrizes:

1. **Não criar funções serverless separadas** na pasta `/api/` que possam interceptar rotas
2. **Manter toda a lógica de API** dentro de `backend/server.js` e suas rotas
3. **Verificar o `vercel.json`** para garantir que todas as rotas `/api/*` sejam direcionadas para `backend/server.js`

## 🔧 Configuração do Vercel

O arquivo `vercel.json` deve manter esta configuração para rotas:

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/backend/server.js"
  },
  {
    "src": "/admin/(.*)",
    "dest": "/admin/$1"
  },
  {
    "src": "/(.*)",
    "dest": "/$1"
  }
]
```

## 🧪 Testando a API

### Health Check

```bash
# Verificar se a API está funcionando
curl https://nutt-festas-website.vercel.app/api/health
```

### Login (Admin)

```bash
# Fazer login como administrador
curl -X POST https://nutt-festas-website.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Nutt123"}'
```

## 📚 Referências

- [Express.js Documentation](https://expressjs.com/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)