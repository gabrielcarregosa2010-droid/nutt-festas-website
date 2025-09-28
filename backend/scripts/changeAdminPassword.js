require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const crypto = require('crypto');

const generateSecurePassword = () => {
  // Gera uma senha segura de 16 caracteres
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const changeAdminPassword = async () => {
  try {
    // Conectar ao banco
    await connectDB();
    
    // Buscar admin existente
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Nenhum usuário administrador encontrado');
      process.exit(1);
    }
    
    // Gerar nova senha segura
    const newPassword = generateSecurePassword();
    
    // Atualizar senha
    admin.password = newPassword;
    await admin.save();
    
    console.log('✅ Senha do administrador alterada com sucesso!');
    console.log('📋 Novos dados de acesso:');
    console.log(`   👤 Usuário: ${admin.username}`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Nova Senha: ${newPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Anote esta senha em local seguro!');
    console.log('🔒 Esta senha é segura e não foi comprometida em vazamentos.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error.message);
    process.exit(1);
  }
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  changeAdminPassword();
}

module.exports = changeAdminPassword;