// Função serverless para rotas de imagens do site
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

  // Rota para listar imagens do site
  if (req.method === 'GET' && req.url === '/api/site-images') {
    try {
      // Dados mockados das imagens do site
      const mockSiteImages = {
        home: {
          hero: '/img/home.jpg',
          about: '/img/about.jpg',
          logo: '/img/logo.svg'
        },
        gallery: {
          featured: [
            '/img/gallery/festa1.jpg',
            '/img/gallery/casamento1.jpg',
            '/img/gallery/decoracao1.jpg'
          ]
        },
        contact: {
          background: '/img/contact-bg.jpg'
        }
      };

      return res.json({
        success: true,
        message: 'Imagens do site carregadas com sucesso',
        data: mockSiteImages
      });
    } catch (error) {
      console.error('Erro ao carregar imagens do site:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Rota para atualizar imagens do site (requer autenticação)
  if (req.method === 'PUT' && req.url === '/api/site-images') {
    try {
      // Verificar autenticação básica
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação necessário'
        });
      }

      // Por enquanto, simular atualização bem-sucedida
      return res.json({
        success: true,
        message: 'Imagens do site atualizadas com sucesso',
        data: {
          ...req.body,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar imagens do site:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Rota não encontrada
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.url,
    method: req.method,
    availableRoutes: [
      'GET /api/site-images',
      'PUT /api/site-images'
    ]
  });
}