// API da Galeria - Serverless Function para Vercel
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Dados mockados da galeria
    const galleryItems = [
      {
        id: '1',
        title: 'Festa de Aniversário Infantil',
        description: 'Decoração temática com personagens favoritos',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRGNDZFNSIvPgogIDx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RmVzdGEgSW5mYW50aWw8L3RleHQ+Cjwvc3ZnPg==',
        category: 'infantil',
        date: '2024-01-15'
      },
      {
        id: '2',
        title: 'Casamento Elegante',
        description: 'Decoração clássica com flores brancas e dourado',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0Y1OTM5QSIvPgogIDx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FzYW1lbnRvPC90ZXh0Pgo8L3N2Zz4=',
        category: 'casamento',
        date: '2024-02-20'
      },
      {
        id: '3',
        title: 'Festa Corporativa',
        description: 'Evento empresarial com decoração moderna',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwQjk4MSIvPgogIDx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXZlbnRvIENvcnBvcmF0aXZvPC90ZXh0Pgo8L3N2Zz4=',
        category: 'corporativo',
        date: '2024-03-10'
      }
    ];

    const { method } = req;

    switch (method) {
      case 'GET':
        // Listar todos os itens da galeria
        return res.status(200).json({
          success: true,
          data: galleryItems,
          total: galleryItems.length
        });

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
          
          if (!tokenData.exp || Date.now() > tokenData.exp) {
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

        const newItem = {
          id: String(galleryItems.length + 1),
          title: req.body.title || 'Novo Item',
          description: req.body.description || 'Descrição do item',
          image: req.body.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzZCNzI4MCIvPgogIDx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm92byBJdGVtPC90ZXh0Pgo8L3N2Zz4=',
          category: req.body.category || 'geral',
          date: new Date().toISOString().split('T')[0]
        };

        return res.status(201).json({
          success: true,
          data: newItem,
          message: 'Item criado com sucesso'
        });

      case 'PUT':
        // Atualizar item existente (requer autenticação)
        const authHeaderPut = req.headers.authorization;
        if (!authHeaderPut || !authHeaderPut.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token de autenticação necessário'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Item atualizado com sucesso'
        });

      case 'DELETE':
        // Deletar item (requer autenticação)
        const authHeaderDelete = req.headers.authorization;
        if (!authHeaderDelete || !authHeaderDelete.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token de autenticação necessário'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Item deletado com sucesso'
        });

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
}