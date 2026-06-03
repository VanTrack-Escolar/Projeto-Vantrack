document.addEventListener('DOMContentLoaded', () => {
    const fL = document.getElementById('form-login-admin');
    if (fL) fL.addEventListener('submit', handleAdminLogin);

    // Toggle password visibility
    document.querySelectorAll('.toggle-senha').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
});

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !validarEmail(email)) {
        mostrarNotificacao('Email inválido', 'erro');
        return;
    }
    if (!senha || !validarSenha(senha).valido) {
        mostrarNotificacao('Senha inválida', 'erro');
        return;
    }

    const b = this.querySelector('button[type="submit"]');
    b.disabled = true;
    b.textContent = 'Autenticando...';

    try {
        const r = await fetchAPI('POST', CONFIG.ENDPOINTS.LOGIN, { email: email, senha: senha });
        if (r) {
            // Validar de imediato se o perfil retornado é de fato administrador
            const perfil = r.usuario ? r.usuario.tipo_perfil : null;
            if (perfil !== 'admin') {
                mostrarNotificacao('Acesso negado. Apenas administradores podem utilizar este portal.', 'erro');
                clearAuth();
                return;
            }

            // Verificar se requer 2FA
            if (r.requer_2fa && r.dois_fatores_id) {
                const dados2FA = {
                    dois_fatores_id: r.dois_fatores_id,
                    usuario_id: r.usuario_id,
                    metodo: r.metodo,
                    telefone_mascarado: r.telefone_mascarado,
                    email_mascarado: r.email_mascarado,
                    temp_token: r.temp_token,
                    usuario_dados: r.usuario
                };
                sessionStorage.setItem('dados_2fa', JSON.stringify(dados2FA));
                mostrarNotificacao('Autenticação em Dois Fatores exigida. Aguarde...', 'info', 1500);
                setTimeout(() => window.location.href = '/pages/2fa.html', 1000);
            } else if (r.token) {
                // Dispositivo conhecido - login normal
                setToken(r.token);
                setUser(r.usuario);
                mostrarNotificacao('Acesso Administrador Autorizado!', 'sucesso', 1500);
                setTimeout(() => {
                    window.location.href = '/pages/dashboard-admin.html';
                }, 1000);
            }
        }
    } catch (err) {
        mostrarNotificacao(err.message || 'Erro ao realizar login', 'erro');
    } finally {
        b.disabled = false;
        b.textContent = 'Entrar no Sistema';
    }
}
