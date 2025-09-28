# 🚀 Deploy Automático no Vercel - Nutt Festas

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Repositório no GitHub**: Código deve estar no GitHub
3. **MongoDB Atlas**: Configurado com IP whitelist `0.0.0.0/0`

## 🔧 Configuração das Variáveis de Ambiente

No painel do Vercel, adicione estas variáveis de ambiente:

### Variáveis Obrigatórias:
```
MONGODB_URI=mongodb+srv://gabrielcarregosa07_db_user:Biiel2010@clusternuttfestas.z3x8312.mongodb.net/nutt-festas?retryWrites=true&w=majority&appName=ClusterNuttFestas
JWT_SECRET=nutt_festas_production_super_secret_key_2024_gabriel_carregosa_jwt_token_security_ultra_safe
FRONTEND_URL=https://seu-dominio.vercel.app
```

### Variáveis Opcionais (já configuradas no vercel.json):
```
NODE_ENV=production
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm
```

## 🛠️ Passos para Deploy

### 1. Conectar Repositório
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Selecione o repositório do projeto

### 2. Configurar Projeto
1. **Framework Preset**: Other
2. **Root Directory**: `./` (raiz do projeto)
3. **Build Command**: Deixe vazio (usa configuração do vercel.json)
4. **Output Directory**: Deixe vazio
5. **Install Command**: `npm install`

### 3. Adicionar Variáveis de Ambiente
1. Na aba "Environment Variables"
2. Adicione as variáveis listadas acima
3. Certifique-se de marcar "Production", "Preview" e "Development"

### 4. Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Teste o site e APIs

## 🔍 Verificação Pós-Deploy

### Endpoints para Testar:
- **Site Principal**: `https://seu-dominio.vercel.app`
- **Admin Login**: `https://seu-dominio.vercel.app/admin/login.html`
- **Health Check**: `https://seu-dominio.vercel.app/api/health`
- **MongoDB Status**: `https://seu-dominio.vercel.app/api/mongodb-status`
- **Gallery API**: `https://seu-dominio.vercel.app/api/gallery`

### Comandos de Teste:
```bash
# Testar health check
curl https://seu-dominio.vercel.app/api/health

# Testar status do MongoDB
curl https://seu-dominio.vercel.app/api/mongodb-status

# Testar API da galeria
curl https://seu-dominio.vercel.app/api/gallery
```

## 🔧 Configurações Especiais

### MongoDB Atlas - IP Whitelist
1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access** → **IP Access List**
3. Adicione `0.0.0.0/0` para permitir todos os IPs
4. Ou adicione IPs específicos do Vercel

### Domínio Personalizado (Opcional)
1. No painel Vercel, vá em "Domains"
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções
4. Atualize `FRONTEND_URL` com novo domínio

## 🚨 Troubleshooting

### Erro 500 - MongoDB Connection
- Verifique se `MONGODB_URI` está correta
- Confirme IP whitelist no MongoDB Atlas
- Teste endpoint `/api/mongodb-status`

### Erro 404 - Rotas não encontradas
- Verifique configuração do `vercel.json`
- Confirme estrutura de pastas

### Erro de CORS
- Verifique `FRONTEND_URL` nas variáveis de ambiente
- Confirme domínio correto

## 📱 Deploy Automático

Após configuração inicial:
1. **Push para main/master**: Deploy automático em produção
2. **Push para outras branches**: Deploy de preview
3. **Pull Requests**: Deploy de preview automático

## 🔄 Atualizações

Para atualizar o site:
1. Faça commit das alterações
2. Push para o repositório
3. Vercel fará deploy automático
4. Verifique logs no painel Vercel

---

✅ **Configuração Completa!** Seu site estará disponível com deploy automático e todas as funcionalidades funcionando.