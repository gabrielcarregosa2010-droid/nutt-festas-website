require('dotenv').config();
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
  if (!dbConnection && process.env.NODE_ENV === 'development') {
    return res.status(503).json({
      success: false,
      message: 'Banco de dados não disponível em modo de desenvolvimento',
      dev_note: 'MongoDB não conectado. Verifique sua conexão ou configure SKIP_MONGODB=true no .env'
    });
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
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  }
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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando corretamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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