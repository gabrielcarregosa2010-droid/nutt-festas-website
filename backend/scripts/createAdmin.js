require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdmin = async () => {
  try {
    // Conectar ao banco
    await connectDB();
    
    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('❌ Já existe um usuário administrador no sistema');
      console.log(`👤 Admin existente: ${existingAdmin.username} (${existingAdmin.email})`);
      process.exit(1);
    }
    
    // Dados do admin padrão
    const adminData = {
      username: 'admin',
      email: 'admin@nuttfestas.com',
      password: 'Nutt123',
      role: 'admin'
    };
    
    // Criar admin
    const admin = new User(adminData);
    await admin.save();
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📋 Dados de acesso:');
    console.log(`   👤 Usuário: ${adminData.username}`);
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   🔑 Senha: ${adminData.password}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    process.exit(1);
  }
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;