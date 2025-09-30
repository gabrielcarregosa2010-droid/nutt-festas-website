const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCompleteFlow() {
    console.log('🧪 Teste completo do sistema...\n');
    
    try {
        // 1. Login
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'Nutt123'
        });
        
        if (loginResponse.status !== 200) {
            throw new Error('Falha no login');
        }
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // 2. Listar itens existentes
        console.log('\n2. Listando itens existentes...');
        const listResponse = await axios.get(`${API_BASE}/gallery`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ ${listResponse.data.data.items.length} itens encontrados`);
        
        // 3. Criar novo item
        console.log('\n3. Criando novo item...');
        const newItem = {
            title: 'Teste Final - ' + new Date().toLocaleString(),
            caption: 'Item criado durante teste final do sistema',
            category: 'geral',
            date: new Date().toISOString(),
            isActive: true,
            images: [{
                data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
                type: 'image/jpeg',
                name: 'teste-final.jpg',
                size: 1024
            }]
        };
        
        const createResponse = await axios.post(`${API_BASE}/gallery`, newItem, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (createResponse.status !== 201) {
            throw new Error('Falha ao criar item');
        }
        
        const createdItemId = createResponse.data.data?.item?.id || createResponse.data.data?.item?._id;
        console.log(`✅ Item criado com sucesso (ID: ${createdItemId})`);
        
        // 4. Editar o item criado
        console.log('\n4. Editando item criado...');
        const updateData = {
            title: 'Teste Final - EDITADO - ' + new Date().toLocaleString(),
            caption: 'Item editado durante teste final'
        };
        
        const updateResponse = await axios.put(`${API_BASE}/gallery/${createdItemId}`, updateData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (updateResponse.status !== 200) {
            throw new Error('Falha ao editar item');
        }
        
        console.log('✅ Item editado com sucesso');
        
        // 5. Verificar se o item foi editado
        console.log('\n5. Verificando edição...');
        const getResponse = await axios.get(`${API_BASE}/gallery/${createdItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Título atual: "${getResponse.data.data.title}"`);
        
        // 6. Deletar o item de teste
        console.log('\n6. Removendo item de teste...');
        const deleteResponse = await axios.delete(`${API_BASE}/gallery/${createdItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (deleteResponse.status !== 200) {
            throw new Error('Falha ao deletar item');
        }
        
        console.log('✅ Item removido com sucesso');
        
        console.log('\n🎉 TODOS OS TESTES PASSARAM! O sistema está funcionando corretamente.');
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

testCompleteFlow();