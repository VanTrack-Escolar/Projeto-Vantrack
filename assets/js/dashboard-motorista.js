let usuarioAtual = {
  id: null,
  tipo_perfil: null,
  nome: null,
  email: null
};

let mapInstance = null;
let marcadorVeiculo = null;
let watchId = null;


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

function obterPrimeirosNomes(nome, sobrenome) {
  const nomeCompleto = (nome + ' ' + (sobrenome || '')).trim();
  const partes = nomeCompleto.split(/\s+/);
  if (partes.length > 2) {
    return partes.slice(0, 2).join(' ');
  }
  return nomeCompleto;
}

function carregarDadosUsuario() {
  if (!validarSessao()) return;

  const usuarioJSON = localStorage.getItem('usuario_dados');
  if (usuarioJSON) {
    usuarioAtual = JSON.parse(usuarioJSON);
    const nomeExibicao = obterPrimeirosNomes(usuarioAtual.nome, usuarioAtual.sobrenome);
    document.getElementById('motorista-nome').textContent = nomeExibicao;
    document.getElementById('profile-name').textContent = nomeExibicao;
    
    // Preencher dados na tela de Perfil
    const elPerfilNome = document.getElementById('perfil-nome');
    if (elPerfilNome) {
      let nomeCompleto = (usuarioAtual.nome + ' ' + (usuarioAtual.sobrenome || '')).trim();
      const nStr = usuarioAtual.nome.trim();
      const sStr = (usuarioAtual.sobrenome || '').trim();
      if (sStr) {
        if (nStr.toLowerCase() === sStr.toLowerCase()) {
          nomeCompleto = nStr;
        } else if (nStr.toLowerCase().endsWith(sStr.toLowerCase())) {
          nomeCompleto = nStr;
        } else if (nStr.toLowerCase().startsWith(sStr.toLowerCase())) {
          nomeCompleto = nStr;
        } else if (sStr.toLowerCase().startsWith(nStr.toLowerCase())) {
          nomeCompleto = sStr;
        }
      }
      elPerfilNome.value = nomeCompleto;
      document.getElementById('perfil-nome-titulo').textContent = obterPrimeirosNomes(usuarioAtual.nome, usuarioAtual.sobrenome);
      document.getElementById('perfil-email').value = usuarioAtual.email || '';
      document.getElementById('perfil-telefone').value = usuarioAtual.telefone || 'Não informado';
      document.getElementById('perfil-cidade').value = usuarioAtual.cidade || 'Não informada';
    }

    // Preencher Código de Convite para o Motorista
    const elCodigo = document.getElementById('motorista-codigo-convite');
    if (elCodigo && usuarioAtual.id) {
      const code = usuarioAtual.id.substring(0, 6).toUpperCase();
      elCodigo.textContent = code;
      
      const btnCopiar = document.getElementById('btn-copiar-codigo-mot');
      if (btnCopiar) {
        btnCopiar.onclick = () => {
          navigator.clipboard.writeText(code).then(() => {
            if (typeof mostrarNotificacao === 'function') {
              mostrarNotificacao('Código de convite copiado!', 'sucesso');
            }
          });
        };
      }
    }
  }
}

function trocarSecao(nomeSecao) {
  document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

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
    'pagamentos': 'Pagamentos dos Alunos',
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
        const img = new Image();
        img.src = evt.target.result;
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const max_size = 150;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          localStorage.setItem('vantrack_avatar_' + usuarioAtual.id, compressedBase64);
          carregarAvatar();
          mostrarNotificacao('Foto de perfil atualizada com sucesso!', 'sucesso');
        };
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

        // Salvar no backend via API
        btnEditar.disabled = true;
        btnEditar.textContent = 'Salvando...';

        fetchAPI('PUT', `/usuarios/${usuarioAtual.id}`, {
          nome: nomeVal,
          email: emailVal,
          telefone: telVal,
          cidade: cidadeVal
        }).then(resultado => {
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

          btnEditar.disabled = false;
          btnEditar.textContent = 'Editar Dados';
          btnEditar.style.background = '#f3f4f6';
          btnEditar.style.color = '#374151';
          btnEditar.style.borderColor = '#d1d5db';

          mostrarNotificacao('Perfil atualizado com sucesso!', 'sucesso');
        }).catch(err => {
          btnEditar.disabled = false;
          btnEditar.textContent = 'Salvar Alterações';
          mostrarNotificacao('Erro ao salvar alterações: ' + err.message, 'erro');
        });
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

function inicializarMenuMobile() {
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileClose = document.getElementById('mobile-sidebar-close');
  const sidebar = document.querySelector('.sidebar');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
    });
  }

  if (mobileClose && sidebar) {
    mobileClose.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }

  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('active');
      }
    });
  });
}

function inicializarMapaMotorista() {
  const container = document.getElementById('mapa-motorista');
  if (!container) return;

  if (mapInstance) return;

  // Remover placeholder de carregamento e ajustar layout
  container.innerHTML = '';
  container.style.display = 'block';

  // Inicializar mapa Leaflet
  mapInstance = L.map('mapa-motorista').setView([-23.5505, -46.6333], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  const vehicleIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div style="position: relative;"><div class="van-pulse-ring"></div><div style="background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid #0f6cd5; position: relative; z-index: 10;"><i class="fas fa-van-shuttle" style="font-size: 20px; color: #0f6cd5;"></i></div></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  marcadorVeiculo = L.marker([-23.5505, -46.6333], { icon: vehicleIcon }).addTo(mapInstance);
  marcadorVeiculo.bindPopup('<strong>Sua Posição</strong><br>Obtendo GPS...').openPopup();

  iniciarRastreamentoVeiculo();
}

function iniciarRastreamentoVeiculo() {
  if (!navigator.geolocation) {
    console.warn('Geolocalização não suportada no navegador');
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (mapInstance && marcadorVeiculo) {
        marcadorVeiculo.setLatLng([lat, lng]);
        mapInstance.setView([lat, lng]);
        
        marcadorVeiculo.setPopupContent(`<strong>Sua Van</strong><br>Lat: ${lat.toFixed(4)}<br>Lon: ${lng.toFixed(4)}`);
      }
    },
    (err) => {
      console.error('Erro de GPS do motorista:', err);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

async function carregarAlunosEChecklist() {
  try {
    const res = await fetchAPI('GET', '/dashboard/motorista');
    if (!res) return;

    // 1. Render Checklist
    const listChecklist = document.getElementById('checklist-alunos');
    if (listChecklist) {
      listChecklist.innerHTML = '';
      let confirmados = 0;
      
      if (!res.alunos_hoje || res.alunos_hoje.length === 0) {
        listChecklist.innerHTML = '<li class="aluno-item"><span class="aluno-nome" style="color: #64748b;">Nenhum aluno hoje</span></li>';
      } else {
        res.alunos_hoje.forEach(aluno => {
          const li = document.createElement('li');
          li.className = 'aluno-item';
          
          let statusText = 'Aguardando';
          let iconClass = 'fa-question-circle';
          let badgeColor = '#6b7280';
          
          if (aluno.vai_embarcar === 1 || aluno.vai_embarcar === true) {
            statusText = 'Confirmado';
            iconClass = 'fa-check-circle';
            badgeColor = '#10b981';
            confirmados++;
          } else if (aluno.vai_embarcar === 0 || aluno.vai_embarcar === false) {
            statusText = 'Não vai';
            iconClass = 'fa-times-circle';
            badgeColor = '#ef4444';
          }
          
          li.innerHTML = `
            <span class="aluno-nome" style="font-weight: 600; color: #1e293b;">${aluno.aluno_nome}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: ${badgeColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas ${iconClass}"></i> ${statusText}
              </span>
            </div>
          `;
          listChecklist.appendChild(li);
        });
      }
      
      const countEl = document.getElementById('confirmar-count');
      if (countEl) countEl.textContent = confirmados;
    }

    // 2. Render Alunos Table
    const tableBody = document.getElementById('alunos-table-body');
    if (tableBody) {
      tableBody.innerHTML = '';
      if (!res.alunos_hoje || res.alunos_hoje.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhum aluno cadastrado nesta rota</td></tr>';
      } else {
        res.alunos_hoje.forEach(aluno => {
          const tr = document.createElement('tr');
          
          let statusText = 'Pendente';
          let statusStyle = 'background: #6b7280; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          
          if (aluno.vai_embarcar === 1 || aluno.vai_embarcar === true) {
            statusText = 'Confirmado';
            statusStyle = 'background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          } else if (aluno.vai_embarcar === 0 || aluno.vai_embarcar === false) {
            statusText = 'Não Vai';
            statusStyle = 'background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          }

          let pagText = 'Pendente';
          let pagStyle = 'background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          if (aluno.status_pagamento === 'pago') {
            pagText = 'Pago';
            pagStyle = 'background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          } else if (aluno.status_pagamento === 'atrasado') {
            pagText = 'Atrasado';
            pagStyle = 'background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
          }
          
          const telefone = '(11) 98' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
          const endereco = 'Rua das Palmeiras, ' + Math.floor(10 + Math.random() * 500) + ' - Centro';
          
          tr.innerHTML = `
            <td style="font-weight: 600; color: #1e293b;">${aluno.aluno_nome}</td>
            <td>${telefone}</td>
            <td>${endereco}</td>
            <td><span style="${statusStyle}">${statusText}</span></td>
            <td><span style="${pagStyle}">${pagText}</span></td>
          `;
          tableBody.appendChild(tr);
        });
      }
    }
  } catch (err) {
    console.error('Erro ao carregar checklist e alunos:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosUsuario();
  trocarSecao('inicio');
  inicializarPerfil();
  inicializarMenuMobile();
  inicializarMapaMotorista();
  carregarAlunosEChecklist();
  
  // Atualizar a cada 30 segundos
  setInterval(carregarAlunosEChecklist, 30000);
  
  const logoutBtnPerfil = document.getElementById('btn-logout-perfil');
  if (logoutBtnPerfil) {
    logoutBtnPerfil.addEventListener('click', executeLogout);
  }
});

window.addEventListener('beforeunload', () => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
});

