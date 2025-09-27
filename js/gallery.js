// Carregar itens da galeria via API
document.addEventListener('DOMContentLoaded', async function() {
    const galleryContainer = document.getElementById('gallery');
    
    // Mostrar loading
    galleryContainer.innerHTML = '<p class="loading-message">Carregando galeria...</p>';
    
    try {
        // Carregar itens da API
        const response = await api.getGalleryItems({ 
            sortBy: 'createdAt', 
            sortOrder: 'desc',
            limit: 50 // Limitar para melhor performance
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Erro ao carregar galeria');
        }
        
        const galleryItems = response.data.items;
        
        if (galleryItems.length === 0) {
            galleryContainer.innerHTML = '<p class="loading-message">Nenhum item encontrado na galeria.</p>';
            return;
        }
        
        galleryContainer.innerHTML = '';
        
        // Renderizar itens
        galleryItems.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            // Determinar se é imagem ou vídeo
            let mediaElement = '';
            if (item.fileType.startsWith('image/')) {
                mediaElement = `<img src="${item.fileData}" alt="${item.title}" loading="lazy">`;
            } else if (item.fileType.startsWith('video/')) {
                mediaElement = `<video controls preload="metadata"><source src="${item.fileData}" type="${item.fileType}"></video>`;
            }
            
            galleryItem.innerHTML = `
                ${mediaElement}
                <div class="content">
                    <h3>${item.title}</h3>
                    <p>${item.caption}</p>
                </div>
            `;
            
            galleryContainer.appendChild(galleryItem);
        });
        
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        galleryContainer.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar galeria: ${error.message}</p>
                <button onclick="location.reload()" class="retry-btn">Tentar novamente</button>
            </div>
        `;
    }
});