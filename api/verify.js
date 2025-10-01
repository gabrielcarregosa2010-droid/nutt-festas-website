// Função serverless para verificação de token
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

  // Apenas aceitar GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido. Use GET.'
    });
  }

  try {
    // Importar dependências necessárias
    const jwt = require('jsonwebtoken');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorização não fornecido'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nutt-festas-secret-key-2024');
      
      return res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: decoded,
          isValid: true
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Erro na verificação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}