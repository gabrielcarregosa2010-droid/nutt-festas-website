// API Index - Serverless Function para Vercel
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
      routes: [
        '/api/login - Autenticação de usuários',
        '/api/gallery - Galeria de imagens',
        '/api/validate - Validação de tokens',
        '/api/hello - Teste de conectividade'
      ],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } else {
    res.status(405).json({ 
      success: false, 
      message: 'Método não permitido. Use GET.' 
    });
  }
};