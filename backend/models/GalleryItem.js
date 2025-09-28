const mongoose = require('mongoose');

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
      // fileData é obrigatório apenas se não há images
      return !this.images || this.images.length === 0;
    }
  },
  fileType: {
    type: String,
    required: function() {
      // fileType é obrigatório apenas se há fileData
      return !!this.fileData;
    },
    enum: {
      values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
      message: 'Tipo de arquivo não suportado'
    }
  },
  fileSize: {
    type: Number,
    required: function() {
      // fileSize é obrigatório apenas se há fileData
      return !!this.fileData;
    },
    max: [10485760, 'Arquivo muito grande (máximo 10MB)'] // 10MB
  },
  images: [{
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para melhor performance
galleryItemSchema.index({ createdAt: -1 });
galleryItemSchema.index({ isActive: 1 });

// Middleware para validar tamanho do arquivo base64
galleryItemSchema.pre('save', function(next) {
  if (this.fileData) {
    // Calcular tamanho aproximado do arquivo base64
    const base64Size = this.fileData.length * (3/4);
    this.fileSize = Math.round(base64Size);
  } else if (this.images && this.images.length > 0) {
    // Para itens com apenas images, definir fileSize como 0
    this.fileSize = 0;
  }
  next();
});

module.exports = mongoose.model('GalleryItem', galleryItemSchema);