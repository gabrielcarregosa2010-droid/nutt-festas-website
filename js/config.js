// Configuração da API
const API_CONFIG = {
    // Para desenvolvimento local
    development: {
        baseURL: 'http://localhost:3000/api'
    },
    // Para produção - Railway backend
    production: {
        baseURL: 'https://web-production-090a7.up.railway.app/api'
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