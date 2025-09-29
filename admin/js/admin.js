// Variáveis globais para gerenciamento da galeria
let galleryItems = [];
let currentItemId = null;
let fileData = null;
let isLoading = false;

// Elementos DOM
const itemModal = document.getElementById('itemModal');
const deleteModal = document.getElementById('deleteModal');
const itemForm = document.getElementById('itemForm');
const galleryContainer = document.getElementById('galleryItems');
const addItemBtn = document.getElementById('addItemBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const modalTitle = document.getElementById('modalTitle');
const dropArea = document.getElementById('dropArea');
const fileUpload = document.getElementById('fileUpload');
const filePreview = document.getElementById('filePreview');
const fileError = document.getElementById('fileError');

// Inicializar
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Carregar itens da galeria
    await loadGalleryItems();
    
    // Configurar eventos
    addItemBtn.addEventListener('click', openAddItemModal);
    cancelBtn.addEventListener('click', closeItemModal);
    itemForm.addEventListener('submit', saveItem);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteItem);
    
    // Fechar modal ao clicar no X
    document.querySelector('.close-modal').addEventListener('click', closeItemModal);
    
    // Configurar upload de arquivos
    setupFileUpload();
});

// Carregar itens da galeria via API
async function loadGalleryItems() {
    if (isLoading) return;
    
    isLoading = true;
    galleryContainer.innerHTML = '<p class="loading-message">Carregando itens da galeria...</p>';
    
    try {
        const response = await api.getGalleryItems({ sortBy: 'createdAt', sortOrder: 'desc' });
        
        if (response.success) {
            galleryItems = response.data;
            renderGalleryItems();
        } else {
            throw new Error(response.message || 'Erro ao carregar itens');
        }
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        galleryContainer.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar itens da galeria: ${error.message}</p>
                <button onclick="loadGalleryItems()" class="retry-btn">Tentar novamente</button>
            </div>
        `;
        showNotification('Erro ao carregar galeria: ' + error.message, 'error');
    } finally {
        isLoading = false;
    }
}

// Renderizar itens da galeria
function renderGalleryItems() {
    if (galleryItems.length === 0) {
        galleryContainer.innerHTML = '<p class="loading-message">Nenhum item encontrado. Adicione novos itens à galeria.</p>';
        return;
    }
    
    galleryContainer.innerHTML = '';
    
    galleryItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'gallery-item-admin';
        
        // Determinar se é imagem ou vídeo
        let mediaElement = '';
        
        // Verificar se tem fileData (item único) ou images (múltiplas imagens)
        if (item.fileData && item.fileType) {
            // Item com arquivo único
            if (item.fileType.startsWith('image/')) {
                mediaElement = `<img src="${item.fileData}" alt="${item.title}">`;
            } else if (item.fileType.startsWith('video/')) {
                mediaElement = `<video controls><source src="${item.fileData}" type="${item.fileType}"></video>`;
            }
        } else if (item.images && item.images.length > 0) {
            // Item com múltiplas imagens - mostrar a primeira como thumbnail
            const firstImage = item.images[0];
            mediaElement = `
                <div class="gallery-thumbnail">
                    <img src="${firstImage.src}" alt="${firstImage.alt}">
                    ${item.images.length > 1 ? `<span class="image-count">${item.images.length} fotos</span>` : ''}
                </div>
            `;
        }
        
        itemElement.innerHTML = `
            ${mediaElement}
            <div class="content">
                <h3>${item.title}</h3>
                <p>${item.caption}</p>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        
        galleryContainer.appendChild(itemElement);
    });
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditItemModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
}

// Abrir modal para adicionar item
function openAddItemModal() {
    modalTitle.textContent = 'Adicionar Novo Item';
    itemForm.reset();
    filePreview.innerHTML = '';
    filePreview.style.display = 'none';
    fileError.style.display = 'none';
    currentItemId = null;
    fileData = null;
    itemModal.style.display = 'block';
}

// Abrir modal para editar item
function openEditItemModal(id) {
    const item = galleryItems.find(item => item.id === id);
    if (!item) return;
    
    modalTitle.textContent = 'Editar Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('title').value = item.title;
    document.getElementById('caption').value = item.caption;
    
    // Mostrar preview do arquivo
    filePreview.innerHTML = '';
    filePreview.style.display = 'block';
    
    // Verificar se tem fileData (item único) ou images (múltiplas imagens)
    if (item.fileData && item.fileType) {
        // Item com arquivo único
        if (item.fileType.startsWith('image/')) {
            filePreview.innerHTML = `<img src="${item.fileData}" alt="${item.title}">`;
        } else if (item.fileType.startsWith('video/')) {
            filePreview.innerHTML = `<video controls><source src="${item.fileData}" type="${item.fileType}"></video>`;
        }
        
        fileData = {
            data: item.fileData,
            type: item.fileType
        };
    } else if (item.images && item.images.length > 0) {
        // Item com múltiplas imagens - mostrar todas as imagens
        const imagesHtml = item.images.map((img, index) => 
            `<div class="image-preview-item">
                <img src="${img.src}" alt="${img.alt}">
                <p>Imagem ${index + 1}: ${img.alt}</p>
            </div>`
        ).join('');
        
        filePreview.innerHTML = `
            <div class="multiple-images-preview">
                <p><strong>${item.images.length} imagens neste item:</strong></p>
                <div class="images-grid">${imagesHtml}</div>
                <p><em>Nota: Para editar as imagens, você precisará excluir e recriar o item.</em></p>
            </div>
        `;
        
        // Para itens com múltiplas imagens, não definimos fileData
        fileData = null;
    }
    
    currentItemId = item.id;
    itemModal.style.display = 'block';
}

// Fechar modal de item
function closeItemModal() {
    itemModal.style.display = 'none';
}

// Abrir modal de confirmação de exclusão
function openDeleteModal(id) {
    currentItemId = id;
    deleteModal.style.display = 'block';
}

// Fechar modal de confirmação de exclusão
function closeDeleteModal() {
    deleteModal.style.display = 'none';
}

// Salvar item (adicionar ou editar)
async function saveItem(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const caption = document.getElementById('caption').value.trim();
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validar campos obrigatórios
    if (!title || !caption) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Validar se há um arquivo para novos itens
    if (!fileData && !currentItemId) {
        fileError.textContent = 'Por favor, selecione um arquivo de imagem ou vídeo.';
        fileError.style.display = 'block';
        return;
    }
    
    // Desabilitar botão durante o salvamento
    submitButton.disabled = true;
    submitButton.textContent = currentItemId ? 'Atualizando...' : 'Salvando...';
    
    try {
        let response;
        
        if (currentItemId) {
            // Editar item existente
            const updateData = { title, caption };
            
            // Se um novo arquivo foi selecionado, incluir nos dados
            if (fileData && fileData.data) {
                updateData.fileData = fileData.data;
                updateData.fileType = fileData.type;
            }
            
            response = await api.updateGalleryItem(currentItemId, updateData);
        } else {
            // Adicionar novo item
            const newItemData = {
                title,
                caption,
                fileData: fileData.data,
                fileType: fileData.type
            };
            
            response = await api.createGalleryItem(newItemData);
        }
        
        if (response.success) {
            // Recarregar a galeria
            await loadGalleryItems();
            
            // Fechar o modal
            closeItemModal();
            
            // Mostrar mensagem de sucesso
            showNotification(
                currentItemId ? 'Item atualizado com sucesso!' : 'Item adicionado com sucesso!', 
                'success'
            );
        } else {
            throw new Error(response.message || 'Erro ao salvar item');
        }
        
    } catch (error) {
        console.error('Erro ao salvar item:', error);
        showNotification('Erro ao salvar: ' + error.message, 'error');
    } finally {
        // Reabilitar botão
        submitButton.disabled = false;
        submitButton.textContent = currentItemId ? 'Atualizar' : 'Salvar';
    }
}

// Excluir item
async function deleteItem() {
    if (!currentItemId) return;
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Desabilitar botão durante a exclusão
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Excluindo...';
    
    try {
        const response = await api.deleteGalleryItem(currentItemId);
        
        if (response.success) {
            // Recarregar a galeria
            await loadGalleryItems();
            
            // Fechar o modal
            closeDeleteModal();
            
            // Mostrar mensagem de sucesso
            showNotification('Item excluído com sucesso!', 'success');
        } else {
            throw new Error(response.message || 'Erro ao excluir item');
        }
    } catch (error) {
        console.error('Erro ao excluir item:', error);
        showNotification('Erro ao excluir: ' + error.message, 'error');
    } finally {
        // Reabilitar botão
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Confirmar';
    }
}

// Configurar upload de arquivos
function setupFileUpload() {
    // Evento de clique no dropArea
    dropArea.addEventListener('click', () => {
        fileUpload.click();
    });
    
    // Eventos de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // Processar arquivo quando for solto
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Processar arquivo quando for selecionado
    fileUpload.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // Processar arquivos
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validar tipo de arquivo
        if (!file.type.match('image.*') && !file.type.match('video.*')) {
            fileError.textContent = 'Por favor, selecione um arquivo de imagem ou vídeo.';
            fileError.style.display = 'block';
            return;
        }
        
        // Validar tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            fileError.textContent = 'O arquivo é muito grande. O tamanho máximo é 5MB.';
            fileError.style.display = 'block';
            return;
        }
        
        // Limpar mensagens de erro
        fileError.style.display = 'none';
        
        // Ler o arquivo
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Armazenar dados do arquivo
            fileData = {
                data: e.target.result,
                type: file.type
            };
            
            // Mostrar preview
            filePreview.innerHTML = '';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                filePreview.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.controls = true;
                const source = document.createElement('source');
                source.src = e.target.result;
                source.type = file.type;
                video.appendChild(source);
                filePreview.appendChild(video);
            }
            
            filePreview.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }
}

// Mostrar notificação
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Adicionar estilos para notificações
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s;
    }
    
    .notification.success {
        background-color: var(--success-color);
    }
    
    .notification.error {
        background-color: var(--danger-color);
    }
    
    .notification.hide {
        opacity: 0;
    }
    
    .highlight {
        background-color: rgba(255, 182, 193, 0.2);
    }
`;

document.head.appendChild(style);