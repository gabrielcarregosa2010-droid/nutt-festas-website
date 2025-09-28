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
      message: 'Método não permitido. Use POST.'
    });
  }

  try {
    const { username, password } = req.body;

    // Log para debug
    console.log('Login attempt:', { username, hasPassword: !!password });

    // Validação básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      });
    }

    // Credenciais de admin (hardcoded para simplicidade)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'NuttFestas2024!@#$';

    // Verificar credenciais
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Gerar token simples (timestamp + dados do usuário em base64)
      const tokenData = {
        id: 'admin-001',
        username: 'admin',
        role: 'admin',
        loginTime: new Date().toISOString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      };

      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        token: token,
        user: {
          id: tokenData.id,
          username: tokenData.username,
          role: tokenData.role
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
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};