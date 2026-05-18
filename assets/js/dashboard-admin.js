document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    const token = localStorage.getItem('auth_token');
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados'));

    if (!token || !usuarioDados) {
        window.location.href = '/pages/index.html';
        return;
    }

    // Verificar se é realmente um administrador
    if (usuarioDados.tipo_perfil !== 'admin') {
        alert('Acesso restrito a administradores.');
        window.location.href = '/pages/index.html';
        return;
    }

    // Configurar Navegação SPA
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.dashboard-section');
    const pageTitle = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetMenu = item.getAttribute('data-menu');

            // Atualizar navegação
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');

            // Atualizar seções
            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(`${targetMenu}-section`);
            if(targetSection) targetSection.classList.add('active');

            // Atualizar título
            pageTitle.textContent = item.querySelector('span').textContent;
        });
    });

    // Configurar Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/pages/index.html';
    });

    // Aqui poderão ser implementadas chamadas à API: GET /api/admin/usuarios, etc.
    // Exemplo: carregarUsuariosAdmin();
});
