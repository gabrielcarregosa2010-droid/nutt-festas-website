const jwt = require('jsonwebtoken');

// Função para gerar token JWT
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id || 'admin',
      username: user.username,
      role: user.role || 'admin'
    },
    process.env.JWT_SECRET || 'nutt-festas-secret-key-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceitar POST
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

    // Credenciais de fallback para admin
    const adminCredentials = {
      username: 'admin',
      password: 'NuttFestas2024!@#$'
    };

    // Verificar credenciais
    if (username === adminCredentials.username && password === adminCredentials.password) {
      const user = {
        id: 'admin',
        username: 'admin',
        role: 'admin'
      };

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
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