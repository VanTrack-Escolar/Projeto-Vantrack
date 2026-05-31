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
      if (fotoPreview) fotoPreview.src = '../assets/img/aluno.png';
      if (sidebarAvatar) {
        sidebarAvatar.src = '../assets/img/aluno.png';
        sidebarAvatar.style.display = 'block';
      }
      if (sidebarAvatarIcon) sidebarAvatarIcon.style.display = 'none';
      if (profileAvatar) profileAvatar.src = '../assets/img/aluno.png';
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
        document.getElementById('aluno-nome').textContent = nomeVal;
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

  // 5. Editar Endereço
  const btnEditarEndereco = document.getElementById('btn-editar-endereco');
  if (btnEditarEndereco) {
    btnEditarEndereco.addEventListener('click', abrirModalEditarEndereco);
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

  function abrirModalEditarEndereco() {
    const modalAntigo = document.getElementById('modal-editar-endereco');
    if (modalAntigo) modalAntigo.remove();

    const coletaAtual = document.getElementById('endereco-coleta-atual').textContent;
    const entregaAtual = document.getElementById('endereco-entrega-atual').textContent;
    
    const coletaValor = (coletaAtual === 'Carregando...' || coletaAtual === 'Não informado' || coletaAtual === 'Erro ao carregar') ? '' : coletaAtual;
    const entregaValor = (entregaAtual === 'Carregando...' || entregaAtual === 'Não informado' || entregaAtual === 'Erro ao carregar') ? '' : entregaAtual;

    const modal = document.createElement('div');
    modal.id = 'modal-editar-endereco';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.4)'; 
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.transition = 'all 0.3s ease';

    modal.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.95); border-radius: 20px; padding: 32px; width: 90%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); border: 1px solid rgba(229, 231, 235, 0.8); position: relative;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div style="background: #e0f2fe; color: var(--primary-blue); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
            <i class="fas fa-map-marked-alt"></i>
          </div>
          <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b;">Editar Endereços da Rota</h3>
        </div>
        <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #64748b; line-height: 1.5;">Atualize o seu endereço de coleta e entrega para a rota de van.</p>
        
        <div style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 28px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px;">Endereço de Coleta (Ida)</label>
            <input type="text" id="input-endereco-coleta" placeholder="Ex: Rua das Flores, 123 - Centro" value="${coletaValor}" style="width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box;" />
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px;">Endereço de Entrega (Volta)</label>
            <input type="text" id="input-endereco-entrega" placeholder="Ex: Rua das Palmeiras, 456 - Bairro Novo" value="${entregaValor}" style="width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box;" />
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancelar-endereco" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit;">Cancelar</button>
          <button id="btn-salvar-endereco" style="background: var(--primary-blue); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; display: flex; align-items: center; gap: 8px;">
            <span>Salvar Endereços</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const inputColeta = document.getElementById('input-endereco-coleta');
    const inputEntrega = document.getElementById('input-endereco-entrega');
    
    [inputColeta, inputEntrega].forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = 'var(--primary-blue)';
        input.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.15)';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#cbd5e1';
        input.style.boxShadow = 'none';
      });
    });

    if (inputColeta) inputColeta.focus();

    document.getElementById('btn-cancelar-endereco').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('btn-salvar-endereco').addEventListener('click', async () => {
      const coleta = inputColeta.value.trim();
      const entrega = inputEntrega.value.trim();

      if (!coleta || coleta.length < 5) {
        inputColeta.style.borderColor = '#ef4444';
        inputColeta.focus();
        mostrarNotificacao('O endereço de coleta deve conter no mínimo 5 caracteres.', 'erro');
        return;
      }

      if (!entrega || entrega.length < 5) {
        inputEntrega.style.borderColor = '#ef4444';
        inputEntrega.focus();
        mostrarNotificacao('O endereço de entrega deve conter no mínimo 5 caracteres.', 'erro');
        return;
      }

      const btnSalvar = document.getElementById('btn-salvar-endereco');
      btnSalvar.disabled = true;
      btnSalvar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Salvando...</span>`;

      try {
        const r = await fetchAPI('POST', '/dashboard/endereco', {
          endereco_coleta: coleta,
          endereco_entrega: entrega
        });

        if (r) {
          mostrarNotificacao('Endereços atualizados com sucesso!', 'sucesso');
          document.getElementById('endereco-coleta-atual').textContent = coleta;
          document.getElementById('endereco-entrega-atual').textContent = entrega;
          
          usuarioAtual.endereco_coleta = coleta;
          usuarioAtual.endereco_entrega = entrega;
          localStorage.setItem('usuario_dados', JSON.stringify(usuarioAtual));
          
          modal.remove();
        }
      } catch (err) {
        mostrarNotificacao(err.message || 'Erro ao atualizar endereço.', 'erro');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = `<span>Salvar Endereços</span>`;
      }
    });
  }
}

async function carregarEnderecoAluno() {
  try {
    const res = await fetchAPI('GET', '/dashboard/aluno');
    if (res && res.endereco_principal) {
      const ep = res.endereco_principal;
      document.getElementById('endereco-coleta-atual').textContent = ep.endereco_coleta || 'Não informado';
      document.getElementById('endereco-entrega-atual').textContent = ep.endereco_entrega || 'Não informado';
      
      usuarioAtual.endereco_coleta = ep.endereco_coleta;
      usuarioAtual.endereco_entrega = ep.endereco_entrega;
      localStorage.setItem('usuario_dados', JSON.stringify(usuarioAtual));
    } else {
      document.getElementById('endereco-coleta-atual').textContent = 'Não informado';
      document.getElementById('endereco-entrega-atual').textContent = 'Não informado';
    }
  } catch (e) {
    console.error('Erro ao carregar endereços do aluno:', e);
    document.getElementById('endereco-coleta-atual').textContent = 'Erro ao carregar';
    document.getElementById('endereco-entrega-atual').textContent = 'Erro ao carregar';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosUsuario();
  carregarEnderecoAluno();
  trocarSecao('rastreamento');
  inicializarPresenca();
  inicializarTogglePresenca();
  inicializarCalendario();
  inicializarPerfil();
  
  const logoutBtnPerfil = document.getElementById('btn-logout-perfil');
  if (logoutBtnPerfil) {
    logoutBtnPerfil.addEventListener('click', executeLogout);
  }
});
