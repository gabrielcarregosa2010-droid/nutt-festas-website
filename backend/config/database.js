const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Verificar se a MONGODB_URI está definida
    if (!process.env.MONGODB_URI) {
      console.error('❌ ERRO: MONGODB_URI não está definida nas variáveis de ambiente!');
      console.error('📋 Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      process.exit(1);
    }

    console.log('🔗 Tentando conectar ao MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Oculta credenciais no log

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para monitorar a conexão
    mongoose.connection.on('error', (err) => {
      console.error('Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });

  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;