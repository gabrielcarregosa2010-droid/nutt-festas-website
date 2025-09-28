const jwt = require('jsonwebtoken');

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

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }

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
      
      return res.status(200).json({
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
};