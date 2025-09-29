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
    const { method, url } = req;
    const urlParts = url.split('/');
    const itemId = urlParts[urlParts.length - 1];

    // Dados mockados da galeria (simulando banco de dados)
    const galleryItems = [
      {
        id: '1',
        title: 'Festa de Aniversário Infantil',
        description: 'Decoração temática com personagens favoritos das crianças',
        category: 'infantil',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZiNmMxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZlc3RhIEluZmFudGlsPC90ZXh0Pjwvc3ZnPg=='
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        title: 'Casamento Elegante',
        description: 'Decoração sofisticada para o dia mais especial',
        category: 'casamento',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOGZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhc2FtZW50byBFbGVnYW50ZTwvdGV4dD48L3N2Zz4='
        ],
        createdAt: '2024-01-20T14:30:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: '3',
        title: 'Festa Corporativa',
        description: 'Evento empresarial com decoração moderna e profissional',
        category: 'corporativo',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZlc3RhIENvcnBvcmF0aXZhPC90ZXh0Pjwvc3ZnPg=='
        ],
        createdAt: '2024-02-01T09:15:00Z',
        updatedAt: '2024-02-01T09:15:00Z'
      }
    ];

    // Verificar autenticação para operações que precisam (POST, PUT, DELETE)
    const needsAuth = ['POST', 'PUT', 'DELETE'].includes(method);
    let isAuthenticated = false;

    if (needsAuth) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Validar token simples (base64)
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          const now = new Date();
          const expires = new Date(decoded.expires);
          isAuthenticated = now < expires && decoded.role === 'admin';
        } catch (error) {
          isAuthenticated = false;
        }
      }

      if (!isAuthenticated) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }
    }

    // Roteamento baseado no método HTTP
    switch (method) {
      case 'GET':
        // Listar todos os itens ou item específico
        if (itemId && itemId !== 'gallery') {
          const item = galleryItems.find(item => item.id === itemId);
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
        } else {
          // Listar todos os itens
          return res.status(200).json({
            success: true,
            data: {
              items: galleryItems,
              total: galleryItems.length,
              page: 1,
              limit: 50
            }
          });
        }

      case 'POST':
        // Criar novo item
        const { title, description, category, images } = req.body;
        
        if (!title || !description || !category) {
          return res.status(400).json({
            success: false,
            message: 'Título, descrição e categoria são obrigatórios'
          });
        }

        const newItem = {
          id: String(galleryItems.length + 1),
          title,
          description,
          category,
          images: images || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return res.status(201).json({
          success: true,
          message: 'Item criado com sucesso',
          data: newItem
        });

      case 'PUT':
        // Atualizar item existente
        const updateData = req.body;
        const existingItem = galleryItems.find(item => item.id === itemId);
        
        if (!existingItem) {
          return res.status(404).json({
            success: false,
            message: 'Item não encontrado'
          });
        }

        const updatedItem = {
          ...existingItem,
          ...updateData,
          id: itemId, // Manter o ID original
          updatedAt: new Date().toISOString()
        };

        return res.status(200).json({
          success: true,
          message: 'Item atualizado com sucesso',
          data: updatedItem
        });

      case 'DELETE':
        // Deletar item
        const itemToDelete = galleryItems.find(item => item.id === itemId);
        
        if (!itemToDelete) {
          return res.status(404).json({
            success: false,
            message: 'Item não encontrado'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Item deletado com sucesso'
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Método ${method} não permitido`
        });
    }

  } catch (error) {
    console.error('Erro na API da galeria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};