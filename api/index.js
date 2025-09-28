// Arquivo de entrada para Vercel Serverless Functions
const app = require('../backend/server.js');

// Exportar como handler para Vercel
module.exports = (req, res) => {
  return app(req, res);
};