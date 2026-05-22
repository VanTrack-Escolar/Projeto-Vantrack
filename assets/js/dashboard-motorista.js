let usuarioAtual = {
  id: null,
  tipo_perfil: null,
  nome: null,
  email: null
};

const menuItems = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.dashboard-section');
const logoutBtn = document.getElementById('logout-btn');

function validarSessao() {
  const token = localStorage.getItem('auth_token');
  const usuario = localStorage.getItem('usuario_dados');
  
  console.log('[SESSÃO DEBUG] Validando sessão no dashboard do Motorista...');
  console.log('[SESSÃO DEBUG] auth_token:', token ? `PRESENTE (${token.substring(0, 15)}...)` : 'AUSENTE (null)');
  console.log('[SESSÃO DEBUG] usuario_dados:', usuario ? usuario : 'AUSENTE (null)');
  
  if (!token || !usuario) {
    console.warn('[SESSÃO DEBUG] Validação falhou! Redirecionando para login...');
    const report = {
      token: token ? "PRESENTE" : "AUSENTE",
      usuario: usuario ? "PRESENTE" : "AUSENTE",
      localStorageKeys: Object.keys(localStorage)
    };
    localStorage.setItem('sessao_debug_report', JSON.stringify(report));
    clearAuth();
    window.location.href = '/pages/index.html?session_expired=true';
    return false;
  }
  console.log('[SESSÃO DEBUG] Validação OK! Usuário autenticado.');
  return true;
}

function carregarDadosUsuario() {
  if (!validarSessao()) return;

  const usuarioJSON = localStorage.getItem('usuario_dados');
  if (usuarioJSON) {
    usuarioAtual = JSON.parse(usuarioJSON);
    document.getElementById('motorista-nome').textContent = usuarioAtual.nome;
    document.getElementById('profile-name').textContent = usuarioAtual.nome;
    
    // Preencher dados na tela de Perfil
    const elPerfilNome = document.getElementById('perfil-nome');
    if (elPerfilNome) {
      const nomeCompleto = (usuarioAtual.nome + ' ' + (usuarioAtual.sobrenome || '')).trim();
      elPerfilNome.value = nomeCompleto || usuarioAtual.nome;
      document.getElementById('perfil-nome-titulo').textContent = nomeCompleto || usuarioAtual.nome;
      document.getElementById('perfil-email').value = usuarioAtual.email || '';
      document.getElementById('perfil-telefone').value = usuarioAtual.telefone || 'Não informado';
      document.getElementById('perfil-cidade').value = usuarioAtual.cidade || 'Não informada';
    }
  }
}

function trocarSecao(nomeSecao) {
  sections.forEach(section => section.classList.remove('active'));
  menuItems.forEach(item => item.classList.remove('active'));

  const secao = document.getElementById(nomeSecao + '-section');
  if (secao) {
    secao.classList.add('active');
  }

  const menu = document.querySelector(`[data-menu="${nomeSecao}"]`);
  if (menu) {
    menu.classList.add('active');
  }

  const titles = {
    'inicio': 'Início',
    'alunos': 'Lista de Alunos',
    'rotas': 'Minhas Rotas',
    'chat': 'Chat',
    'perfil': 'Meu Perfil'
  };

  document.getElementById('page-title').textContent = titles[nomeSecao] || nomeSecao;
}

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const nomeSecao = item.getAttribute('data-menu');
    trocarSecao(nomeSecao);
  });
});

const executeLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('usuario_dados');
  window.location.href = '/pages/index.html';
};

logoutBtn.addEventListener('click', executeLogout);

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosUsuario();
  trocarSecao('inicio');
  
  const logoutBtnPerfil = document.getElementById('btn-logout-perfil');
  if (logoutBtnPerfil) {
    logoutBtnPerfil.addEventListener('click', executeLogout);
  }
});
