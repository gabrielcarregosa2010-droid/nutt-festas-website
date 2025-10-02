const https = require('https');
const http = require('http');

// Configuração da API local
const API_BASE = 'http://localhost:3000/api';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Função para fazer login
async function login() {
    console.log('🔐 Fazendo login...');
    
    try {
        console.log('Enviando requisição para:', `${API_BASE}/auth/login`);
        
        const loginData = JSON.stringify({
            username: 'admin',
            password: 'Nutt123'
        });

        const response = await makeRequest(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            },
            body: loginData
        });

        console.log('Status da resposta:', response.status);
        console.log('Dados da resposta:', JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.success) {
            console.log('✅ Login realizado com sucesso');
            return response.data.data.token;
        } else {
            throw new Error(`Erro no login: ${response.data.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro detalhado no login:', error);
        throw new Error(`Erro no login: ${error.message}`);
    }
}

// Função para criar um item de teste
async function createTestItem(token) {
    console.log('📝 Criando item de teste...');
    
    try {
        // Dados do item de teste
        const itemData = {
            title: 'Teste de Criação - ' + new Date().toLocaleString(),
            caption: 'Item criado durante teste de funcionalidade',
            category: 'geral',
            date: new Date().toISOString(),
            isActive: true,
            images: [{
                data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                type: 'image/png',
                name: 'teste.png',
                size: 100
            }]
        };

        const requestBody = JSON.stringify(itemData);
        console.log('Enviando dados:', JSON.stringify(itemData, null, 2));

        const response = await makeRequest(`${API_BASE}/gallery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        });

        console.log('Status da resposta:', response.status);
        console.log('Dados da resposta:', JSON.stringify(response.data, null, 2));

        if (response.status === 201 && response.data.success) {
            console.log('✅ Item criado com sucesso!');
            console.log('ID do item:', response.data.data.id);
            return response.data.data;
        } else {
            throw new Error(`Erro na criação: ${response.data.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro detalhado na criação:', error);
        throw new Error(`Erro na criação: ${error.message}`);
    }
}

// Função para listar itens
async function listItems(token) {
    console.log('📋 Listando itens...');
    
    try {
        const response = await makeRequest(`${API_BASE}/gallery`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status da resposta:', response.status);
        
        if (response.status === 200 && response.data.success) {
            const items = response.data.data.items;
            console.log(`✅ ${items.length} itens encontrados`);
            
            // Mostrar os últimos 3 itens
            const recentItems = items.slice(-3);
            recentItems.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title} (${item.category}) - ${item.isActive ? 'Ativo' : 'Inativo'}`);
            });
            
            return items;
        } else {
            throw new Error(`Erro na listagem: ${response.data.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro detalhado na listagem:', error);
        throw new Error(`Erro na listagem: ${error.message}`);
    }
}

// Função principal do teste
async function runTest() {
    console.log('🚀 Iniciando teste de criação de item na galeria (LOCAL)...\n');
    
    try {
        // 1. Fazer login
        const token = await login();
        console.log('Token recebido:', token ? 'SIM' : 'NÃO');
        
        // 2. Listar itens antes da criação
        console.log('\n📋 Listando itens antes da criação...');
        const itemsBefore = await listItems(token);
        
        // 3. Criar novo item
        console.log('\n📝 Criando novo item...');
        const newItem = await createTestItem(token);
        
        // 4. Listar itens após a criação
        console.log('\n📋 Listando itens após a criação...');
        const itemsAfter = await listItems(token);
        
        // 5. Verificar se o item foi criado
        if (itemsAfter.length > itemsBefore.length) {
            console.log('\n✅ TESTE PASSOU! Item criado com sucesso.');
            console.log(`Itens antes: ${itemsBefore.length}, Itens depois: ${itemsAfter.length}`);
        } else {
            console.log('\n❌ TESTE FALHOU! Item não foi criado.');
        }
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        process.exit(1);
    }
}

// Executar o teste
runTest();