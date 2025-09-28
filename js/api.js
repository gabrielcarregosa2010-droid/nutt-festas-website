// Configuração da API - usa a configuração dinâmica do config.js
const API_SETTINGS = {
    baseURL: API_BASE_URL,
    timeout: 30000 // 30 segundos para uploads grandes
};

// Classe para gerenciar a API
class ApiService {
  constructor() {
    this.baseURL = API_SETTINGS.baseURL;
    this.token = localStorage.getItem('authToken');
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Log detalhado da requisição
    console.log('🔄 API Request:', {
      url,
      method: options.method || 'GET',
      endpoint,
      baseURL: this.baseURL,
      hasToken: !!this.token,
      timestamp: new Date().toISOString()
    });
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Adicionar token de autenticação se disponível
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Log da resposta
      console.log('📥 API Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        timestamp: new Date().toISOString()
      });
      
      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ API Response is not JSON:', {
          url,
          status: response.status,
          contentType,
          responseText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
        throw new Error(`Servidor retornou ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error Response:', {
          url,
          status: response.status,
          data,
          timestamp: new Date().toISOString()
        });
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

      console.log('✅ API Success:', {
        url,
        success: data.success,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('💥 API Request Failed:', {
        url,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Se token expirou ou é antigo, limpar e redirecionar para login
      if (error.message.includes('Token expirado') || 
          error.message.includes('Token inválido') || 
          error.message.includes('faça login novamente')) {
        console.log('🔄 Token expirado/inválido - fazendo logout automático');
        this.clearAuth();
        if (window.location.pathname.includes('admin') && !window.location.pathname.includes('login')) {
          window.location.href = '/admin/login.html';
        }
      }
      
      throw error;
    }
  }

  // Métodos de autenticação
  async login(username, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (response.success) {
        this.token = response.data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Métodos da galeria
  async getGalleryItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/gallery${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getGalleryItem(id) {
    return await this.request(`/gallery/${id}`);
  }

  async createGalleryItem(itemData) {
    return await this.request('/gallery', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateGalleryItem(id, itemData) {
    return await this.request(`/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  }

  async deleteGalleryItem(id) {
    return await this.request(`/gallery/${id}`, {
      method: 'DELETE'
    });
  }

  // Método para verificar se está autenticado
  isAuthenticated() {
    return !!this.token;
  }

  // Método para obter dados do usuário
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Método para verificar saúde da API
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('API não está respondendo:', error);
      return { success: false, message: 'API indisponível' };
    }
  }
}

// Instância global da API
const api = new ApiService();

// Função para mostrar notificações de erro da API
function showApiError(error, defaultMessage = 'Erro na operação') {
  const message = error.message || defaultMessage;
  showNotification(message, 'error');
}

// Função para verificar conectividade com a API
async function checkApiConnection() {
  try {
    const health = await api.healthCheck();
    if (!health || !health.success) {
      console.warn('⚠️ API Health Check falhou:', health);
      showNotification('Servidor indisponível. Algumas funcionalidades podem não funcionar.', 'error');
      return false;
    }
    console.log('✅ API conectada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação de conectividade:', error);
    // Só mostrar notificação se for um erro real de rede
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      showNotification('Não foi possível conectar ao servidor. Verifique sua conexão.', 'error');
    }
    return false;
  }
}

// Verificar conexão ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  // Só verificar se estiver na área admin
  if (window.location.pathname.includes('admin')) {
    checkApiConnection();
  }
});

// Exportar para uso global
window.api = api;
window.showApiError = showApiError;
window.checkApiConnection = checkApiConnection;