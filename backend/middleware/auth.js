const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB não conectado - usando dados do token para autenticação');
      
      // Em produção, usar dados do token quando MongoDB não está disponível
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        username: decoded.username || 'admin',
        email: decoded.email || 'admin@nuttfestas.com',
        role: decoded.role || 'admin',
        isActive: true
      };
      
      return next();
    }
    
    // Buscar o usuário
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou usuário inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Privilégios de administrador requeridos.'
    });
  }
};

// Função para gerar token JWT
const generateToken = (userData) => {
  // Se userData é apenas um ID (compatibilidade com código antigo)
  if (typeof userData === 'string') {
    return jwt.sign(
      { id: userData },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
  
  // Se userData é um objeto com dados completos
  return jwt.sign(
    {
      id: userData.id || userData._id,
      username: userData.username,
      email: userData.email,
      role: userData.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken
};