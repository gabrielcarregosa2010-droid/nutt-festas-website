// Função serverless para rotas de galeria
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

  // Rota para listar itens da galeria
  if (req.method === 'GET' && req.url === '/api/gallery') {
    try {
      // Por enquanto, retornar dados mockados até implementar MongoDB
      const mockGalleryItems = [
        {
          id: '1',
          title: 'Festa de Aniversário',
          description: 'Decoração temática infantil',
          imageUrl: '/img/gallery/festa1.jpg',
          category: 'aniversario',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Casamento Elegante',
          description: 'Decoração clássica para casamento',
          imageUrl: '/img/gallery/casamento1.jpg',
          category: 'casamento',
          createdAt: new Date().toISOString()
        }
      ];

      return res.json({
        success: true,
        message: 'Galeria carregada com sucesso',
        data: {
          items: mockGalleryItems,
          total: mockGalleryItems.length
        }
      });
    } catch (error) {
      console.error('Erro ao carregar galeria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Rota para adicionar item à galeria (requer autenticação)
  if (req.method === 'POST' && req.url === '/api/gallery') {
    try {
      // Verificar autenticação básica
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação necessário'
        });
      }

      // Por enquanto, simular adição bem-sucedida
      return res.json({
        success: true,
        message: 'Item adicionado à galeria com sucesso',
        data: {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao adicionar item à galeria:', error);
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
      'GET /api/gallery',
      'POST /api/gallery'
    ]
  });
}