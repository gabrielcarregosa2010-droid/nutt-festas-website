// Script de teste para validar funcionalidades antes do deploy
const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log(`🧪 Testando funcionalidades em: ${BASE_URL}`);

const tests = [
  {
    name: 'Health Check',
    path: '/api/health',
    expected: 'success'
  },
  {
    name: 'MongoDB Status',
    path: '/api/mongodb-status',
    expected: 'success'
  },
  {
    name: 'Gallery API',
    path: '/api/gallery',
    expected: 'success'
  },
  {
    name: 'Admin Login Page',
    path: '/admin/login.html',
    expected: 'html'
  },
  {
    name: 'Main Page',
    path: '/',
    expected: 'html'
  }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${test.path}`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === 200;
        let result = {
          name: test.name,
          path: test.path,
          status: res.statusCode,
          success: success
        };
        
        if (success && test.expected === 'success') {
          try {
            const json = JSON.parse(data);
            result.hasSuccess = json.success === true;
          } catch (e) {
            result.hasSuccess = false;
          }
        } else if (success && test.expected === 'html') {
          result.hasSuccess = data.includes('<html') || data.includes('<!DOCTYPE');
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: test.name,
        path: test.path,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: test.name,
        path: test.path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('\n📋 Executando testes...\n');
  
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`⏳ ${test.name}... `);
    const result = await testEndpoint(test);
    results.push(result);
    
    if (result.success && result.hasSuccess !== false) {
      console.log('✅ PASSOU');
    } else {
      console.log(`❌ FALHOU (${result.status})`);
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    }
  }
  
  console.log('\n📊 Resumo dos Testes:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success && r.hasSuccess !== false).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success && result.hasSuccess !== false ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.status})`);
  });
  
  console.log('='.repeat(50));
  console.log(`📈 Resultado: ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Pronto para deploy.');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique antes do deploy.');
    process.exit(1);
  }
}

runTests().catch(console.error);