/**
 * Sistema Avançado de Carregamento de Imagens
 * Garante que as imagens carreguem corretamente em qualquer ambiente
 */

class ImageLoader {
    constructor() {
        this.imageCache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
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
            { selector: '.about-image img', src: 'img/about.jpg?v=4', alt: 'Nutt Festas - Quem Somos' },
            { selector: '.hero-section', type: 'background', src: 'img/home.jpg?v=4' },
            { selector: '.logo img', src: 'img/logo.png', alt: 'Nutt Festas Logo' }
        ];

        for (const imageConfig of criticalImages) {
            await this.loadImageWithFallback(imageConfig);
        }
    }

    /**
     * Carrega uma imagem com sistema de fallback
     */
    async loadImageWithFallback(config) {
        const { selector, src, alt, type = 'img' } = config;
        
        try {
            // Tenta carregar a imagem
            await this.preloadImage(src);
            
            // Se sucesso, aplica a imagem
            this.applyImage(selector, src, alt, type);
            
        } catch (error) {
            console.warn(`Falha ao carregar imagem: ${src}`, error);
            
            // Tenta versões alternativas
            await this.tryAlternativeVersions(config);
        }
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