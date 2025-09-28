// Configuração da API
const API_CONFIG = {
    // Para desenvolvimento local
    development: {
        baseURL: 'http://localhost:3000/api'
    },
    // Para produção - Vercel backend
    production: {
        baseURL: 'https://nutt-festas-website.vercel.app/api'
    }
};

// Detectar ambiente - Vercel usa nutt-festas-website.vercel.app
const environment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'development' 
    : 'production';

// Exportar configuração atual
const API_BASE_URL = API_CONFIG[environment].baseURL;

console.log(`🌍 Ambiente: ${environment}`);
console.log(`🔗 API URL: ${API_BASE_URL}`);