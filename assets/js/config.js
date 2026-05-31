const CONFIG = {
    API_URL: 'http://localhost:5000/api',
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'usuario_dados',
    ENDPOINTS: {
        LOGIN: '/login',
        CADASTRO: '/cadastro'
    }
};
function setToken(token) { localStorage.setItem(CONFIG.TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(CONFIG.TOKEN_KEY); }
function setUser(user) { 
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user)); 
    if (user && user.id) {
        localStorage.setItem('usuario_id', user.id);
    }
}
function getUser() { const u = localStorage.getItem(CONFIG.USER_KEY); return u ? JSON.parse(u) : null; }
function clearAuth() { 
    localStorage.removeItem(CONFIG.TOKEN_KEY); 
    localStorage.removeItem(CONFIG.USER_KEY); 
    localStorage.removeItem('usuario_id');
}
function isAuthenticated() { return getToken() !== null && getUser() !== null; }
function requireAuth() { if (!isAuthenticated()) window.location.href = '/pages/index.html'; }
function temPerfil(perfil) { const u = getUser(); return u && u.tipo_perfil === perfil; }
function logout() { clearAuth(); window.location.href = '/pages/index.html'; }

async function fetchAPI(method, endpoint, data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
    if (data && (method === 'POST' || method === 'PUT')) options.body = JSON.stringify(data);
    const res = await fetch(`${CONFIG.API_URL}${endpoint}`, options);
    if (res.status === 401 && endpoint !== CONFIG.ENDPOINTS.LOGIN) {
        handleSessionExpired();
        return null;
    }
    const result = await res.json();
    if (!res.ok) throw new Error(result.erro || `Erro ${res.status}`);
    return result;
}

function handleSessionExpired() {
    clearAuth();
    mostrarNotificacao('Sua sessão expirou. Faça login novamente.', 'erro', 2000);
    setTimeout(() => {
        window.location.href = '/pages/index.html?session_expired=true';
    }, 500);
}

function mostrarNotificacao(msg, tipo = 'info', dur = 3000) {
    const c = document.getElementById('notificacoes') || (() => { const x = document.createElement('div'); x.id = 'notificacoes'; x.className = 'container-notificacoes'; document.body.insertBefore(x, document.body.firstChild); return x; })();
    const n = document.createElement('div');
    n.className = `notificacao notificacao-${tipo}`;
    
    // Clean message by removing any "Erro:", "Error:" or "Falha ao..." prefix
    let cleanMsg = msg.trim();
    cleanMsg = cleanMsg.replace(/^(erro|error|falha|fail|falha ao cadastrar usuário|erro ao cadastrar|erro ao realizar cadastro)[:\s\-\.]*/gi, '').trim();
    if (cleanMsg.length > 0) {
        cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
    } else {
        cleanMsg = tipo === 'erro' ? 'Ocorreu um erro inesperado.' : msg;
    }

    let iconClass = 'fas fa-info-circle';
    if (tipo === 'erro') iconClass = 'fas fa-exclamation-circle';
    else if (tipo === 'sucesso') iconClass = 'fas fa-check-circle';
    else if (tipo === 'aviso') iconClass = 'fas fa-exclamation-triangle';

    n.innerHTML = `<i class="${iconClass}" style="font-size: 16px; margin-right: 8px;"></i><span>${cleanMsg}</span>`;
    c.appendChild(n);
    if (dur > 0) setTimeout(() => n.remove(), dur);
}
