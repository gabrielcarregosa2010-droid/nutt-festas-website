const { body, validationResult } = require('express-validator');

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validações para itens da galeria
const validateGalleryItem = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Título é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Título deve ter entre 1 e 100 caracteres'),
    
  body('caption')
    .trim()
    .notEmpty()
    .withMessage('Legenda é obrigatória')
    .isLength({ min: 1, max: 500 })
    .withMessage('Legenda deve ter entre 1 e 500 caracteres'),
    
  body('fileData')
    .notEmpty()
    .withMessage('Dados do arquivo são obrigatórios')
    .custom((value) => {
      // Verificar se é uma string base64 válida
      if (!value.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)) {
        throw new Error('Formato de arquivo inválido');
      }
      return true;
    }),
    
  body('fileType')
    .notEmpty()
    .withMessage('Tipo do arquivo é obrigatório')
    .isIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
    .withMessage('Tipo de arquivo não suportado'),
    
  handleValidationErrors
];

// Validações para atualização de item da galeria
const validateGalleryItemUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Título deve ter entre 1 e 100 caracteres'),
    
  body('caption')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Legenda deve ter entre 1 e 500 caracteres'),
    
  // Validação para o novo formato de múltiplas imagens
  body('images')
    .optional()
    .isArray()
    .withMessage('Images deve ser um array')
    .custom((images) => {
      if (images && Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (image.data && !image.data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)) {
            throw new Error(`Formato de arquivo inválido na imagem ${i + 1}`);
          }
          if (image.type && !['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'].includes(image.type)) {
            throw new Error(`Tipo de arquivo não suportado na imagem ${i + 1}`);
          }
        }
      }
      return true;
    }),
    
  // Validação para o formato antigo (compatibilidade)
  body('fileData')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)) {
        throw new Error('Formato de arquivo inválido');
      }
      return true;
    }),
    
  body('fileType')
    .optional()
    .isIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
    .withMessage('Tipo de arquivo não suportado'),
    
  handleValidationErrors
];

// Validações para login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Nome de usuário é obrigatório'),
    
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
    
  handleValidationErrors
];

// Validações para criação de usuário
const validateUserCreation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Nome de usuário é obrigatório')
    .isLength({ min: 3, max: 30 })
    .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário deve conter apenas letras, números e underscore'),
    
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
    
  handleValidationErrors
];

module.exports = {
  validateGalleryItem,
  validateGalleryItemUpdate,
  validateLogin,
  validateUserCreation,
  handleValidationErrors
};