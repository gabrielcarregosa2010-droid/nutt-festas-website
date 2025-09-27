const express = require('express');
const router = express.Router();
const GalleryItem = require('../models/GalleryItem');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateGalleryItem, validateGalleryItemUpdate } = require('../middleware/validation');

// @route   GET /api/gallery
// @desc    Obter todos os itens da galeria
// @access  Public
router.get('/', async (req, res) => {
  try {
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
router.post('/', authenticateToken, requireAdmin, validateGalleryItem, async (req, res) => {
  try {
    const { title, caption, fileData, fileType } = req.body;

    // Verificar tamanho do arquivo base64 (aproximadamente)
    const base64Size = fileData.length * (3/4);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (base64Size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }

    const newItem = new GalleryItem({
      title,
      caption,
      fileData,
      fileType
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Item criado com sucesso',
      data: { item: savedItem }
    });

  } catch (error) {
    console.error('Erro ao criar item da galeria:', error);
    
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

// @route   PUT /api/gallery/:id
// @desc    Atualizar item da galeria
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateGalleryItemUpdate, async (req, res) => {
  try {
    const { title, caption, fileData, fileType } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (caption !== undefined) updateData.caption = caption;
    if (fileData !== undefined) {
      // Verificar tamanho do arquivo se fornecido
      const base64Size = fileData.length * (3/4);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (base64Size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo muito grande. Tamanho máximo: 10MB'
        });
      }
      
      updateData.fileData = fileData;
    }
    if (fileType !== undefined) updateData.fileType = fileType;

    const updatedItem = await GalleryItem.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
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