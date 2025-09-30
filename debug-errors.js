const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testSimple() {
    console.log('🔍 Teste simples de autenticação...\n');
    
    try {
        // 1. Login
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'Nutt123'
        });
        
        console.log('✅ Login OK:', loginResponse.status);
        console.log('Resposta completa:', JSON.stringify(loginResponse.data, null, 2));
        console.log('Token recebido:', loginResponse.data.token ? 'SIM' : 'NÃO');
        console.log('Token em data.data:', loginResponse.data.data?.token ? 'SIM' : 'NÃO');
        
        const token = loginResponse.data.token || loginResponse.data.data?.token;
        
        // 2. Teste simples de GET (listar itens)
        console.log('\n2. Testando GET /api/gallery...');
        const listResponse = await axios.get(`${API_BASE}/gallery`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ GET OK:', listResponse.status);
        console.log('Itens encontrados:', listResponse.data.data?.items?.length || 0);
        
        // 3. Teste POST com dados válidos (formato correto)
        console.log('\n3. Testando POST com dados válidos...');
        const postData = {
            title: 'Teste Item',
            caption: 'Teste de legenda',
            category: 'geral',
            date: new Date().toISOString(),
            isActive: true,
            images: [{
                data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
                type: 'image/jpeg',
                name: 'test.jpg',
                size: 1024
            }]
        };
        
        const postResponse = await axios.post(`${API_BASE}/gallery`, postData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ POST OK:', postResponse.status);
        console.log('Item criado:', postResponse.data.data?.title);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Mensagem:', error.response.data?.message);
            console.error('Dados completos:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSimple();