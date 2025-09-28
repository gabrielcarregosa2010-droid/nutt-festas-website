require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com MongoDB Atlas...');
    console.log('📍 IP atual detectado: 187.56.83.17');
    console.log('📍 URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Conexão bem-sucedida!');
    console.log(`🎯 Conectado ao host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    await mongoose.disconnect();
    console.log('🔌 Conexão encerrada com sucesso');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 Soluções possíveis:');
      console.log('1. Adicione o IP 187.56.83.17 no MongoDB Atlas Network Access');
      console.log('2. Ou configure 0.0.0.0/0 para permitir qualquer IP (desenvolvimento)');
      console.log('3. Verifique se o cluster está ativo e as credenciais estão corretas');
    }
    
    process.exit(1);
  }
};

testConnection();