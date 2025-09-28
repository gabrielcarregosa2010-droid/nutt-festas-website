const express = require('express');
const router = express.Router();
const SiteImage = require('../models/SiteImage');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

/**
 * @route   GET /api/site-images/:name
 * @desc    Buscar imagem do site por nome (home, about, logo)
 * @access  Public
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Validar nome
    if (!['home', 'about', 'logo'].includes(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome inválido. Use: home, about ou logo' 
      });
    }

    // Verificar se MongoDB está conectado
    if (mongoose.connection.readyState === 1) {
      // Primeiro, tentar buscar no banco de dados
      const siteImage = await SiteImage.findActiveByName(name);
      
      if (siteImage) {
        // Converter base64 para buffer
        const imageBuffer = Buffer.from(siteImage.fileData, 'base64');
        
        // Definir headers apropriados
        res.set({
          'Content-Type': siteImage.fileType,
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
          'ETag': `"${siteImage.version}-${siteImage.updatedAt.getTime()}"`
        });
        
        return res.send(imageBuffer);
      }
    } else {
      console.warn('MongoDB não conectado - usando apenas arquivos locais para imagens');
    }

    // Se não encontrar no banco ou MongoDB não conectado, tentar arquivo local como fallback
    const fallbackPaths = [
      path.join(__dirname, '../../img', `${name}.jpg`),
      path.join(__dirname, '../../img', `${name}.png`),
      path.join(__dirname, '../../img', `${name}.webp`)
    ];

    for (const filePath of fallbackPaths) {
      try {
        await fs.access(filePath);
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp'
        }[ext] || 'image/jpeg';

        res.set({
          'Content-Type': mimeType,
          'Content-Length': fileBuffer.length,
          'Cache-Control': 'public, max-age=3600' // Cache por 1 hora para fallback
        });

        return res.send(fileBuffer);
      } catch (error) {
        // Continuar para o próximo arquivo
        continue;
      }
    }

    // Se não encontrar nada, retornar erro 404
    res.status(404).json({ 
      success: false, 
      message: `Imagem '${name}' não encontrada` 
    });

  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route   POST /api/site-images/:name
 * @desc    Upload de imagem do site
 * @access  Private (Admin)
 */
router.post('/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    const { fileData, fileType, description } = req.body;

    // Validar nome
    if (!['home', 'about', 'logo'].includes(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome inválido. Use: home, about ou logo' 
      });
    }

    // Validar dados obrigatórios
    if (!fileData || !fileType) {
      return res.status(400).json({ 
        success: false, 
        message: 'fileData e fileType são obrigatórios' 
      });
    }

    // Verificar se MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Serviço de upload temporariamente indisponível - MongoDB não conectado'
      });
    }

    // Desativar imagem anterior se existir
    await SiteImage.updateMany(
      { name, isActive: true },
      { isActive: false }
    );

    // Buscar a versão mais recente
    const lastImage = await SiteImage.findOne({ name }).sort({ version: -1 });
    const newVersion = lastImage ? lastImage.version + 1 : 1;

    // Criar nova imagem
    const siteImage = new SiteImage({
      name,
      description: description || `Imagem ${name} do site`,
      fileData,
      fileType,
      version: newVersion
    });

    await siteImage.save();

    res.status(201).json({
      success: true,
      message: `Imagem '${name}' atualizada com sucesso`,
      data: {
        id: siteImage.id,
        name: siteImage.name,
        version: siteImage.version,
        fileType: siteImage.fileType,
        fileSize: siteImage.fileSize
      }
    });

  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/site-images
 * @desc    Listar todas as imagens do site
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verificar se MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: [],
        message: 'Lista de imagens temporariamente indisponível - MongoDB não conectado'
      });
    }

    const images = await SiteImage.find({ isActive: true })
      .select('-fileData') // Não retornar os dados binários na listagem
      .sort({ name: 1 });

    res.json({
      success: true,
      data: images
    });

  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;