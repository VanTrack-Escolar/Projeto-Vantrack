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
  
  console.log('[SESSÃO DEBUG] Validando sessão no dashboard do Aluno...');
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
    document.getElementById('aluno-nome').textContent = usuarioAtual.nome;
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
    'rastreamento': 'Rastreamento em Tempo Real',
    'frequencia': 'Frequência Rápida',
    'motorista': 'Chat com Motorista',
    'perfil': 'Meu Perfil'
  };

  document.getElementById('page-title').textContent = titles[nomeSecao] || nomeSecao;
}

function inicializarPresenca() {
  const btnVai = document.getElementById('btn-vai');
  const btnNaoVai = document.getElementById('btn-nao-vai');
  const confirmacaoMsg = document.getElementById('confirmacao-msg');

  btnVai.addEventListener('click', () => {
    btnVai.classList.add('active');
    btnNaoVai.classList.remove('active');
    confirmacaoMsg.textContent = 'Confirmado: você vai para a escola!';
    confirmacaoMsg.style.color = '#22c55e';
  });

  btnNaoVai.addEventListener('click', () => {
    btnNaoVai.classList.add('active');
    btnVai.classList.remove('active');
    confirmacaoMsg.textContent = 'Confirmado: você não vai para a escola.';
    confirmacaoMsg.style.color = '#ef4444';
  });

  btnVai.click();
}

function inicializarTogglePresenca() {
  const toggleBtn = document.getElementById('toggle-presenca-grande');
  const toggleLabel = document.getElementById('toggle-label');

  toggleBtn.addEventListener('click', () => {
    const status = toggleBtn.getAttribute('data-status');
    if (status === 'sim') {
      toggleBtn.setAttribute('data-status', 'nao');
      toggleBtn.classList.remove('active');
      toggleLabel.textContent = 'Confirmado: NÃO';
      toggleLabel.style.color = '#ef4444';
    } else {
      toggleBtn.setAttribute('data-status', 'sim');
      toggleBtn.classList.add('active');
      toggleLabel.textContent = 'Confirmado: SIM';
      toggleLabel.style.color = '#22c55e';
    }
  });

  toggleBtn.click();
}

function inicializarCalendario() {
  const diasCalendario = document.getElementById('dias-calendario');
  const mesAno = document.getElementById('mes-ano');
  const btnMesAnterior = document.querySelector('.btn-mes-anterior');
  const btnMesProximo = document.querySelector('.btn-mes-proximo');

  let mesAtual = new Date().getMonth();
  let anoAtual = new Date().getFullYear();

  function renderizarCalendario(mes, ano) {
    diasCalendario.innerHTML = '';
    const primeira = new Date(ano, mes, 1);
    const ultima = new Date(ano, mes + 1, 0);
    const diasAnterior = primeira.getDay() === 0 ? 6 : primeira.getDay() - 1;

    mesAno.textContent = primeira.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    for (let i = diasAnterior; i > 0; i--) {
      const div = document.createElement('div');
      div.className = 'dia-calendario desativado';
      diasCalendario.appendChild(div);
    }

    for (let i = 1; i <= ultima.getDate(); i++) {
      const div = document.createElement('div');
      div.className = 'dia-calendario';
      div.textContent = i;

      const hoje = new Date();
      if (i === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
        div.classList.add('presente');
      } else if (Math.random() > 0.5) {
        div.classList.add('presente');
      }

      diasCalendario.appendChild(div);
    }
  }

  btnMesAnterior.addEventListener('click', () => {
    mesAtual--;
    if (mesAtual < 0) {
      mesAtual = 11;
      anoAtual--;
    }
    renderizarCalendario(mesAtual, anoAtual);
  });

  btnMesProximo.addEventListener('click', () => {
    mesAtual++;
    if (mesAtual > 11) {
      mesAtual = 0;
      anoAtual++;
    }
    renderizarCalendario(mesAtual, anoAtual);
  });

  renderizarCalendario(mesAtual, anoAtual);
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
  trocarSecao('rastreamento');
  inicializarPresenca();
  inicializarTogglePresenca();
  inicializarCalendario();
  
  const logoutBtnPerfil = document.getElementById('btn-logout-perfil');
  if (logoutBtnPerfil) {
    logoutBtnPerfil.addEventListener('click', executeLogout);
  }
});
