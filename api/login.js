// Função serverless para login
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

  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido. Use POST.'
    });
  }

  try {
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