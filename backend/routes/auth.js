const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateLogin, validateUserCreation } = require('../middleware/validation');

// @route   POST /api/auth/login
// @desc    Login do usuário
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // MODO DESENVOLVIMENTO OU PRODUÇÃO SEM MONGODB: Login sem MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB não conectado - usando credenciais de fallback');
      
      // Credenciais de teste para desenvolvimento/produção sem DB
      if ((username === 'admin' || username === 'admin@nuttfestas.com') && password === 'admin123') {
        const userData = { 
          id: 'fallback-admin-id', 
          username: 'admin',
          email: 'admin@nuttfestas.com',
          role: 'admin' 
        };
        
        const token = generateToken(userData);
        
        return res.json({
          success: true,
          message: 'Login realizado com sucesso (modo fallback)',
          data: {
            token,
            user: userData
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas. Use: admin / admin123'
        });
      }
    }

    // Buscar usuário (incluindo senha para comparação)
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Atualizar último login
    await user.updateLastLogin();

    // Gerar token com dados completos
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    const token = generateToken(userData);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Registrar novo usuário (apenas admin pode criar)
// @access  Private (Admin only)
router.post('/register', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
  try {
    const { username, email, password, role = 'admin' } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário ou email já existe'
      });
    }

    // Criar novo usuário
    const user = new User({
      username,
      email,
      password,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Usuário ou email já existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout do usuário (invalidar token no frontend)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Em uma implementação mais robusta, você poderia manter uma blacklist de tokens
    // Por enquanto, apenas retornamos sucesso e o frontend remove o token
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;