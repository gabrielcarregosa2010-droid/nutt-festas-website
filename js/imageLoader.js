/**
 * Sistema Avançado de Carregamento de Imagens
 * Garante que as imagens carreguem corretamente em qualquer ambiente
 */

class ImageLoader {
    constructor() {
        this.imageCache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.apiBaseUrl = window.location.origin;
        this.init();
    }

    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadCriticalImages());
        } else {
            this.loadCriticalImages();
        }
    }

    /**
     * Carrega imagens críticas com fallback e retry
     */
    async loadCriticalImages() {
        const criticalImages = [
            { name: 'about', selector: '.about-image img', alt: 'Nutt Festas - Quem Somos', fallback: 'img/about.jpg?v=4' },
            { name: 'home', selector: '.hero-section', type: 'background', fallback: 'img/home.jpg?v=4' },
            { name: 'logo', selector: '.logo img', alt: 'Nutt Festas Logo', fallback: 'img/logo.png' }
        ];

        for (const imageConfig of criticalImages) {
            await this.loadImageFromAPI(imageConfig);
        }
    }

    /**
     * Carrega uma imagem da API com fallback
     */
    async loadImageFromAPI(imageConfig) {
        const element = document.querySelector(imageConfig.selector);
        if (!element) {
            console.warn(`Elemento não encontrado: ${imageConfig.selector}`);
            return;
        }

        // Adicionar classe de loading
        element.classList.add('loading');

        try {
            // Primeiro, tentar carregar da API
            const apiUrl = `${this.apiBaseUrl}/api/site-images/${imageConfig.name}`;
            const apiSuccess = await this.tryLoadImage(apiUrl, element, imageConfig);
            
            if (apiSuccess) {
                this.onImageLoad(element, imageConfig);
                return;
            }

            // Se a API falhar, usar fallback local
            console.log(`API falhou para ${imageConfig.name}, usando fallback local`);
            const fallbackSuccess = await this.tryLoadImage(imageConfig.fallback, element, imageConfig);
            
            if (fallbackSuccess) {
                this.onImageLoad(element, imageConfig);
                return;
            }

            // Se o fallback também falhar, tentar com cache busting
            const cacheBustSrc = this.addCacheBuster(imageConfig.fallback);
            const retrySuccess = await this.tryLoadImage(cacheBustSrc, element, imageConfig);
            
            if (retrySuccess) {
                this.onImageLoad(element, imageConfig);
                return;
            }

            // Se tudo falhar, mostrar erro
            this.onImageError(element, imageConfig);

        } catch (error) {
            console.error(`Erro ao carregar imagem ${imageConfig.name}:`, error);
            this.onImageError(element, imageConfig);
        }
    }

    /**
     * Carrega uma imagem com sistema de fallback
     */
    async loadImageWithFallback(imageConfig) {
        const element = document.querySelector(imageConfig.selector);
        if (!element) {
            console.warn(`Elemento não encontrado: ${imageConfig.selector}`);
            return;
        }

        // Adicionar classe de loading
        element.classList.add('loading');

        try {
            // Tentar carregar a imagem principal
            const success = await this.tryLoadImage(imageConfig.src, element, imageConfig);
            
            if (success) {
                this.onImageLoad(element, imageConfig);
                return;
            }

            // Se falhar, tentar com cache busting
            const cacheBustSrc = this.addCacheBuster(imageConfig.src);
            const retrySuccess = await this.tryLoadImage(cacheBustSrc, element, imageConfig);
            
            if (retrySuccess) {
                this.onImageLoad(element, imageConfig);
                return;
            }

            // Se ainda falhar, usar fallback
            this.onImageError(element, imageConfig);

        } catch (error) {
            console.error(`Erro ao carregar imagem ${imageConfig.src}:`, error);
            this.onImageError(element, imageConfig);
        }
    }

    /**
     * Tenta carregar uma imagem
     */
    async tryLoadImage(src, element, imageConfig) {
        try {
            await this.preloadImage(src);
            this.applyImage(imageConfig.selector || element.id, src, imageConfig.alt, imageConfig.type);
            return true;
        } catch (error) {
            console.warn(`Falha ao carregar imagem: ${src}`, error);
            return false;
        }
    }

    /**
     * Callback quando imagem carrega com sucesso
     */
    onImageLoad(element, imageConfig) {
        element.classList.remove('loading');
        element.classList.add('image-loaded');
        console.log(`Imagem carregada com sucesso: ${imageConfig.name || imageConfig.src}`);
    }

    /**
     * Callback quando imagem falha ao carregar
     */
    onImageError(element, imageConfig) {
        element.classList.remove('loading');
        element.classList.add('image-error');
        
        // Aplica fallback
        if (imageConfig.type === 'background') {
            element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">
                        Imagem não disponível
                    </text>
                </svg>
            `)}`;
            element.src = placeholderSvg;
        }
        
        console.error(`Erro ao carregar imagem: ${imageConfig.name || imageConfig.src}`);
    }

    /**
     * Precarrega uma imagem
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            // Verifica cache
            if (this.imageCache.has(src)) {
                resolve(this.imageCache.get(src));
                return;
            }

            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Falha ao carregar: ${src}`));
            };
            
            // Timeout de 10 segundos
            setTimeout(() => {
                reject(new Error(`Timeout ao carregar: ${src}`));
            }, 10000);
            
            img.src = src;
        });
    }

    /**
     * Aplica a imagem ao elemento
     */
    applyImage(selector, src, alt, type) {
        const element = document.querySelector(selector);
        if (!element) return;

        if (type === 'background') {
            element.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${src}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center center';
            element.style.backgroundRepeat = 'no-repeat';
        } else {
            element.src = src;
            if (alt) element.alt = alt;
        }

        // Adiciona classe para indicar carregamento bem-sucedido
        element.classList.add('image-loaded');
    }

    /**
     * Tenta versões alternativas da imagem
     */
    async tryAlternativeVersions(config) {
        const { selector, src, alt, type } = config;
        const baseSrc = src.split('?')[0]; // Remove query string
        
        const alternatives = [
            `${baseSrc}?v=3`,
            `${baseSrc}?v=2`,
            `${baseSrc}?v=1`,
            baseSrc,
            `${baseSrc}?t=${Date.now()}` // Cache busting com timestamp
        ];

        for (const altSrc of alternatives) {
            try {
                await this.preloadImage(altSrc);
                this.applyImage(selector, altSrc, alt, type);
                console.log(`Imagem carregada com versão alternativa: ${altSrc}`);
                return;
            } catch (error) {
                console.warn(`Versão alternativa falhou: ${altSrc}`);
            }
        }

        // Se todas as versões falharam, aplica fallback
        this.applyFallback(selector, type);
    }

    /**
     * Aplica fallback quando todas as tentativas falharam
     */
    applyFallback(selector, type) {
        const element = document.querySelector(selector);
        if (!element) return;

        if (type === 'background') {
            // Fallback para background: gradiente sólido
            element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            // Fallback para img: placeholder SVG
            const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">
                        Imagem não disponível
                    </text>
                </svg>
            `)}`;
            element.src = placeholderSvg;
        }

        element.classList.add('image-fallback');
        console.warn(`Aplicado fallback para: ${selector}`);
    }

    /**
     * Força recarregamento de uma imagem específica
     */
    async reloadImage(selector, src) {
        const timestamp = Date.now();
        const newSrc = `${src.split('?')[0]}?t=${timestamp}`;
        
        try {
            await this.preloadImage(newSrc);
            this.applyImage(selector, newSrc);
            return true;
        } catch (error) {
            console.error(`Falha ao recarregar imagem: ${src}`, error);
            return false;
        }
    }
}

// Inicializa o carregador de imagens
const imageLoader = new ImageLoader();

// Expõe globalmente para debug
window.imageLoader = imageLoader;