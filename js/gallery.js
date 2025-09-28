// Galeria de imagens com modal e navegação
document.addEventListener('DOMContentLoaded', async function() {
    const galleryContainer = document.getElementById('gallery');
    
    // Imagens de exemplo da galeria com múltiplas fotos por item
    const galleryItems = [
        {
            id: 1,
            title: 'Festa de Aniversário Infantil',
            caption: 'Decoração temática com balões e personagens favoritos',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
                    alt: 'Vista geral da festa infantil'
                },
                {
                    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
                    alt: 'Mesa de doces decorada'
                },
                {
                    src: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop',
                    alt: 'Área de brincadeiras'
                }
            ]
        },
        {
            id: 2,
            title: 'Casamento Romântico',
            caption: 'Decoração elegante com flores e luzes',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
                    alt: 'Cerimônia de casamento'
                },
                {
                    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
                    alt: 'Mesa dos noivos'
                }
            ]
        },
        {
            id: 3,
            title: 'Festa de 15 Anos',
            caption: 'Decoração sofisticada em tons de rosa e dourado',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
                    alt: 'Salão principal da festa'
                },
                {
                    src: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=600&fit=crop',
                    alt: 'Mesa de doces elegante'
                },
                {
                    src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
                    alt: 'Pista de dança'
                }
            ]
        },
        {
            id: 4,
            title: 'Festa Corporativa',
            caption: 'Ambiente profissional com decoração moderna',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
                    alt: 'Evento corporativo principal'
                }
            ]
        },
        {
            id: 5,
            title: 'Festa de Formatura',
            caption: 'Celebração especial com decoração temática',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
                    alt: 'Cerimônia de formatura'
                },
                {
                    src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
                    alt: 'Mesa de celebração'
                }
            ]
        },
        {
            id: 6,
            title: 'Festa de Batizado',
            caption: 'Decoração delicada em tons pastéis',
            images: [
                {
                    src: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop',
                    alt: 'Decoração do batizado'
                },
                {
                    src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
                    alt: 'Mesa de doces do batizado'
                },
                {
                    src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop',
                    alt: 'Área de convivência'
                }
            ]
        }
    ];
    
    // Tentar carregar da API primeiro, se falhar usar imagens estáticas
    try {
        const api = new ApiService();
        const response = await api.getGalleryItems({ 
            sortBy: 'createdAt', 
            sortOrder: 'desc',
            limit: 50
        });
        
        if (response.success && response.data.items.length > 0) {
            renderGallery(response.data.items, true);
        } else {
            renderGallery(galleryItems, false);
        }
    } catch (error) {
        console.log('API não disponível, usando galeria estática');
        renderGallery(galleryItems, false);
    }
    
    function renderGallery(items, isFromAPI = false) {
        galleryContainer.innerHTML = '';
        
        items.forEach((item, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.setAttribute('data-index', index);
            
            let imageSrc, title, caption, hasMultipleImages = false;
            
            if (isFromAPI) {
                imageSrc = item.fileData;
                title = item.title;
                caption = item.caption;
            } else {
                // Usar a primeira imagem como principal
                imageSrc = item.images[0].src;
                title = item.title;
                caption = item.caption;
                hasMultipleImages = item.images.length > 1;
            }
            
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
                        <span>${item.images.length}</span>
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
                        <button class="modal-action-btn download-btn" id="downloadBtn" title="Download">
                            <i class="fas fa-download"></i>
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
        modal.querySelector('#downloadBtn').addEventListener('click', downloadImage);
        
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
        
        if (isFromAPI) {
            // Para API, assumir que há apenas uma imagem por item
            currentImages = [{ src: item.fileData || '', alt: item.title || 'Imagem' }];
            currentImage = currentImages[0];
        } else {
            // Para dados estáticos, usar o array de imagens
            currentImages = item.images || [];
            if (imageIndex < 0 || imageIndex >= currentImages.length) {
                console.error('Índice de imagem inválido:', imageIndex);
                return;
            }
            currentImage = currentImages[imageIndex];
        }
        
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
        modalDate.textContent = item.date || new Date().toLocaleDateString('pt-BR');
        modalCategory.textContent = item.category || 'Galeria de Eventos';
        
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
        
        if (isFromAPI) {
            // Para API, assumir que há apenas uma imagem por item
            currentImages = [{ src: item.fileData, alt: item.title }];
        } else {
            // Para dados estáticos, usar o array de imagens
            currentImages = item.images;
        }
        
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
    
    function downloadImage() {
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalImage.src) {
            const link = document.createElement('a');
            link.href = modalImage.src;
            link.download = `${modalTitle.textContent || 'imagem'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            
            if (modal.isFromAPI) {
                currentImages = [{ src: item.fileData, alt: item.title }];
            } else {
                currentImages = item.images || [];
            }
            
            if (currentImages.length > 1 && typeof modal.currentImageIndex === 'number') {
                const newImageIndex = modal.currentImageIndex > 0 ? modal.currentImageIndex - 1 : currentImages.length - 1;
                showImageInModal(modal.currentItemIndex, newImageIndex, modal.items, modal.isFromAPI);
            }
        } else if (e.key === 'ArrowRight' && modal.items && typeof modal.currentItemIndex === 'number' && modal.currentItemIndex >= 0) {
            // Navegar entre imagens do item atual
            const item = modal.items[modal.currentItemIndex];
            if (!item) return;
            
            let currentImages;
            
            if (modal.isFromAPI) {
                currentImages = [{ src: item.fileData, alt: item.title }];
            } else {
                currentImages = item.images || [];
            }
            
            if (currentImages.length > 1 && typeof modal.currentImageIndex === 'number') {
                const newImageIndex = modal.currentImageIndex < currentImages.length - 1 ? modal.currentImageIndex + 1 : 0;
                showImageInModal(modal.currentItemIndex, newImageIndex, modal.items, modal.isFromAPI);
            }
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        } else if (e.key === 'd' || e.key === 'D') {
            downloadImage();
        }
    }
});