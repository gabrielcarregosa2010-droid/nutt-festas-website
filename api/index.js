const express = require('express');
const cors = require('cors');

// Criar uma instância do Express para o Vercel
const app = express();

// Middleware básico
app.use(cors({
  origin: ['https://nutt-festas-website.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Importar rotas do backend
const authRoutes = require('../backend/routes/auth');
const galleryRoutes = require('../backend/routes/gallery');

// Configurar rotas
app.use('/auth', authRoutes);
app.use('/gallery', galleryRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Nutt Festas API - Vercel',
    routes: ['/auth/login', '/auth/logout', '/auth/me', '/gallery', '/health']
  });
});

module.exports = app;