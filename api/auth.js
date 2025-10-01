// Função serverless para rotas de autenticação
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Importar dependências necessárias
  const jwt = require('jsonwebtoken');
  
  // Função para gerar token
  const generateToken = (userData) => {
    return jwt.sign(
      userData,
      process.env.JWT_SECRET || 'nutt-festas-secret-key-2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  };

  // Rota de login
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    try {
      const { username, password } = req.body;

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
  }

  // Rota de verificação de token
  if (req.method === 'GET' && req.url === '/api/auth/verify') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nutt-festas-secret-key-2024');
      
      return res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: decoded
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }

  // Rota não encontrada
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.url,
    method: req.method,
    availableRoutes: [
      'POST /api/auth/login',
      'GET /api/auth/verify'
    ]
  });
}