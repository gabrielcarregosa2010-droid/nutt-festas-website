// Verificar se o usuário está logado
function checkAuth() {
    // Não verificar na página de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Redirecionar para a página de login
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar se o token ainda é válido
    api.getMe().catch(() => {
        // Token inválido ou expirado
        api.clearAuth();
        window.location.href = 'login.html';
    });
}

// Processar o formulário de login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validação básica
    if (!username || !password) {
        showLoginMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Desabilitar botão e mostrar loading
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';
    loginMessage.style.display = 'none';
    
    try {
        const response = await api.login(username, password);
        
        if (response.success) {
            showLoginMessage('Login realizado com sucesso!', 'success');
            
            // Aguardar um pouco para mostrar a mensagem de sucesso
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showLoginMessage(response.message || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showLoginMessage(error.message || 'Erro ao conectar com o servidor', 'error');
    } finally {
        // Reabilitar botão
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
    }
}

// Função para mostrar mensagens de login
function showLoginMessage(message, type) {
    const loginMessage = document.getElementById('loginMessage');
    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
    loginMessage.style.display = 'block';
    
    // Esconder mensagem após 5 segundos se for de sucesso
    if (type === 'success') {
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 5000);
    }
}

// Processar logout
async function handleLogout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Erro no logout:', error);
    } finally {
        window.location.href = 'login.html';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Configurar formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Configurar botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});