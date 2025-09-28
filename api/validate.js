module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aceitar POST e GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido. Use POST ou GET.'
    });
  }

  try {
    // Pegar token do header Authorization ou do body
    let token = null;
    
    if (req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Decodificar token base64
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Verificar se o token não expirou
      const now = new Date();
      const expires = new Date(tokenData.expires);
      
      if (now > expires) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      // Token válido
      return res.status(200).json({
        success: true,
        message: 'Token válido',
        user: {
          id: tokenData.id,
          username: tokenData.username,
          role: tokenData.role
        }
      });

    } catch (decodeError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

  } catch (error) {
    console.error('Erro na validação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};