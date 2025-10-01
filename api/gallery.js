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
            .limit(options.limit)
            .lean();

          const total = await GalleryItem.countDocuments({ isActive: true });

          console.log(`📊 Encontrados ${items.length} itens da galeria (total: ${total})`);

          return res.json({
            success: true,
            message: 'Galeria carregada com sucesso',
            data: {
              items,
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
        
        // Validação simples do token (base64)
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
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

          // Criar novo item
          const newItem = new GalleryItem({
            title: title.trim(),
            caption: caption.trim(),
            fileData: fileData || (images && images[0] ? images[0].src : ''),
            fileType: fileType || 'image/jpeg',
            fileSize: req.body.fileSize || 1024,
            images: images || [],
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