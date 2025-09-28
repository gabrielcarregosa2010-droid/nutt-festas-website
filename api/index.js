// Arquivo de entrada para Vercel Serverless Functions
const app = require('../backend/server.js');

// Handler para Vercel Serverless Functions
module.exports = async (req, res) => {
  try {
    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Executar o Express app
    return app(req, res);
  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
};