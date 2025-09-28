// Arquivo de entrada para Vercel Serverless Functions
// Este arquivo redireciona todas as requisições para o servidor principal

const app = require('../backend/server.js');

module.exports = app;