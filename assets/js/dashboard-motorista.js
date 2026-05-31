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

function inicializarPerfil() {
  const btnEditar = document.getElementById('btn-editar-perfil');
  const uploaderContainer = document.getElementById('avatar-uploader-container');
  const fileInput = document.getElementById('perfil-foto-upload');
  const fotoPreview = document.getElementById('perfil-foto-preview');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarAvatarIcon = document.getElementById('sidebar-avatar-icon');
  const profileAvatar = document.getElementById('profile-avatar');

  // Inputs
  const elNome = document.getElementById('perfil-nome');
  const elEmail = document.getElementById('perfil-email');
  const elTelefone = document.getElementById('perfil-telefone');
  const elCidade = document.getElementById('perfil-cidade');

  // 1. Carregar Avatar Persistente
  function carregarAvatar() {
    if (!usuarioAtual.id) return;
    const fotoSalva = localStorage.getItem('vantrack_avatar_' + usuarioAtual.id);
    if (fotoSalva) {
      if (fotoPreview) fotoPreview.src = fotoSalva;
      if (sidebarAvatar) {
        sidebarAvatar.src = fotoSalva;
        sidebarAvatar.style.display = 'block';
      }
      if (sidebarAvatarIcon) sidebarAvatarIcon.style.display = 'none';
      if (profileAvatar) profileAvatar.src = fotoSalva;
    } else {
      // Usar a foto padrão
      if (fotoPreview) fotoPreview.src = '../assets/img/motorista.png';
      if (sidebarAvatar) {
        sidebarAvatar.src = '../assets/img/motorista.png';
        sidebarAvatar.style.display = 'block';
      }
      if (sidebarAvatarIcon) sidebarAvatarIcon.style.display = 'none';
      if (profileAvatar) profileAvatar.src = '../assets/img/motorista.png';
    }
  }

  carregarAvatar();

  // 2. Evento de clique para disparar o upload de arquivo
  if (uploaderContainer && fileInput) {
    uploaderContainer.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        mostrarNotificacao('Por favor, selecione apenas arquivos de imagem.', 'erro');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64Str = evt.target.result;
        
        // Salvar localmente
        localStorage.setItem('vantrack_avatar_' + usuarioAtual.id, base64Str);
        
        // Atualizar visualizações
        carregarAvatar();
        
        mostrarNotificacao('Foto de perfil atualizada com sucesso!', 'sucesso');
      };
      reader.readAsDataURL(file);
    });
  }

  // 3. Edição de Dados Pessoais
  if (btnEditar) {
    btnEditar.addEventListener('click', () => {
      const inputs = [elNome, elEmail, elTelefone, elCidade];
      const isViewMode = elNome.disabled;

      if (isViewMode) {
        // Mudar para modo de edição
        inputs.forEach(input => {
          if (input) {
            input.disabled = false;
            input.style.backgroundColor = '#ffffff';
            input.style.borderColor = 'var(--primary-blue)';
          }
        });
        btnEditar.textContent = 'Salvar Alterações';
        btnEditar.style.background = 'var(--primary-blue)';
        btnEditar.style.color = '#ffffff';
        btnEditar.style.borderColor = 'var(--primary-blue)';
        if (elNome) elNome.focus();
      } else {
        // Salvar alterações
        // Limpar erros anteriores
        inputs.forEach(input => {
          if (input) {
            input.classList.remove('input-erro');
            input.style.borderColor = '#d1d5db';
          }
        });

        const nomeVal = elNome ? elNome.value.trim() : '';
        const emailVal = elEmail ? elEmail.value.trim() : '';
        const telVal = elTelefone ? elTelefone.value.trim() : '';
        const cidadeVal = elCidade ? elCidade.value.trim() : '';

        // Validações
        if (!nomeVal || nomeVal.length < 3) {
          if (elNome) { elNome.classList.add('input-erro'); elNome.focus(); elNome.style.borderColor = '#ef4444'; }
          mostrarNotificacao('O nome deve conter pelo menos 3 caracteres.', 'erro');
          return;
        }
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !regexEmail.test(emailVal)) {
          if (elEmail) { elEmail.classList.add('input-erro'); elEmail.focus(); elEmail.style.borderColor = '#ef4444'; }
          mostrarNotificacao('Por favor, informe um e-mail válido.', 'erro');
          return;
        }
        if (!telVal || telVal.replace(/\D/g, '').length < 10) {
          if (elTelefone) { elTelefone.classList.add('input-erro'); elTelefone.focus(); elTelefone.style.borderColor = '#ef4444'; }
          mostrarNotificacao('Por favor, informe um telefone válido com DDD.', 'erro');
          return;
        }
        if (!cidadeVal || cidadeVal.length < 3) {
          if (elCidade) { elCidade.classList.add('input-erro'); elCidade.focus(); elCidade.style.borderColor = '#ef4444'; }
          mostrarNotificacao('A cidade deve conter pelo menos 3 caracteres.', 'erro');
          return;
        }

        // Salvar no localStorage
        usuarioAtual.nome = nomeVal;
        usuarioAtual.email = emailVal;
        usuarioAtual.telefone = telVal;
        usuarioAtual.cidade = cidadeVal;

        localStorage.setItem('usuario_dados', JSON.stringify(usuarioAtual));

        // Atualizar textos no dashboard
        document.getElementById('motorista-nome').textContent = nomeVal;
        document.getElementById('profile-name').textContent = nomeVal;
        document.getElementById('perfil-nome-titulo').textContent = nomeVal;

        // Desativar inputs
        inputs.forEach(input => {
          if (input) {
            input.disabled = true;
            input.style.backgroundColor = '#f9fafb';
            input.style.borderColor = '#d1d5db';
          }
        });

        btnEditar.textContent = 'Editar Dados';
        btnEditar.style.background = '#f3f4f6';
        btnEditar.style.color = '#374151';
        btnEditar.style.borderColor = '#d1d5db';

        mostrarNotificacao('Perfil atualizado com sucesso!', 'sucesso');
      }
    });
  }

  // 4. Alterar Senha
  const btnAlterarSenha = document.getElementById('btn-alterar-senha');
  if (btnAlterarSenha) {
    btnAlterarSenha.addEventListener('click', abrirModalAlterarSenha);
  }

  function abrirModalAlterarSenha() {
    const modalAntigo = document.getElementById('modal-alterar-senha');
    if (modalAntigo) modalAntigo.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-alterar-senha';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.style.backdropFilter = 'blur(4px)';

    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 30px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e5e7eb; position: relative;">
        <h3 style="margin: 0 0 10px 0; font-size: 1.25rem; font-weight: 700; color: #111827;">Alterar Senha</h3>
        <p style="margin: 0 0 20px 0; font-size: 0.9rem; color: #6b7280;">Defina sua nova senha de acesso abaixo.</p>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <div>
            <input type="password" id="input-nova-senha" placeholder="Digite a nova senha" style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s;" />
          </div>
          <div>
            <input type="password" id="input-confirmar-senha" placeholder="Confirme a nova senha" style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s;" />
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancelar-senha" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">Cancelar</button>
          <button id="btn-salvar-senha" style="background: var(--primary-blue); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">Salvar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const inputNova = document.getElementById('input-nova-senha');
    const inputConf = document.getElementById('input-confirmar-senha');
    if (inputNova) inputNova.focus();

    document.getElementById('btn-cancelar-senha').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('btn-salvar-senha').addEventListener('click', async () => {
      const nova = inputNova.value;
      const conf = inputConf.value;

      if (!nova || nova.length < 4) {
        inputNova.style.borderColor = '#ef4444';
        inputNova.focus();
        mostrarNotificacao('A nova senha deve conter no mínimo 4 caracteres.', 'erro');
        return;
      }

      if (nova !== conf) {
        inputConf.style.borderColor = '#ef4444';
        inputConf.focus();
        mostrarNotificacao('As senhas não coincidem.', 'erro');
        return;
      }

      const btnSalvar = document.getElementById('btn-salvar-senha');
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Gravando...';

      try {
        const r = await fetchAPI('POST', '/recuperar-senha', {
          email: usuarioAtual.email,
          nova_senha: nova
        });

        if (r) {
          mostrarNotificacao('Senha alterada com sucesso!', 'sucesso');
          modal.remove();
        }
      } catch (err) {
        mostrarNotificacao(err.message || 'Erro ao alterar senha.', 'erro');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
      }
    });
  }

  // 5. Carregar Dados do Veículo
  async function carregarDadosVeiculo() {
    try {
      const res = await fetchAPI('GET', '/dashboard/motorista');
      if (res && res.rotas && res.rotas.length > 0) {
        const activeRoute = res.rotas[0];
        if (activeRoute.veiculo_id) {
          const v = await fetchAPI('GET', `/veiculos/${activeRoute.veiculo_id}`);
          if (v) {
            const placaEl = document.getElementById('info-veiculo-placa');
            const capEl = document.getElementById('info-veiculo-capacidade');
            if (placaEl) placaEl.textContent = v.placa;
            if (capEl) capEl.textContent = v.capacidade + ' passageiros';
          }
        }
      } else {
        document.getElementById('info-veiculo-placa').textContent = 'Nenhuma van ativa';
        document.getElementById('info-veiculo-capacidade').textContent = 'N/A';
      }
    } catch (err) {
      document.getElementById('info-veiculo-placa').textContent = 'Van Escolar';
      document.getElementById('info-veiculo-capacidade').textContent = 'Não informada';
    }
  }

  carregarDadosVeiculo();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosUsuario();
  trocarSecao('inicio');
  inicializarPerfil();
  
  const logoutBtnPerfil = document.getElementById('btn-logout-perfil');
  if (logoutBtnPerfil) {
    logoutBtnPerfil.addEventListener('click', executeLogout);
  }
});
