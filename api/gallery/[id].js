// Função serverless para operações individuais da galeria (GET, PUT, DELETE por ID)
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Schema do item da galeria (mesmo do arquivo principal)
const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    required: true,
    trim: true
  },
  fileData: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  images: [{
    src: String,
    alt: String,
    width: Number,
    height: Number
  }],
  category: {
    type: String,
    default: 'geral'
  },
  date: {
    type: Date,
    required: false,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Função para conectar ao MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error);
    throw error;
  }
}

// Modelo do item da galeria
const GalleryItem = mongoose.models.GalleryItem || mongoose.model('GalleryItem', galleryItemSchema);

// Função para validar token de autenticação
function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Token de autenticação necessário' };
  }

  const token = authHeader.substring(7);
  
  try {
    const secret = process.env.JWT_SECRET || 'nutt-festas-secret-key-2024';
    const decoded = jwt.verify(token, secret);
    return { valid: true, user: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expirado' };
    }
    return { valid: false, error: 'Token inválido' };
  }
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Conectar ao MongoDB
    await connectDB();

    const { id } = req.query;

    // Validar ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    switch (req.method) {
      case 'GET':
        // Buscar item específico por ID
        try {
          const { includeInactive } = req.query;

          let query = { _id: id, isActive: true };

          if (includeInactive === 'true') {
            const authValidation = validateToken(req.headers.authorization);
            if (!authValidation.valid) {
              return res.status(401).json({
                success: false,
                message: authValidation.error
              });
            }
            if (!authValidation.user || authValidation.user.role !== 'admin') {
              return res.status(403).json({
                success: false,
                message: 'Permissão insuficiente'
              });
            }
            query = { _id: id };
          }

          const item = await GalleryItem.findOne(query).lean();

          if (!item) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          return res.json({
            success: true,
            message: 'Item encontrado',
            data: { item }
          });
        } catch (error) {
          console.error('Erro ao buscar item:', error);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      case 'PUT':
        // Atualizar item existente (requer autenticação)
        const authValidation = validateToken(req.headers.authorization);
        if (!authValidation.valid) {
          return res.status(401).json({
            success: false,
            message: authValidation.error
          });
        }

        try {
          const { title, caption, category, date, isActive, images, fileData, fileType, fileSize } = req.body;

          console.log('📝 Dados recebidos para atualização:', {
            id,
            title,
            caption,
            category,
            date,
            isActive,
            hasImages: !!images,
            imagesCount: images ? images.length : 0,
            hasFileData: !!fileData
          });

          // Validações básicas
          if (!title || !caption) {
            return res.status(400).json({
              success: false,
              message: 'Título e descrição são obrigatórios'
            });
          }

          // Buscar item existente (permitir edição mesmo se inativo)
          const existingItem = await GalleryItem.findById(id);
          if (!existingItem) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          // Preparar dados para atualização
          const updateData = {
            title: title.trim(),
            caption: caption.trim(),
            category: category || 'geral',
            date: date ? new Date(date) : existingItem.date,
            // Preservar status atual se não informado
            isActive: isActive !== undefined ? isActive : existingItem.isActive
          };

          // Atualização de imagens (novo formato do admin)
          if (Array.isArray(images)) {
            if (images.length > 0) {
              // Validar e converter cada imagem do payload do admin
              const convertedImages = images.map((img, index) => {
                if (!img || !img.data || typeof img.data !== 'string' || img.data.trim() === '') {
                  throw new Error(`Dados da imagem ${index + 1} são inválidos`);
                }
                return {
                  src: img.data,
                  alt: img.name || img.type || `${title || existingItem.title} - Imagem ${index + 1}`
                };
              });

              updateData.images = convertedImages;

              // Usar a primeira imagem como principal para compatibilidade
              updateData.fileData = convertedImages[0].src;
              updateData.fileType = (images[0] && images[0].type) ? images[0].type : 'image/jpeg';
              updateData.fileSize = Math.round(convertedImages[0].src.length * (3/4));
            } else {
              // Limpar imagens se um array vazio for enviado
              updateData.images = [];
              // Não alterar fileData aqui para preservar compatibilidade com itens antigos
            }
          } else if (fileData !== undefined) {
            // Compatibilidade com formato antigo (uma única imagem)
            updateData.fileData = fileData || existingItem.fileData;
            updateData.fileType = fileType || existingItem.fileType || 'image/jpeg';
            updateData.fileSize = fileSize || (fileData ? Math.round(fileData.length * (3/4)) : existingItem.fileSize || 1024);
          }

          // Atualizar item
          const updatedItem = await GalleryItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
          );

          console.log('✅ Item atualizado com sucesso:', {
            id: updatedItem._id,
            title: updatedItem.title,
            category: updatedItem.category
          });

          return res.json({
            success: true,
            message: 'Item atualizado com sucesso',
            data: { item: updatedItem }
          });

        } catch (error) {
          console.error('Erro ao atualizar item:', error);
          
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

          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      case 'DELETE':
        // Excluir item (hard delete - requer autenticação)
        const deleteAuthValidation = validateToken(req.headers.authorization);
        if (!deleteAuthValidation.valid) {
          return res.status(401).json({
            success: false,
            message: deleteAuthValidation.error
          });
        }

        try {
          // Excluir permanentemente o item
          const deletedItem = await GalleryItem.findByIdAndDelete(id);

          if (!deletedItem) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          console.log('🗑️ Item excluído permanentemente:', {
            id: deletedItem._id,
            title: deletedItem.title
          });

          return res.json({
            success: true,
            message: 'Item excluído com sucesso'
          });

        } catch (error) {
          console.error('Erro ao excluir item:', error);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      default:
        return res.status(405).json({
          success: false,
          message: 'Método não permitido'
        });
    }

  } catch (error) {
    console.error('Erro na API da galeria [id]:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}