const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Criar uma instância do Express para o Vercel
const app = express();

// Middleware básico
app.use(cors({
  origin: ['https://nutt-festas-website.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// JWT Secret (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'nutt-festas-secret-key-2024';

// Função para gerar token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Rota de login simplificada
app.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      });
    }

    // Credenciais de fallback para produção
    const fallbackPassword = process.env.FALLBACK_ADMIN_PASSWORD || 'NuttFestas2024!@#$';
    
    if ((username === 'admin' || username === 'admin@nuttfestas.com') && password === fallbackPassword) {
      const userData = { 
        id: 'fallback-admin-id', 
        username: 'admin',
        email: 'admin@nuttfestas.com',
        role: 'admin' 
      };
      
      const token = generateToken(userData);
      
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: userData
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota de logout
app.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Nutt Festas API - Vercel',
    routes: ['/auth/login', '/auth/logout', '/health']
  });
});

// Exportar como serverless function para Vercel
module.exports = (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rota principal
  if (req.method === 'GET') {
    res.status(200).json({ 
      success: true, 
      message: 'Nutt Festas API - Vercel',
      routes: ['/api/login', '/api/gallery', '/api/validate', '/api/hello'],
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }
};