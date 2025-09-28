// Carregar dotenv apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');

// Debug das variáveis de ambiente
console.log('🔍 DEBUG - Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI definida:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET definida:', !!process.env.JWT_SECRET);

// Importar rotas
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const siteImagesRoutes = require('./routes/siteImages');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados
let dbConnection = null;
connectDB().then(conn => {
  dbConnection = conn;
}).catch(err => {
  console.error('Falha na conexão inicial:', err);
});

// Middleware para verificar conexão MongoDB
const checkMongoDB = (req, res, next) => {
  // Se SKIP_MONGODB está ativo, permitir acesso (modo fallback)
  if (process.env.SKIP_MONGODB === 'true') {
    return next();
  }
  
  // Verificar estado da conexão MongoDB
  const mongoState = require('mongoose').connection.readyState;
  
  // Estados: 0 = desconectado, 1 = conectado, 2 = conectando, 3 = desconectando
  if (mongoState === 1) {
    return next(); // Conectado, prosseguir
  }
  
  // Em desenvolvimento, permitir acesso mesmo sem MongoDB (modo fallback)
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ AVISO: MongoDB não conectado, mas permitindo acesso em desenvolvimento');
    console.log('🔍 DEBUG: Mongoose readyState:', mongoState);
    return next();
  }
  
  // Em produção, tentar reconectar automaticamente
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ PRODUÇÃO: MongoDB não conectado, tentando reconectar...');
    console.log('🔍 DEBUG: MONGODB_URI definida:', !!process.env.MONGODB_URI);
    console.log('🔍 DEBUG: Mongoose readyState:', mongoState);
    
    // Permitir acesso mesmo sem MongoDB (fallback para manter site funcionando)
    return next();
  }
  
  next();
};

// Middleware de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Configurar CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP por janela de tempo
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Rate limiting mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true,
});

// Middleware para parsing JSON
app.use(express.json({ 
  limit: '50mb', // Permitir arquivos grandes em base64
  extended: true 
}));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true 
}));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rotas da API (com verificação de MongoDB)
app.use('/api/auth', checkMongoDB, authRoutes);
app.use('/api/gallery', checkMongoDB, galleryRoutes);
app.use('/api/site-images', siteImagesRoutes); // Não precisa de checkMongoDB pois tem fallback

// Rota de health check
app.get('/api/health', (req, res) => {
  const mongoState = require('mongoose').connection.readyState;
  const mongoStates = {
    0: 'desconectado',
    1: 'conectado', 
    2: 'conectando',
    3: 'desconectando'
  };

  res.json({
    success: true,
    message: 'Servidor funcionando corretamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoStates[mongoState] || 'desconhecido',
      connected: mongoState === 1,
      host: mongoState === 1 ? require('mongoose').connection.host : null
    }
  });
});

// Rota para verificar status detalhado do MongoDB
app.get('/api/mongodb-status', (req, res) => {
  const mongoState = require('mongoose').connection.readyState;
  const mongoStates = {
    0: 'desconectado',
    1: 'conectado', 
    2: 'conectando',
    3: 'desconectando'
  };

  const status = {
    connected: mongoState === 1,
    state: mongoStates[mongoState] || 'desconhecido',
    stateCode: mongoState,
    host: mongoState === 1 ? require('mongoose').connection.host : null,
    hasUri: !!process.env.MONGODB_URI,
    tips: []
  };

  // Adicionar dicas baseadas no status
  if (!status.connected) {
    status.tips.push('Verifique se seu IP está na whitelist do MongoDB Atlas');
    status.tips.push('Acesse: https://cloud.mongodb.com → Network Access → Add IP Address');
    status.tips.push('Para acesso universal, adicione: 0.0.0.0/0');
  }

  res.json({
    success: true,
    mongodb: status,
    timestamp: new Date().toISOString()
  });
});

// Configuração removida - usando logo.png padrão agora

// Servir arquivos estáticos do frontend
app.use(express.static('../'));
app.use('/admin', express.static('../admin'));
app.use('/css', express.static('../css'));
app.use('/js', express.static('../js'));
app.use('/img', express.static('../img'));

// Rota para servir arquivos estáticos de upload (se necessário)
app.use('/uploads', express.static('uploads'));

// Middleware para rotas de API não encontradas (apenas para /api/*)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Servir index.html para rotas não encontradas (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  // Erro de CORS
  if (error.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado pelo CORS'
    });
  }
  
  // Erro de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
  }
  
  // Erro de payload muito grande
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Arquivo muito grande'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando servidor graciosamente...');
  process.exit(0);
});

module.exports = app;