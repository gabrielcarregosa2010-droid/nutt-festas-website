// API da Galeria - Serverless Function para Vercel
const mongoose = require('mongoose');

// Schema do GalleryItem
const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  caption: {
    type: String,
    required: [true, 'Legenda é obrigatória'],
    trim: true,
    maxlength: [500, 'Legenda não pode ter mais de 500 caracteres']
  },
  fileData: {
    type: String,
    required: function() {
      return !this.images || this.images.length === 0;
    }
  },
  fileType: {
    type: String,
    required: function() {
      return !!this.fileData;
    },
    enum: {
        values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'],
        message: 'Tipo de arquivo não suportado'
      }
  },
  fileSize: {
    type: Number,
    required: function() {
      return !!this.fileData;
    },
    max: [10485760, 'Arquivo muito grande (máximo 10MB)']
  },
  images: [{
    src: { type: String, required: true },
    alt: { type: String, required: true }
  }],
  category: {
    type: String,
    required: false,
    trim: true,
    enum: {
      values: ['casamentos', 'aniversarios', 'corporativos', 'formaturas', 'geral'],
      message: 'Categoria deve ser: casamentos, aniversários, corporativos, formaturas ou geral'
    },
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

// Modelo do GalleryItem
const GalleryItem = mongoose.models.GalleryItem || mongoose.model('GalleryItem', galleryItemSchema);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Conectar ao banco de dados
    await connectDB();

    const { method } = req;

    switch (method) {
      case 'GET':
        // Listar todos os itens da galeria
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

          return res.status(200).json({
            success: true,
            data: items,
            total: total
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
          const { title, caption, fileData, fileType } = req.body;

          // Verificar tamanho do arquivo base64 (aproximadamente)
          if (fileData) {
            const base64Size = fileData.length * (3/4);
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (base64Size > maxSize) {
              return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo: 10MB'
              });
            }
          }

          const newItem = new GalleryItem({
            title,
            caption,
            fileData,
            fileType,
            fileSize: fileData ? fileData.length * (3/4) : undefined
          });

          const savedItem = await newItem.save();

          return res.status(201).json({
            success: true,
            message: 'Item criado com sucesso',
            data: savedItem
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