// Função serverless para Vercel que importa o servidor backend
const app = require('../backend/server');

// Exporta a função para o Vercel
module.exports = (req, res) => {
  return app(req, res);
};