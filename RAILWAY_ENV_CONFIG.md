# Configuração de Variáveis de Ambiente - Railway

## 🚨 PROBLEMA IDENTIFICADO
O Railway não tem as variáveis de ambiente configuradas, causando o erro:
```
❌ ERRO: MONGODB_URI não está definida nas variáveis de ambiente!
```

## 📋 VARIÁVEIS NECESSÁRIAS

Configure as seguintes variáveis de ambiente no painel do Railway:

### 1. **MONGODB_URI**
```
mongodb+srv://gabrielcarregosa07_db_user:Biiel2010@clusternuttfestas.z3x8312.mongodb.net/nutt-festas?retryWrites=true&w=majority&appName=ClusterNuttFestas
```

### 2. **JWT_SECRET**
```
nutt_festas_production_super_secret_key_2024_gabriel_carregosa_jwt_token_security_ultra_safe
```

### 3. **NODE_ENV**
```
production
```

### 4. **PORT**
```
3000
```

### 5. **JWT_EXPIRES_IN**
```
7d
```

### 6. **MAX_FILE_SIZE**
```
10485760
```

### 7. **ALLOWED_FILE_TYPES**
```
image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm
```

### 8. **FRONTEND_URL**
```
*
```

## 🔧 COMO CONFIGURAR NO RAILWAY

1. **Acesse o painel do Railway**: https://railway.app
2. **Selecione seu projeto**: Nutt Festas Website
3. **Vá para a aba "Variables"**
4. **Adicione cada variável** listada acima
5. **Clique em "Deploy"** para aplicar as mudanças

## ✅ VERIFICAÇÃO

Após configurar, os logs devem mostrar:
```
✅ MongoDB conectado
✅ Servidor rodando na porta 3000
```

## 🚀 ALTERNATIVA: USAR VERCEL

Se preferir, o **Vercel já está funcionando** com todas as correções aplicadas:
- URL: https://nutt-festas-website.vercel.app
- Admin: https://nutt-festas-website.vercel.app/admin/login.html
- Credenciais: admin / Nutt123

O Vercel tem todas as variáveis configuradas automaticamente e está funcionando perfeitamente.