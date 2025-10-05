// Usar configuração global de debug diretamente

// Variáveis globais para gerenciamento da galeria
let galleryItems = [];
let currentItemId = null;
let selectedFiles = []; // Array to store multiple files
let maxFiles = 3; // Máximo de novas imagens por vez
let isLoading = false;
let originalImagesSnapshot = []; // Mantém referência das imagens originais para comparação

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
        
        console.log('Response completa:', response);
        console.log('response.data:', response.data);
        console.log('response.data.items:', response.data?.items);
        console.log('Tipo de response.data.items:', typeof response.data?.items);
        
        if (response.success) {
            // Garantir que sempre temos um array
            const items = response.data?.items;
            galleryItems = Array.isArray(items) ? items : [];
            
            console.log('galleryItems após atribuição:', galleryItems);
            console.log('Tipo de galleryItems:', typeof galleryItems);
            console.log('É array?', Array.isArray(galleryItems));
            console.log('Quantidade de itens:', galleryItems.length);
            
            renderGalleryItems();
        } else {
            throw new Error(response.message || 'Erro ao carregar itens');
        }
    } catch (error) {
        window.DebugConfig.error('Erro ao carregar galeria:', error);
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
    console.log('renderGalleryItems chamada');
    console.log('galleryItems na renderização:', galleryItems);
    console.log('Tipo de galleryItems na renderização:', typeof galleryItems);
    console.log('É array na renderização?', Array.isArray(galleryItems));
    
    // Garantir que galleryItems é sempre um array
    if (!Array.isArray(galleryItems)) {
        console.error('galleryItems não é um array! Valor:', galleryItems);
        galleryItems = [];
    }
    
    if (galleryItems.length === 0) {
        galleryContainer.innerHTML = '<p class="loading-message">Nenhum item encontrado. Adicione novos itens à galeria.</p>';
        return;
    }
    
    galleryContainer.innerHTML = '';
    
    console.log('Tentando fazer forEach...');
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
        
        // Formatar data para exibição
        const displayDate = item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Data não definida';
        const categoryDisplay = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Geral';
        const statusClass = item.isActive !== false ? 'active' : 'inactive';
        const statusText = item.isActive !== false ? 'Ativo' : 'Inativo';
        
        itemElement.innerHTML = `
            ${mediaElement}
            <div class="content">
                <h3>${item.title}</h3>
                <p>${item.caption}</p>
                <div class="item-metadata">
                    <span class="metadata-item"><i class="fas fa-tag"></i> ${categoryDisplay}</span>
                    <span class="metadata-item"><i class="fas fa-calendar"></i> ${displayDate}</span>
                    <span class="metadata-item status ${statusClass}"><i class="fas fa-circle"></i> ${statusText}</span>
                </div>
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
    
    // Definir valores padrão para novos itens
    document.getElementById('category').value = 'geral';
    document.getElementById('isActive').checked = true;
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    
    currentItemId = null;
    selectedFiles = [];
    originalImagesSnapshot = [];
    itemModal.style.display = 'block';
}

// Abrir modal para editar item
function openEditItemModal(id) {
    const item = galleryItems.find(item => item.id === id);
    if (!item) {
        showNotification('Item não encontrado', 'error');
        return;
    }
    
    modalTitle.textContent = 'Editar Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('title').value = item.title;
    document.getElementById('caption').value = item.caption;
    document.getElementById('category').value = item.category || 'geral';
    document.getElementById('isActive').checked = item.isActive !== false;
    
    // Formatar data para o input date
    if (item.date) {
        const date = new Date(item.date);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('eventDate').value = formattedDate;
    } else {
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    }
    
    // Limpar arquivos selecionados
    selectedFiles = [];
    originalImagesSnapshot = [];
    
    console.log('🔍 DEBUG - Abrindo edição do item:', item.id);
    console.log('🔍 DEBUG - item.images:', item.images);
    console.log('🔍 DEBUG - item.fileData:', item.fileData ? 'existe' : 'não existe');
    
    // Carregar imagens existentes se houver
    if (item.images && item.images.length > 0) {
        console.log('🔍 DEBUG - Carregando', item.images.length, 'imagens existentes');
        // Converter imagens existentes para o formato de selectedFiles
        selectedFiles = item.images.map((img, index) => ({
            data: img.src, // Usar 'src' que é a propriedade correta no banco
            type: 'image/jpeg', // Assumir JPEG se não especificado
            name: img.alt || `Imagem ${index + 1}`,
            size: 0, // Tamanho não disponível para imagens existentes
            id: `existing_${item.id}_${index}_${Date.now()}`, // ID mais único
            isExisting: true
        }));
        // Snapshot das imagens originais para comparação na hora de salvar
        originalImagesSnapshot = item.images.map(img => img.src);
        
        console.log('🔍 DEBUG - selectedFiles após carregar imagens:', selectedFiles.length);
        updateFilePreview();
    } else if (item.fileData && item.fileType) {
        console.log('🔍 DEBUG - Carregando imagem no formato antigo');
        // Compatibilidade com formato antigo (uma única imagem)
        selectedFiles = [{
            data: item.fileData,
            type: item.fileType,
            name: 'Imagem existente',
            size: 0,
            id: `existing_single_${item.id}_${Date.now()}`, // ID mais único
            isExisting: true
        }];
        // Snapshot com a imagem única original
        originalImagesSnapshot = [item.fileData];
        
        console.log('🔍 DEBUG - selectedFiles após carregar formato antigo:', selectedFiles.length);
        updateFilePreview();
    } else {
        console.log('🔍 DEBUG - Nenhuma imagem encontrada para carregar');
        filePreview.style.display = 'none';
    }
    
    currentItemId = item.id;
    itemModal.style.display = 'block';
}

// Fechar modal de item
function closeItemModal() {
    itemModal.style.display = 'none';
    selectedFiles = [];
    filePreview.style.display = 'none';
    fileError.style.display = 'none';
    originalImagesSnapshot = [];
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
    const category = document.getElementById('category').value;
    const eventDate = document.getElementById('eventDate').value;
    const isActive = document.getElementById('isActive').checked;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validar campos obrigatórios
    if (!title || !caption || !category || !eventDate) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Validar se há imagens selecionadas para novos itens
    if (!currentItemId && selectedFiles.length === 0) {
        showNotification('Por favor, selecione pelo menos uma imagem para o item.', 'error');
        return;
    }
    
    // Desabilitar botão durante o salvamento
    submitButton.disabled = true;
    submitButton.textContent = currentItemId ? 'Atualizando...' : 'Salvando...';
    
    try {
        let response;
        
        if (currentItemId) {
            // Editar item existente
            const updateData = { 
                title, 
                caption, 
                category, 
                date: eventDate, 
                isActive 
            };
            
            console.log('🔍 DEBUG - Editando item:', currentItemId);
            console.log('🔍 DEBUG - selectedFiles.length:', selectedFiles.length);
            console.log('🔍 DEBUG - selectedFiles:', selectedFiles);
            
            // Enviar imagens apenas quando houver alterações para evitar 413 (payload muito grande)
            if (selectedFiles.length === 0) {
                // Limpeza explícita de imagens
                updateData.images = [];
                console.log('🔍 DEBUG - Enviando array vazio para limpar imagens');
            } else {
                const hasNewImages = selectedFiles.some(f => !f.isExisting);
                const selectedExistingSrcs = selectedFiles
                    .filter(f => f.isExisting)
                    .map(f => f.data);
                const sameAsOriginal = !hasNewImages
                    && selectedExistingSrcs.length === originalImagesSnapshot.length
                    && selectedExistingSrcs.every(src => originalImagesSnapshot.includes(src));

                if (sameAsOriginal) {
                    // Não enviar campo images para preservar as existentes no backend
                    console.log('🔍 DEBUG - Preservando imagens existentes; não enviando payload de imagens');
                } else {
                    // Há alterações: novas imagens ou remoções; enviar conjunto atual
                    updateData.images = selectedFiles.map(file => ({
                        data: file.data,
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        isExisting: file.isExisting || false
                    }));
                    console.log('🔍 DEBUG - updateData.images:', updateData.images.length, 'imagens (alteradas)');
                }
            }
            
            response = await api.updateGalleryItem(currentItemId, updateData);
        } else {
            // Adicionar novo item
            const newItemData = {
                title,
                caption,
                category,
                date: eventDate,
                isActive,
                images: selectedFiles.map(file => ({
                    data: file.data,
                    type: file.type,
                    name: file.name,
                    size: file.size
                }))
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
        debugError('Erro ao salvar item:', error);
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
        debugError('Erro ao excluir item:', error);
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
        document.body.addEventListener(eventName, preventDefaults, false);
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
        
        // Limite conta apenas novas imagens nesta sessão (não conta imagens existentes carregadas)
        const newSelectedCount = selectedFiles.filter(f => !f.isExisting).length;
        const incomingCount = files.length;
        if (newSelectedCount + incomingCount > maxFiles) {
            const available = Math.max(0, maxFiles - newSelectedCount);
            fileError.textContent = `Você pode selecionar no máximo ${maxFiles} novas imagem(ns) por vez. Você ainda pode adicionar ${available} imagem(ns).`;
            fileError.style.display = 'block';
            return;
        }
        
        // Processar cada arquivo
        Array.from(files).forEach(file => {
            // Validar tipo de arquivo (apenas imagens agora)
            if (!file.type.startsWith('image/')) {
                fileError.textContent = 'Por favor, selecione apenas arquivos de imagem (JPG, JPEG, PNG, GIF, WebP).';
                fileError.style.display = 'block';
                return;
            }
            
            // Validar tamanho do arquivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                fileError.textContent = 'Cada imagem deve ter no máximo 5MB.';
                fileError.style.display = 'block';
                return;
            }
            
            // Ler o arquivo
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const fileObj = {
                    data: e.target.result,
                    type: file.type,
                    name: file.name,
                    size: file.size,
                    id: String(Date.now() + Math.random()) // ID único para cada arquivo (string)
                };
                
                selectedFiles.push(fileObj);
                updateFilePreview();
                fileError.style.display = 'none';
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// Função para remover um arquivo da seleção
function removeFile(fileId) {
    const idStr = String(fileId);
    selectedFiles = selectedFiles.filter(file => String(file.id) !== idStr);
    updateFilePreview();
}

// Função auxiliar para formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Atualizar a função de preview de arquivos
function updateFilePreview() {
    if (selectedFiles.length === 0) {
        filePreview.style.display = 'none';
        return;
    }
    
    filePreview.style.display = 'block';
    
    let previewHTML = '<div class="multiple-images-grid">';
    
    selectedFiles.forEach((file, index) => {
        previewHTML += `
            <div class="image-preview-item" data-file-id="${file.id}">
                <img src="${file.data}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" data-file-id="${file.id}" title="Remover imagem">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-info">
                    ${file.name}<br>
                    <small>${formatFileSize(file.size)}</small>
                </div>
            </div>
        `;
    });
    
    previewHTML += '</div>';
    
    {
        const newSelectedCount = selectedFiles.filter(f => !f.isExisting).length;
        const remaining = Math.max(0, maxFiles - newSelectedCount);
        if (remaining > 0) {
            previewHTML += `<p style="text-align: center; color: #666; margin-top: 1rem; font-size: 0.9rem;">
                Você pode adicionar mais ${remaining} nova(s) imagem(ns) nesta edição
            </p>`;
        }
    }
    
    filePreview.innerHTML = previewHTML;
    
    // Anexar event listeners aos botões de remoção
    const removeButtons = filePreview.querySelectorAll('.remove-image');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const fileId = this.getAttribute('data-file-id');
            removeFile(fileId);
        });
    });
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