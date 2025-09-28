const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Modo de desenvolvimento sem MongoDB
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_MONGODB === 'true') {
      console.log('⚠️ MODO DESENVOLVIMENTO: Pulando conexão MongoDB');
      console.log('📝 Para conectar ao MongoDB, remova SKIP_MONGODB=true do .env');
      return null;
    }

    // Verificar se a MONGODB_URI está definida
    if (!process.env.MONGODB_URI) {
      console.error('❌ ERRO: MONGODB_URI não está definida nas variáveis de ambiente!');
      console.error('📋 Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      process.exit(1);
    }

    console.log('🔗 Tentando conectar ao MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Oculta credenciais no log

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout após 5 segundos
      socketTimeoutMS: 45000, // Fechar sockets após 45 segundos de inatividade
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para monitorar a conexão
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    
    // Em desenvolvimento, continuar sem MongoDB se a conexão falhar
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ MODO DESENVOLVIMENTO: Continuando sem MongoDB devido ao erro de conexão');
      console.log('📝 Verifique sua conexão de internet e configurações do MongoDB Atlas');
      return null;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;