const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GalleryItem = require('../models/GalleryItem');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateGalleryItem, validateGalleryItemCreate, validateGalleryItemUpdate } = require('../middleware/validation');

// @route   GET /api/gallery
// @desc    Obter todos os itens da galeria
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Verificar se o MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB não conectado, retornando galeria vazia');
      return res.json({
        success: true,
        data: {
          items: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 50
          }
        },
        message: 'Galeria temporariamente indisponível'
      });
    }

    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    // Buscar apenas itens ativos
    const items = await GalleryItem.find({ isActive: true })
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await GalleryItem.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalItems: total,
          itemsPerPage: options.limit
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar itens da galeria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/gallery/:id
// @desc    Obter um item específico da galeria
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await GalleryItem.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    console.error('Erro ao buscar item da galeria:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/gallery
// @desc    Criar novo item da galeria
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateGalleryItemCreate, async (req, res) => {
  try {
    console.log('📝 Dados recebidos para criação:', {
      title: req.body.title,
      caption: req.body.caption,
      category: req.body.category,
      date: req.body.date,
      isActive: req.body.isActive,
      imagesCount: req.body.images ? req.body.images.length : 0,
      imagesStructure: req.body.images ? req.body.images.map((img, i) => ({
        index: i,
        hasData: !!img.data,
        hasType: !!img.type,
        hasName: !!img.name,
        dataLength: img.data ? img.data.length : 0
      })) : []
    });
    
    const { title, caption, category, date, isActive, images } = req.body;

    // Verificar tamanho dos arquivos
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const base64Size = image.data.length * (3/4);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (base64Size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Imagem ${i + 1} muito grande. Tamanho máximo: 10MB`
        });
      }
    }

    const itemData = {
      title,
      caption,
      category: category || 'geral',
      date: date || new Date(),
      isActive: isActive !== false,
      images: images.map((img, index) => ({
        src: img.data,
        alt: img.name || `${title} - Imagem ${index + 1}`
      }))
    };

    const newItem = new GalleryItem(itemData);
    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Item criado com sucesso',
      data: { item: savedItem }
    });

  } catch (error) {
    console.error('❌ Erro ao criar item da galeria:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      requestBody: {
        title: req.body.title,
        caption: req.body.caption,
        category: req.body.category,
        imagesCount: req.body.images ? req.body.images.length : 0
      }
    });
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      console.error('❌ Erros de validação:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Atualizar item da galeria
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateGalleryItemUpdate, async (req, res) => {
  try {
    const { title, caption, category, date, isActive, images, fileData, fileType } = req.body;
    
    console.log('🔍 DEBUG BACKEND - PUT /:id recebido');
    console.log('🔍 DEBUG BACKEND - ID:', req.params.id);
    console.log('🔍 DEBUG BACKEND - images:', images ? `Array com ${images.length} itens` : 'undefined');
    console.log('🔍 DEBUG BACKEND - fileData:', fileData ? 'existe' : 'não existe');
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (caption !== undefined) updateData.caption = caption;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Suporte para múltiplas imagens (novo formato)
    if (images !== undefined) {
      if (Array.isArray(images) && images.length > 0) {
        // Validar cada imagem
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (!image.data || image.data.trim() === '') {
            return res.status(400).json({
              success: false,
              message: `Dados da imagem ${i + 1} são obrigatórios`
            });
          }

          // Para imagens existentes, ser mais flexível com validação
          if (!image.isExisting && (!image.name && !image.type)) {
            return res.status(400).json({
              success: false,
              message: `Nome ou tipo da imagem ${i + 1} são obrigatórios para novas imagens`
            });
          }

          // Verificar tamanho do arquivo base64 (aproximadamente) apenas para novas imagens
          if (!image.isExisting && image.data.startsWith('data:')) {
            const base64Size = image.data.length * (3/4);
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (base64Size > maxSize) {
              return res.status(400).json({
                success: false,
                message: `Imagem ${i + 1} muito grande. Tamanho máximo: 10MB`
              });
            }
          }
        }

        // Converter imagens para o formato do banco
        updateData.images = images.map((img, index) => ({
          src: img.data,
          alt: img.name || img.type || `${title || 'Item'} - Imagem ${index + 1}`
        }));
      } else {
        // Se images é um array vazio, limpar as imagens
        updateData.images = [];
      }

      // Limpar campos antigos se estamos usando o novo formato
      updateData.fileData = undefined;
      updateData.fileType = undefined;
    }
    // Compatibilidade com formato antigo (uma única imagem)
    else if (fileData !== undefined) {
      if (fileData) {
        // Verificar tamanho do arquivo se fornecido
        const base64Size = fileData.length * (3/4);
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (base64Size > maxSize) {
          return res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Tamanho máximo: 10MB'
          });
        }
      }
      
      updateData.fileData = fileData;
      if (fileType !== undefined) updateData.fileType = fileType;
    }

    const updatedItem = await GalleryItem.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item atualizado com sucesso',
      data: { item: updatedItem }
    });

  } catch (error) {
    console.error('Erro ao atualizar item da galeria:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Excluir item da galeria (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedItem = await GalleryItem.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir item da galeria:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/gallery/:id/permanent
// @desc    Excluir item da galeria permanentemente
// @access  Private (Admin only)
router.delete('/:id/permanent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedItem = await GalleryItem.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item excluído permanentemente'
    });

  } catch (error) {
    console.error('Erro ao excluir item permanentemente:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;