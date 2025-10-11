// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <p>${message}</p>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Fechar ao clicar no botão
    notification.querySelector('.close-btn').addEventListener('click', () => {
        if (notification.parentNode) {
            notification.remove();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('show');
            const isOpen = nav.classList.contains('show');
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    if (overlay && nav) {
        overlay.addEventListener('click', function() {
            if (nav.classList.contains('show')) {
                nav.classList.remove('show');
                if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // Navegação suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Fechar menu mobile se estiver aberto
            if (nav.classList.contains('show')) {
                nav.classList.remove('show');
                if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Formulário de contato
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obter dados do formulário
            const name = document.getElementById('name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Validação básica
            if (!name || !message) {
                showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            
            // Formatar mensagem para WhatsApp
            let whatsappMessage = `*Olá! Tenho interesse nos serviços da Nutt Festas*\n\n`;
            whatsappMessage += `*Nome:* ${name}\n`;
            
            if (phone) {
                whatsappMessage += `*Telefone:* ${phone}\n`;
            }
            
            whatsappMessage += `*Mensagem:* ${message}\n\n`;
            whatsappMessage += `_Mensagem enviada através do site_`;
            
            // Codificar mensagem para URL
            const encodedMessage = encodeURIComponent(whatsappMessage);
            
            // Número do WhatsApp (formato internacional sem + e espaços)
            const whatsappNumber = '5511950501260';
            
            // Criar URL do WhatsApp
            const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            
            // Abrir WhatsApp
            window.open(whatsappURL, '_blank');
            
            // Mostrar notificação de sucesso
            showNotification('Redirecionando para o WhatsApp...', 'success');
            
            // Limpar formulário após um pequeno delay
            setTimeout(() => {
                contactForm.reset();
            }, 1000);
        });
    }
    
    // Destacar item de menu ativo durante a rolagem
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav ul li a');
    
    function highlightNavLink() {
        const scrollPosition = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);
    
    // Inicializar o destaque do menu
    highlightNavLink();
});