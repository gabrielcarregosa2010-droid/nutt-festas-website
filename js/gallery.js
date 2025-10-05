// Galeria de imagens com modal e navegação

// Usar configuração global de debug diretamente

document.addEventListener('DOMContentLoaded', async function() {
    const galleryContainer = document.getElementById('gallery');
    
    // Dados estáticos removidos - agora todos os itens vêm do banco de dados
    
    // Carregar itens da galeria do banco de dados via API
    try {
        const api = new ApiService();
        const response = await api.getGalleryItems({ 
            sortBy: 'createdAt', 
            sortOrder: 'desc',
            limit: 50
        });
        
        if (response.success && response.data.items && response.data.items.length > 0) {
            renderGallery(response.data.items, true);
        } else {
            // Mostrar mensagem quando não há itens na galeria
            galleryContainer.innerHTML = `
                <div class="no-items-message">
                    <h3>Galeria vazia</h3>
                    <p>Nenhum item foi encontrado na galeria. Use o painel administrativo para adicionar novos itens.</p>
                </div>
            `;
        }
    } catch (error) {
        window.DebugConfig.error('Erro ao carregar galeria:', error);
        galleryContainer.innerHTML = `
            <div class="error-message">
                <h3>Erro ao carregar galeria</h3>
                <p>Não foi possível conectar com o servidor. Tente novamente mais tarde.</p>
            </div>
        `;
    }
    
    function renderGallery(items, isFromAPI = false) {
        galleryContainer.innerHTML = '';
        
        items.forEach((item, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.setAttribute('data-index', index);
            
            let imageSrc, title, caption, hasMultipleImages = false;

            // Normalizar lista de imagens independente da origem
            const imageList = isFromAPI
                ? (Array.isArray(item.images) && item.images.length > 0
                    ? item.images
                    : (item.fileData ? [{ src: item.fileData, alt: item.title }] : []))
                : (item.images || []);

            // Usar a primeira imagem como principal quando existir
            if (imageList.length > 0) {
                imageSrc = imageList[0].src;
                hasMultipleImages = imageList.length > 1;
            } else {
                imageSrc = '';
            }

            title = item.title;
            caption = item.caption;
            
            galleryItem.innerHTML = `
                <img src="${imageSrc}" alt="${title}" loading="lazy">
                <div class="content">
                    <h3>${title}</h3>
                    <p>${caption}</p>
                </div>
                <div class="overlay">
                    <i class="fas fa-search-plus"></i>
                    ${hasMultipleImages ? `<div class="multiple-photos-indicator">
                        <i class="fas fa-images"></i>
                        <span>${imageList.length}</span>
                    </div>` : ''}
                </div>
            `;
            
            // Adicionar evento de clique para abrir modal
            galleryItem.addEventListener('click', () => openModal(index, items, isFromAPI));
            
            galleryContainer.appendChild(galleryItem);
        });
    }
    
    function openModal(itemIndex, items, isFromAPI) {
        // Verificações de segurança
        if (!items || !Array.isArray(items) || itemIndex < 0 || itemIndex >= items.length) {
            console.error('Parâmetros inválidos para openModal');
            return;
        }
        
        // Criar modal se não existir
        let modal = document.getElementById('galleryModal');
        if (!modal) {
            modal = createModal();
        }
        
        // Armazenar dados no modal para uso posterior
        modal.items = items;
        modal.currentItemIndex = itemIndex;
        modal.currentImageIndex = 0;
        modal.isFromAPI = isFromAPI;
        
        // Preparar animação de entrada
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        document.body.style.overflow = 'hidden';
        
        // Carregar conteúdo do item selecionado (começando pela primeira imagem)
        showImageInModal(itemIndex, 0, items, isFromAPI);
        
        // Animar entrada
        requestAnimationFrame(() => {
            modal.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });
    }
    
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'galleryModal';
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-counter">
                        <span id="modalCounter">1 / 1</span>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-action-btn fullscreen-btn" id="fullscreenBtn" title="Tela cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="modal-action-btn close-btn" id="closeBtn" title="Fechar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <button class="nav-btn prev-btn" id="prevBtn" title="Anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <div class="modal-image-wrapper">
                        <div class="image-container">
                            <img id="modalImage" src="" alt="" loading="lazy">
                            <div class="image-loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Carregando...</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="nav-btn next-btn" id="nextBtn" title="Próximo">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="modal-footer">
                    <div class="image-details">
                        <div class="image-title">
                            <h2 id="modalTitle"></h2>
                        </div>
                        <div class="image-description">
                            <p id="modalCaption"></p>
                        </div>
                        <div class="image-metadata">
                            <div class="metadata-item">
                                <i class="fas fa-calendar"></i>
                                <span id="modalDate">Data não disponível</span>
                            </div>
                            <div class="metadata-item">
                                <i class="fas fa-tag"></i>
                                <span id="modalCategory">Categoria não especificada</span>
                            </div>
                            <div class="metadata-item">
                                <i class="fas fa-image"></i>
                                <span id="modalDimensions">Dimensões não disponíveis</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="thumbnail-strip" id="thumbnailStrip">
                        <!-- Thumbnails serão inseridos aqui -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos do modal
        modal.querySelector('#closeBtn').addEventListener('click', closeModal);
        modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
        modal.querySelector('#fullscreenBtn').addEventListener('click', toggleFullscreen);
        
        document.addEventListener('keydown', handleKeyPress);
        
        return modal;
    }
    
    function showImageInModal(itemIndex, imageIndex, items, isFromAPI) {
        // Verificações de segurança
        if (!items || !Array.isArray(items) || itemIndex < 0 || itemIndex >= items.length) {
            console.error('Parâmetros inválidos para showImageInModal');
            return;
        }
        
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalCaption = document.getElementById('modalCaption');
        const modalCounter = document.getElementById('modalCounter');
        const modalDate = document.getElementById('modalDate');
        const modalCategory = document.getElementById('modalCategory');
        const modalDimensions = document.getElementById('modalDimensions');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const imageLoading = document.querySelector('.image-loading');
        const thumbnailStrip = document.getElementById('thumbnailStrip');
        
        const item = items[itemIndex];
        if (!item) {
            console.error('Item não encontrado no índice:', itemIndex);
            return;
        }
        
        let currentImages, currentImage;

        // Normalizar lista de imagens independente da origem
        currentImages = isFromAPI
            ? (Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : (item.fileData ? [{ src: item.fileData, alt: item.title }] : []))
            : (item.images || []);

        if (currentImages.length === 0) {
            console.error('Imagem não encontrada ou sem src');
            return;
        }

        // Ajustar índice dentro dos limites
        if (imageIndex < 0 || imageIndex >= currentImages.length) {
            imageIndex = 0;
        }
        currentImage = currentImages[imageIndex];
        
        if (!currentImage || !currentImage.src) {
            console.error('Imagem não encontrada ou sem src');
            return;
        }
        
        // Mostrar loading
        imageLoading.style.display = 'flex';
        modalImage.style.opacity = '0';
        
        // Atualizar contador (mostra imagem atual / total de imagens do item)
        modalCounter.textContent = `${imageIndex + 1} / ${currentImages.length}`;
        
        // Configurar imagem principal
        modalImage.onload = () => {
            imageLoading.style.display = 'none';
            modalImage.style.opacity = '1';
            
            // Atualizar dimensões
            modalDimensions.textContent = `${modalImage.naturalWidth} × ${modalImage.naturalHeight}px`;
        };
        
        modalImage.onerror = () => {
            imageLoading.style.display = 'none';
            modalImage.style.opacity = '1';
            modalDimensions.textContent = 'Erro ao carregar imagem';
        };
        
        modalImage.src = currentImage.src;
        modalImage.alt = currentImage.alt || item.title;
        modalTitle.textContent = item.title;
        modalCaption.textContent = item.caption;
        
        // Atualizar índice atual no modal
        const modal = document.getElementById('galleryModal');
        if (modal) {
            modal.currentImageIndex = imageIndex;
            modal.currentItemIndex = itemIndex;
            modal.items = items;
            modal.isFromAPI = isFromAPI;
        }
        
        // Atualizar metadados
        const displayDate = item.date ? new Date(item.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        modalDate.textContent = displayDate;
        
        // Mapear categorias para nomes amigáveis
        const categoryNames = {
            'casamentos': 'Casamentos',
            'aniversarios': 'Aniversários',
            'corporativos': 'Eventos Corporativos',
            'formaturas': 'Formaturas',
            'geral': 'Galeria de Eventos'
        };
        modalCategory.textContent = categoryNames[item.category] || 'Galeria de Eventos';
        
        // Configurar navegação entre imagens do mesmo item
        prevBtn.onclick = () => {
            const newImageIndex = imageIndex > 0 ? imageIndex - 1 : currentImages.length - 1;
            showImageInModal(itemIndex, newImageIndex, items, isFromAPI);
        };
        
        nextBtn.onclick = () => {
            const newImageIndex = imageIndex < currentImages.length - 1 ? imageIndex + 1 : 0;
            showImageInModal(itemIndex, newImageIndex, items, isFromAPI);
        };
        
        // Mostrar/ocultar botões de navegação
        const hasMultipleImages = currentImages.length > 1;
        prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        
        // Gerar thumbnails das imagens do item atual
        generateThumbnails(itemIndex, imageIndex, items, isFromAPI);
    }

    function generateThumbnails(itemIndex, currentImageIndex, items, isFromAPI) {
        const thumbnailStrip = document.getElementById('thumbnailStrip');
        thumbnailStrip.innerHTML = '';
        
        const item = items[itemIndex];
        let currentImages;

        // Normalizar lista de imagens independente da origem
        currentImages = isFromAPI
            ? (Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : (item.fileData ? [{ src: item.fileData, alt: item.title }] : []))
            : (item.images || []);
        
        if (currentImages.length <= 1) {
            thumbnailStrip.style.display = 'none';
            return;
        }
        
        thumbnailStrip.style.display = 'flex';
        
        currentImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
            
            const img = document.createElement('img');
            img.src = image.src;
            img.alt = image.alt || item.title;
            img.loading = 'lazy';
            
            thumbnail.appendChild(img);
            thumbnail.addEventListener('click', () => {
                showImageInModal(itemIndex, index, items, isFromAPI);
            });
            
            thumbnailStrip.appendChild(thumbnail);
        });
    }
    
    function toggleFullscreen() {
        const modal = document.getElementById('galleryModal');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (!document.fullscreenElement) {
            modal.requestFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                fullscreenBtn.title = 'Sair da tela cheia';
                modal.classList.add('fullscreen-mode');
            }).catch(err => {
                console.log('Erro ao entrar em tela cheia:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                fullscreenBtn.title = 'Tela cheia';
                modal.classList.remove('fullscreen-mode');
            });
        }
    }
    

    
    function closeModal() {
        const modal = document.getElementById('galleryModal');
        if (modal) {
            // Animação de saída
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
                document.body.style.overflow = 'auto';
                
                // Sair da tela cheia se estiver ativa
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }, 200);
        }
    }
    
    function handleKeyPress(e) {
        const modal = document.getElementById('galleryModal');
        if (!modal || modal.style.display === 'none') return;
        
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft' && modal.items && typeof modal.currentItemIndex === 'number' && modal.currentItemIndex >= 0) {
            // Navegar entre imagens do item atual
            const item = modal.items[modal.currentItemIndex];
            if (!item) return;
            
            let currentImages;

            currentImages = modal.isFromAPI
                ? (Array.isArray(item.images) && item.images.length > 0
                    ? item.images
                    : (item.fileData ? [{ src: item.fileData, alt: item.title }] : []))
                : (item.images || []);
            
            if (currentImages.length > 1 && typeof modal.currentImageIndex === 'number') {
                const newImageIndex = modal.currentImageIndex > 0 ? modal.currentImageIndex - 1 : currentImages.length - 1;
                showImageInModal(modal.currentItemIndex, newImageIndex, modal.items, modal.isFromAPI);
            }
        } else if (e.key === 'ArrowRight' && modal.items && typeof modal.currentItemIndex === 'number' && modal.currentItemIndex >= 0) {
            // Navegar entre imagens do item atual
            const item = modal.items[modal.currentItemIndex];
            if (!item) return;
            
            let currentImages;

            currentImages = modal.isFromAPI
                ? (Array.isArray(item.images) && item.images.length > 0
                    ? item.images
                    : (item.fileData ? [{ src: item.fileData, alt: item.title }] : []))
                : (item.images || []);
            
            if (currentImages.length > 1 && typeof modal.currentImageIndex === 'number') {
                const newImageIndex = modal.currentImageIndex < currentImages.length - 1 ? modal.currentImageIndex + 1 : 0;
                showImageInModal(modal.currentItemIndex, newImageIndex, modal.items, modal.isFromAPI);
            }
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    }
});