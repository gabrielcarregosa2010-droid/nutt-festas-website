const https = require('https');

// Configuração da API
const API_BASE = 'https://nutt-festas-website-8ouzeuoze-gabriel-carregosas-projects.vercel.app';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Função para fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login...');
  
  try {
    console.log('Enviando requisição para: https://nutt-festas-website-8ouzeuoze-gabriel-carregosas-projects.vercel.app/api/auth/login');
    
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'NuttFestas2024!@#$'
    });

    const response = await makeRequest(`https://nutt-festas-website-8ouzeuoze-gabriel-carregosas-projects.vercel.app/api/auth/login`, {
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
  
  // Imagem base64 pequena para teste (1x1 pixel PNG transparente)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const itemData = JSON.stringify({
    title: 'Item de Teste - ' + new Date().toLocaleString(),
    caption: 'Este é um item de teste criado automaticamente para verificar a funcionalidade de criação.',
    category: 'geral',
    date: new Date().toISOString(),
    isActive: true,
    images: [{
      data: testImageBase64,
      type: 'image/png',
      name: 'teste.png',
      size: 1024
    }]
  });

  const response = await makeRequest(`${API_BASE}/api/gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(itemData)
    },
    body: itemData
  });

  console.log(`📊 Status da criação: ${response.status}`);
  console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.success) {
    console.log('✅ Item criado com sucesso!');
    console.log(`🆔 ID do item: ${response.data.data.item.id || response.data.data.item._id}`);
    return response.data.data.item;
  } else {
    throw new Error(`Erro na criação: ${response.data.message || 'Erro desconhecido'}`);
  }
}

// Função para listar itens e verificar se o novo item aparece
async function listItems() {
  console.log('📋 Listando itens da galeria...');
  
  const response = await makeRequest(`${API_BASE}/api/gallery`);
  
  if (response.status === 200 && response.data.success) {
    const items = response.data.data;
    console.log(`✅ ${items.length} itens encontrados na galeria`);
    
    // Mostrar os últimos 3 itens
    const recentItems = items.slice(0, 3);
    recentItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} (${item.category}) - ${new Date(item.createdAt).toLocaleString()}`);
    });
    
    return items;
  } else {
    throw new Error(`Erro ao listar itens: ${response.data.message || 'Erro desconhecido'}`);
  }
}

// Função principal de teste
async function runTest() {
  try {
    console.log('🚀 Iniciando teste de criação de item na galeria...\n');
    
    // 1. Fazer login
    const token = await login();
    console.log('');
    
    // 2. Listar itens antes da criação
    console.log('📋 Estado inicial da galeria:');
    const itemsBefore = await listItems();
    console.log('');
    
    // 3. Criar novo item
    const newItem = await createTestItem(token);
    console.log('');
    
    // 4. Listar itens após a criação
    console.log('📋 Estado da galeria após criação:');
    const itemsAfter = await listItems();
    console.log('');
    
    // 5. Verificar se o item foi realmente criado
    if (itemsAfter.length > itemsBefore.length) {
      console.log('✅ TESTE PASSOU: Item foi criado com sucesso!');
      console.log(`📈 Quantidade de itens: ${itemsBefore.length} → ${itemsAfter.length}`);
    } else {
      console.log('❌ TESTE FALHOU: Item não aparece na listagem');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    process.exit(1);
  }
}

// Executar teste
runTest();