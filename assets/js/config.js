const CONFIG = {
    API_URL: 'http://localhost:5000/api',
    TOKEN_KEY: 'vantrack_token',
    USER_KEY: 'vantrack_user',
    ENDPOINTS: {
        LOGIN: '/login',
        CADASTRO: '/cadastro'
    }
};
function setToken(token) { localStorage.setItem(CONFIG.TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(CONFIG.TOKEN_KEY); }
function setUser(user) { localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user)); }
function getUser() { const u = localStorage.getItem(CONFIG.USER_KEY); return u ? JSON.parse(u) : null; }
function clearAuth() { localStorage.removeItem(CONFIG.TOKEN_KEY); localStorage.removeItem(CONFIG.USER_KEY); }
function isAuthenticated() { return getToken() !== null && getUser() !== null; }
function requireAuth() { if (!isAuthenticated()) window.location.href = '/pages/index.html'; }
function temPerfil(perfil) { const u = getUser(); return u && u.tipo_perfil === perfil; }
function logout() { clearAuth(); window.location.href = '/pages/index.html'; }

async function fetchAPI(method, endpoint, data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
    if (data && (method === 'POST' || method === 'PUT')) options.body = JSON.stringify(data);
    const res = await fetch(`${CONFIG.API_URL}${endpoint}`, options);
    if (res.status === 401) {
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
    n.innerHTML = `<span>${{sucesso:'✓',erro:'✕',aviso:'⚠',info:'ℹ'}[tipo]||'•'}</span><span>${msg}</span>`;
    c.appendChild(n);
    if (dur > 0) setTimeout(() => n.remove(), dur);
}
