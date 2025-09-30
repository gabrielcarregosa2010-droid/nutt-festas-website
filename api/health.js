module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceitar GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido. Use GET.'
    });
  }

  try {
    // Verificação básica de saúde da API
    const healthData = {
      success: true,
      message: 'API funcionando corretamente',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0'
    };

    return res.status(200).json(healthData);
  } catch (error) {
    console.error('Erro no health check:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      status: 'unhealthy'
    });
  }
};