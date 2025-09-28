const mongoose = require('mongoose');

const siteImageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da imagem é obrigatório'],
    unique: true,
    trim: true,
    enum: {
      values: ['home', 'about', 'logo'],
      message: 'Nome deve ser: home, about ou logo'
    }
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true
  },
  fileData: {
    type: String,
    required: [true, 'Dados do arquivo são obrigatórios']
  },
  fileType: {
    type: String,
    required: [true, 'Tipo do arquivo é obrigatório'],
    enum: {
      values: ['image/jpeg', 'image/png', 'image/webp'],
      message: 'Tipo de arquivo não suportado'
    }
  },
  fileSize: {
    type: Number,
    required: true,
    max: [5242880, 'Arquivo muito grande (máximo 5MB)'] // 5MB para imagens do site
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
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

// Índices para melhor performance
siteImageSchema.index({ name: 1, isActive: 1 });
siteImageSchema.index({ createdAt: -1 });

// Middleware para calcular tamanho do arquivo base64
siteImageSchema.pre('validate', function(next) {
  if (this.fileData && !this.fileSize) {
    // Calcular tamanho aproximado do arquivo base64
    const base64Size = this.fileData.length * (3/4);
    this.fileSize = Math.round(base64Size);
  }
  next();
});

// Método estático para buscar imagem ativa por nome
siteImageSchema.statics.findActiveByName = function(name) {
  return this.findOne({ name, isActive: true }).sort({ version: -1 });
};

module.exports = mongoose.model('SiteImage', siteImageSchema);