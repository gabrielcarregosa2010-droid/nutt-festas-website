// Função serverless para Vercel
module.exports = (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check
  if (req.url === '/api/health' || req.url === '/health') {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      message: 'API funcionando corretamente'
    });
    return;
  }

  // Resposta padrão para outras rotas
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.url,
    method: req.method
  });
};