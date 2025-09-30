// API da Galeria - Rotas dinâmicas para itens específicos
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Conectar ao banco de dados
    await connectDB();

    const { id } = req.query;
    const { method } = req;

    // Função para validar token
    const validateToken = (authHeader) => {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token de autenticação necessário');
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const tokenData = JSON.parse(decoded);
        
        if (!tokenData.expires || Date.now() > new Date(tokenData.expires).getTime()) {
          throw new Error('Token expirado');
        }
        
        return tokenData;
      } catch (error) {
        throw new Error('Token inválido');
      }
    };

    switch (method) {
      case 'GET':
        // Buscar item específico
        try {
          const item = await GalleryItem.findById(id);
          
          if (!item) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          return res.status(200).json({
            success: true,
            data: item
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
        try {
          validateToken(req.headers.authorization);
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: error.message
          });
        }

        try {
          const item = await GalleryItem.findById(id);
          
          if (!item) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          // Atualizar campos
          Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
              item[key] = req.body[key];
            }
          });

          const updatedItem = await item.save();

          return res.status(200).json({
            success: true,
            data: updatedItem,
            message: 'Item atualizado com sucesso'
          });
        } catch (error) {
          console.error('Erro ao atualizar item:', error);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

      case 'DELETE':
        // Deletar item (requer autenticação)
        try {
          validateToken(req.headers.authorization);
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: error.message
          });
        }

        try {
          const item = await GalleryItem.findById(id);
          
          if (!item) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          await GalleryItem.findByIdAndDelete(id);

          return res.status(200).json({
            success: true,
            message: 'Item deletado com sucesso'
          });
        } catch (error) {
          console.error('Erro ao deletar item:', error);
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
    console.error('Erro na API da galeria (item específico):', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};