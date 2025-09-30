/**
 * Configuração global de debug
 * Deve ser carregado antes de outros scripts
 */

// Verificar se já foi inicializado para evitar conflitos
if (typeof window.DebugConfig === 'undefined') {
    window.DebugConfig = {
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        
        // Funções de log condicionais
        log: function(...args) {
            if (this.isDevelopment) {
                console.log(...args);
            }
        },
        
        warn: function(...args) {
            if (this.isDevelopment) {
                console.warn(...args);
            }
        },
        
        error: function(...args) {
            if (this.isDevelopment) {
                console.error(...args);
            }
        }
    };
    
    // Funções globais para compatibilidade
    window.debugError = function(...args) {
        window.DebugConfig.error(...args);
    };
    
    window.debugLog = function(...args) {
        window.DebugConfig.log(...args);
    };
    
    window.debugWarn = function(...args) {
        window.DebugConfig.warn(...args);
    };
}