// Função serverless para rotas de galeria com MongoDB
import mongoose from 'mongoose';

// Schema do item da galeria
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

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Conectar ao MongoDB
    await connectDB();

    switch (req.method) {
      case 'GET':
        // Buscar itens da galeria no MongoDB
        try {
          const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
          
          const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder: sortOrder === 'asc' ? 1 : -1
          };

          const skip = (options.page - 1) * options.limit;
          const sortObj = {};
          sortObj[options.sortBy] = options.sortOrder;

          const items = await GalleryItem.find({ isActive: true })
            .sort(sortObj)
            .skip(skip)
            .limit(options.limit);

          const total = await GalleryItem.countDocuments({ isActive: true });

          // Transformar os itens para incluir o campo 'id' corretamente
          const transformedItems = items.map(item => {
            const itemObj = item.toJSON();
            return itemObj;
          });

          console.log(`📊 Encontrados ${transformedItems.length} itens da galeria (total: ${total})`);

          return res.json({
            success: true,
            message: 'Galeria carregada com sucesso',
            data: {
              items: transformedItems,
              total,
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
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      case 'POST':
        // Criar novo item (requer autenticação)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token de autenticação necessário'
          });
        }

        const token = authHeader.substring(7);
        
        // Validação JWT (igual ao auth/me.js)
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nutt-festas-secret-key-2024');
          // Token válido, continuar com a criação
        } catch (jwtError) {
          return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
          });
        }

        try {
          const { title, caption, fileData, fileType, images, category, date, isActive } = req.body;

          console.log('📝 Dados recebidos na API Vercel:', {
            title,
            caption,
            category,
            date,
            isActive,
            hasFileData: !!fileData,
            fileType,
            imagesCount: images ? images.length : 0
          });

          // Validações básicas
          if (!title || !caption) {
            return res.status(400).json({
              success: false,
              message: 'Título e descrição são obrigatórios'
            });
          }

          if (!fileData && (!images || images.length === 0)) {
            return res.status(400).json({
              success: false,
              message: 'É necessário fornecer pelo menos uma imagem'
            });
          }

          // Processar dados das imagens corretamente
          let processedFileData = fileData;
          let processedFileType = fileType;
          let processedImages = [];

          if (images && images.length > 0) {
            // Usar a primeira imagem como fileData principal
            processedFileData = images[0].data;
            processedFileType = images[0].type || 'image/jpeg';
            
            // Mapear todas as imagens para o formato correto
            processedImages = images.map((img, index) => ({
              src: img.data,
              alt: img.name || `${title} - Imagem ${index + 1}`
            }));
          }

          // Criar novo item
          const newItem = new GalleryItem({
            title: title.trim(),
            caption: caption.trim(),
            fileData: processedFileData,
            fileType: processedFileType,
            fileSize: processedFileData ? Math.round(processedFileData.length * (3/4)) : 0,
            images: processedImages,
            category: category || 'geral',
            date: date ? new Date(date) : new Date(),
            isActive: isActive !== undefined ? isActive : true
          });

          const savedItem = await newItem.save();

          console.log('✅ Item criado com sucesso:', {
            id: savedItem._id,
            title: savedItem.title,
            category: savedItem.category
          });

          return res.status(201).json({
            success: true,
            message: 'Item criado com sucesso',
            data: {
              item: savedItem
            }
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

          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      case 'PUT':
        // Atualizar item existente (requer autenticação)
        const authHeaderPut = req.headers.authorization;
        if (!authHeaderPut || !authHeaderPut.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token de autenticação necessário'
          });
        }

        const tokenPut = authHeaderPut.substring(7);
        
        // Validação simples do token (base64)
        try {
          const decoded = Buffer.from(tokenPut, 'base64').toString('utf-8');
          const tokenData = JSON.parse(decoded);
          
          if (!tokenData.expires || Date.now() > new Date(tokenData.expires).getTime()) {
            return res.status(401).json({
              success: false,
              message: 'Token expirado'
            });
          }
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'Token inválido'
          });
        }

        try {
          const { title, caption, category, date, isActive, images, fileData, fileType } = req.body;
          
          // Extrair ID da URL
          const urlParts = req.url.split('/');
          const itemId = urlParts[urlParts.length - 1];
          
          if (!itemId || itemId === 'gallery') {
            return res.status(400).json({
              success: false,
              message: 'ID do item é obrigatório'
            });
          }

          console.log('📝 Dados recebidos para atualização na API Vercel:', {
            itemId,
            title,
            caption,
            category,
            date,
            isActive,
            hasImages: images && images.length > 0,
            hasFileData: !!fileData
          });

          const updateData = {};
          if (title !== undefined) updateData.title = title;
          if (caption !== undefined) updateData.caption = caption;
          if (category !== undefined) updateData.category = category;
          if (date !== undefined) updateData.date = date;
          if (isActive !== undefined) updateData.isActive = isActive;

          // Suporte para múltiplas imagens (novo formato)
          if (images && Array.isArray(images) && images.length > 0) {
            // Validar cada imagem
            for (let i = 0; i < images.length; i++) {
              const image = images[i];
              if (!image.data || (!image.name && !image.type)) {
                return res.status(400).json({
                  success: false,
                  message: `Dados da imagem ${i + 1} são inválidos`
                });
              }

              // Verificar tamanho do arquivo base64 (aproximadamente) apenas para novas imagens
              if (!image.isExisting) {
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
              alt: img.name || img.type || `${title} - Imagem ${index + 1}`
            }));

            // Usar a primeira imagem como fileData principal para compatibilidade
            updateData.fileData = images[0].data;
            updateData.fileType = images[0].type || 'image/jpeg';
            updateData.fileSize = Math.round(images[0].data.length * (3/4));
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
            if (fileData) updateData.fileSize = Math.round(fileData.length * (3/4));
          }

          const updatedItem = await GalleryItem.findOneAndUpdate(
            { _id: itemId },
            updateData,
            { new: true, runValidators: true }
          );

          if (!updatedItem) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          console.log('✅ Item atualizado com sucesso:', {
            id: updatedItem._id,
            title: updatedItem.title,
            category: updatedItem.category
          });

          return res.status(200).json({
            success: true,
            message: 'Item atualizado com sucesso',
            data: {
              item: updatedItem
            }
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
    console.error('Erro na API da galeria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};