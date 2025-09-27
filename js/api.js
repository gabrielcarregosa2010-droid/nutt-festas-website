// Configuração da API
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 30000 // 30 segundos para uploads grandes
};

// Classe para gerenciar a API
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.token = localStorage.getItem('authToken');
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      
      // Se token expirou, limpar e redirecionar para login
      if (error.message.includes('Token expirado') || error.message.includes('Token inválido')) {
        this.clearAuth();
        if (window.location.pathname.includes('admin')) {
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
    if (!health.success) {
      showNotification('Servidor indisponível. Algumas funcionalidades podem não funcionar.', 'error');
      return false;
    }
    return true;
  } catch (error) {
    showNotification('Não foi possível conectar ao servidor. Verifique sua conexão.', 'error');
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