let socketChat;
let chamadosData = [];
let chamadoAtivo = null;

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

            // Se for suporte, inicializar chamados
            if (targetMenu === 'suporte') {
                carregarChamadosAdmin();
                inicializarSocketChat();
            }
        });
    });

    // Configurar Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        if(socketChat) socketChat.disconnect();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/pages/index.html';
    });

    // Configurar busca de chamados
    const searchInput = document.getElementById('suporte-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filtrarEExibirChamados(query);
        });
    }

    inicializarPerfilAdmin();
});

// Inicializar Socket.IO para o Chat do Admin
function inicializarSocketChat() {
    if (socketChat) return;

    const token = localStorage.getItem('auth_token');
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados'));

    if (!token || !usuarioDados) return;

    socketChat = io('http://localhost:5000/chat', {
        query: {
            token: token,
            usuario_id: usuarioDados.id
        },
        reconnection: true
    });

    socketChat.on('connect', () => {
        console.log('[Socket Admin] Conectado ao canal de chat de suporte');
    });

    socketChat.on('nova_mensagem', (data) => {
        console.log('[Socket Admin] Nova mensagem recebida:', data);
        const { remetente_id, destinatario_id, texto, criado_em } = data;
        const adminId = JSON.parse(localStorage.getItem('usuario_dados')).id;
        
        // Identificar com qual usuário é esta mensagem
        const outroId = remetente_id === adminId ? destinatario_id : remetente_id;

        // Se o chamado ativo for desse usuário, adicionar mensagem na tela
        if (chamadoAtivo && chamadoAtivo.usuario_id === outroId) {
            const container = document.getElementById('suporte-chat-messages');
            if (container) {
                const classe = remetente_id === adminId ? 'mensagem-enviada' : 'mensagem-recebida';
                const hora = new Date(criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                const div = document.createElement('div');
                div.className = classe;
                // Aplicar estilo de mensagem inline
                div.style.alignSelf = remetente_id === adminId ? 'flex-end' : 'flex-start';
                div.style.background = remetente_id === adminId ? '#1062c0' : '#e2e8f0';
                div.style.color = remetente_id === adminId ? 'white' : '#1e293b';
                div.style.padding = '10px 14px';
                div.style.borderRadius = remetente_id === adminId ? '12px 12px 0 12px' : '12px 12px 12px 0';
                div.style.maxWidth = '70%';
                div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.gap = '4px';

                div.innerHTML = `<p style="margin: 0; font-size: 0.9rem;">${texto}</p><span style="font-size: 0.7rem; align-self: flex-end; opacity: 0.8; margin-top: 2px;">${hora}</span>`;
                container.appendChild(div);
                container.scrollTop = container.scrollHeight;
            }
        }
    });

    socketChat.on('erro_chat', (data) => {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(data.mensagem || 'Erro na conexão do chat de suporte', 'erro');
        }
    });
}

// Buscar chamados do backend
async function carregarChamadosAdmin() {
    const listContainer = document.getElementById('suporte-chamados-list');
    if (!listContainer) return;

    try {
        const response = await fetchAPI('GET', '/chamados');
        if (response) {
            chamadosData = response;
            filtrarEExibirChamados('');
        }
    } catch (e) {
        console.error('Erro ao carregar chamados:', e);
        listContainer.innerHTML = `<li style="padding: 20px; text-align: center; color: #ef4444; font-size: 0.9rem;">Erro ao carregar chamados</li>`;
    }
}

// Filtrar e renderizar chamados na barra lateral
function filtrarEExibirChamados(query) {
    const listContainer = document.getElementById('suporte-chamados-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const filtrados = chamadosData.filter(c => {
        const nome = `${c.nome || ''} ${c.sobrenome || ''}`.toLowerCase();
        const assunto = (c.assunto || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        return nome.includes(query) || assunto.includes(query) || email.includes(query);
    });

    if (filtrados.length === 0) {
        listContainer.innerHTML = `<li style="padding: 20px; text-align: center; color: #64748b; font-size: 0.9rem;">Nenhum chamado encontrado</li>`;
        return;
    }

    filtrados.forEach(c => {
        const li = document.createElement('li');
        li.style.padding = '16px 20px';
        li.style.borderBottom = '1px solid #e2e8f0';
        li.style.cursor = 'pointer';
        li.style.transition = 'all 0.2s';
        li.style.display = 'flex';
        li.style.flexDirection = 'column';
        li.style.gap = '6px';
        li.className = (chamadoAtivo && chamadoAtivo.id === c.id) ? 'chamado-item-ativo' : '';
        
        // Estilo especial para o item ativo
        if (chamadoAtivo && chamadoAtivo.id === c.id) {
            li.style.background = '#eff6ff';
            li.style.borderLeft = '4px solid #1062c0';
        } else {
            li.style.background = 'transparent';
            li.style.borderLeft = '4px solid transparent';
            li.addEventListener('mouseenter', () => li.style.background = '#f1f5f9');
            li.addEventListener('mouseleave', () => li.style.background = 'transparent');
        }

        const badgeColor = c.status === 'aberto' ? '#ef4444' : c.status === 'em_atendimento' ? '#f59e0b' : '#10b981';
        const badgeText = c.status === 'aberto' ? 'Aberto' : c.status === 'em_atendimento' ? 'Atendimento' : 'Resolvido';

        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; font-size: 0.9rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${c.assunto}</span>
                <span style="font-size: 0.7rem; font-weight: 700; color: white; background: ${badgeColor}; padding: 3px 8px; border-radius: 20px;">${badgeText}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b;">
                <span>${c.nome} (${c.tipo_perfil === 'aluno' ? 'Aluno' : 'Motorista'})</span>
                <span>${new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
        `;

        li.addEventListener('click', () => {
            selecionarChamado(c);
        });

        listContainer.appendChild(li);
    });
}

// Selecionar chamado para atendimento
async function selecionarChamado(chamado) {
    chamadoAtivo = chamado;
    
    // Atualizar classe ativa na barra lateral
    filtrarEExibirChamados(document.getElementById('suporte-search-input').value.toLowerCase());

    const mainArea = document.getElementById('suporte-main-area');
    if (!mainArea) return;

    // Renderizar painel de atendimento e chat
    mainArea.style.display = 'block';
    mainArea.style.padding = '0';
    mainArea.style.textAlign = 'left';
    mainArea.style.color = 'inherit';

    mainArea.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
            <!-- Cabeçalho do Chamado -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">${chamado.assunto}</h3>
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">
                        Por: <strong style="color: #475569;">${chamado.nome} ${chamado.sobrenome}</strong> (${chamado.tipo_perfil === 'aluno' ? 'Aluno' : 'Motorista'}) &bull; ${chamado.email}
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">Status:</span>
                    <select id="suporte-ativo-status-select" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; outline: none; background: white; transition: all 0.2s;">
                        <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                        <option value="em_atendimento" ${chamado.status === 'em_atendimento' ? 'selected' : ''}>Em Atendimento</option>
                        <option value="resolvido" ${chamado.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
                    </select>
                </div>
            </div>
            
            <!-- Descrição Inicial do Chamado -->
            <div style="padding: 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #334155; line-height: 1.5;">
                <strong style="display: block; margin-bottom: 6px; color: #1e293b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Descrição do problema:</strong>
                <div style="white-space: pre-wrap; font-family: inherit; color: #475569;">${chamado.descricao}</div>
            </div>
            
            <!-- Histórico de Chat com o Usuário -->
            <div id="suporte-chat-messages" style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #fafafa;">
                <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-bottom: 10px;">Carregando histórico do chat...</div>
            </div>
            
            <!-- Input de Chat -->
            <div style="padding: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; background: white; align-items: center;">
                <input type="text" id="suporte-chat-input" placeholder="Digite uma mensagem para responder ao usuário..." style="flex: 1; padding: 11px 16px; border: 1.5px solid #cbd5e1; border-radius: 10px; outline: none; font-family: inherit; font-size: 0.95rem; transition: all 0.2s;" />
                <button id="suporte-chat-send-btn" style="background: #1062c0; color: white; border: none; padding: 11px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-family: inherit;">
                    <i class="fas fa-paper-plane"></i> <span>Enviar</span>
                </button>
            </div>
        </div>
    `;

    // Adicionar listener para alterar status
    document.getElementById('suporte-ativo-status-select').addEventListener('change', async (e) => {
        const novoStatus = e.target.value;
        try {
            const res = await fetchAPI('PUT', `/chamados/${chamado.id}/status`, { status: novoStatus });
            if (res) {
                chamado.status = novoStatus;
                if (typeof mostrarNotificacao === 'function') {
                    mostrarNotificacao('Status do chamado atualizado com sucesso!', 'sucesso');
                }
                // Recarregar lista
                carregarChamadosAdmin();
            }
        } catch (err) {
            console.error(err);
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Erro ao alterar status do chamado', 'erro');
            }
        }
    });

    // Adicionar listeners para envio do chat
    const sendBtn = document.getElementById('suporte-chat-send-btn');
    const chatInput = document.getElementById('suporte-chat-input');
    
    sendBtn.addEventListener('click', enviarMensagemSuporte);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enviarMensagemSuporte();
        }
    });

    // Inscrever e Carregar histórico de mensagens
    inscreverConversaSuporte(chamado.usuario_id);
    await carregarHistoricoSuporte(chamado.usuario_id);
}

// Inscrever sala de conversa
function inscreverConversaSuporte(outroUsuarioId) {
    if (socketChat) {
        socketChat.emit('inscrever_conversa', { outro_usuario_id: outroUsuarioId });
        socketChat.emit('marcar_como_lida', { outro_usuario_id: outroUsuarioId });
    }
}

// Carregar histórico de conversa
async function carregarHistoricoSuporte(outroUsuarioId) {
    const container = document.getElementById('suporte-chat-messages');
    if (!container) return;

    try {
        const response = await fetchAPI('GET', `/dashboard/mensagens/${outroUsuarioId}`);
        if (response && response.mensagens) {
            container.innerHTML = '';
            const adminId = JSON.parse(localStorage.getItem('usuario_dados')).id;
            
            if (response.mensagens.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 10px;">Nenhuma mensagem registrada. Envie uma mensagem para iniciar o atendimento.</div>`;
                return;
            }

            response.mensagens.forEach(msg => {
                const isMe = msg.remetente_id === adminId;
                const classe = isMe ? 'mensagem-enviada' : 'mensagem-recebida';
                const hora = new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                const div = document.createElement('div');
                div.className = classe;
                div.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
                div.style.background = isMe ? '#1062c0' : '#e2e8f0';
                div.style.color = isMe ? 'white' : '#1e293b';
                div.style.padding = '10px 14px';
                div.style.borderRadius = isMe ? '12px 12px 0 12px' : '12px 12px 12px 0';
                div.style.maxWidth = '70%';
                div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.gap = '4px';

                div.innerHTML = `<p style="margin: 0; font-size: 0.9rem;">${msg.texto}</p><span style="font-size: 0.7rem; align-self: flex-end; opacity: 0.8; margin-top: 2px;">${hora}</span>`;
                container.appendChild(div);
            });

            container.scrollTop = container.scrollHeight;
        }
    } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
        container.innerHTML = `<div style="text-align: center; color: #ef4444; font-size: 0.85rem; margin-top: 10px;">Erro ao carregar mensagens</div>`;
    }
}

// Enviar mensagem de suporte pelo input
function enviarMensagemSuporte() {
    const chatInput = document.getElementById('suporte-chat-input');
    if (!chatInput || !chatInput.value.trim() || !chamadoAtivo) return;

    if (!socketChat || !socketChat.connected) {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro: Não conectado ao servidor de chat', 'erro');
        }
        return;
    }

    socketChat.emit('enviar_mensagem', {
        destinatario_id: chamadoAtivo.usuario_id,
        texto: chatInput.value.trim()
    });

    chatInput.value = '';
}

// --- FUNCIONALIDADES DE PERFIL DO ADMINISTRADOR ---

function obterPrimeirosNomes(nome, sobrenome) {
    const nomeCompleto = (nome + ' ' + (sobrenome || '')).trim();
    const partes = nomeCompleto.split(/\s+/);
    if (partes.length > 2) {
        return partes.slice(0, 2).join(' ');
    }
    return nomeCompleto;
}

function inicializarPerfilAdmin() {
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados'));
    if (!usuarioDados) return;

    const elNome = document.getElementById('perfil-nome');
    const elEmail = document.getElementById('perfil-email');
    const elTelefone = document.getElementById('perfil-telefone');
    const elCidade = document.getElementById('perfil-cidade');
    const btnEditar = document.getElementById('btn-editar-perfil');
    const btnAlterarSenha = document.getElementById('btn-alterar-senha');

    // Preencher dados na tela
    if (elNome) {
        let nomeCompleto = (usuarioDados.nome + ' ' + (usuarioDados.sobrenome || '')).trim();
        elNome.value = nomeCompleto;
        document.getElementById('perfil-nome-titulo').textContent = obterPrimeirosNomes(usuarioDados.nome, usuarioDados.sobrenome);
        if (elEmail) elEmail.value = usuarioDados.email || '';
        if (elTelefone) elTelefone.value = usuarioDados.telefone || 'Não informado';
        if (elCidade) elCidade.value = usuarioDados.cidade || 'Não informada';
    }

    // Configurar edição de dados
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const inputs = [elNome, elEmail, elTelefone, elCidade];
            const isViewMode = elNome.disabled;

            if (isViewMode) {
                // Modo Edição
                inputs.forEach(input => {
                    if (input) {
                        input.disabled = false;
                        input.style.backgroundColor = '#ffffff';
                        input.style.borderColor = '#1062c0';
                    }
                });
                btnEditar.textContent = 'Salvar Alterações';
                btnEditar.style.background = '#1062c0';
                btnEditar.style.color = '#ffffff';
                btnEditar.style.borderColor = '#1062c0';
                if (elNome) elNome.focus();
            } else {
                // Salvar
                inputs.forEach(input => {
                    if (input) {
                        input.style.borderColor = '#cbd5e1';
                    }
                });

                const nomeVal = elNome ? elNome.value.trim() : '';
                const emailVal = elEmail ? elEmail.value.trim() : '';
                const telVal = elTelefone ? elTelefone.value.trim() : '';
                const cidadeVal = elCidade ? elCidade.value.trim() : '';

                if (!nomeVal || nomeVal.length < 3) {
                    if (elNome) elNome.style.borderColor = '#ef4444';
                    mostrarNotificacao('O nome deve conter pelo menos 3 caracteres.', 'erro');
                    return;
                }
                const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailVal || !regexEmail.test(emailVal)) {
                    if (elEmail) elEmail.style.borderColor = '#ef4444';
                    mostrarNotificacao('Por favor, informe um e-mail válido.', 'erro');
                    return;
                }
                if (!telVal || telVal.replace(/\D/g, '').length < 10) {
                    if (elTelefone) elTelefone.style.borderColor = '#ef4444';
                    mostrarNotificacao('Por favor, informe um telefone válido com DDD.', 'erro');
                    return;
                }
                if (!cidadeVal || cidadeVal.length < 3) {
                    if (elCidade) elCidade.style.borderColor = '#ef4444';
                    mostrarNotificacao('A cidade deve conter pelo menos 3 caracteres.', 'erro');
                    return;
                }

                btnEditar.disabled = true;
                btnEditar.textContent = 'Salvando...';

                fetchAPI('PUT', `/usuarios/${usuarioDados.id}`, {
                    nome: nomeVal,
                    email: emailVal,
                    telefone: telVal,
                    cidade: cidadeVal
                }).then(resultado => {
                    usuarioDados.nome = nomeVal;
                    usuarioDados.email = emailVal;
                    usuarioDados.telefone = telVal;
                    usuarioDados.cidade = cidadeVal;
                    localStorage.setItem('usuario_dados', JSON.stringify(usuarioDados));

                    document.getElementById('perfil-nome-titulo').textContent = nomeVal;
                    document.getElementById('profile-name').textContent = obterPrimeirosNomes(nomeVal, '');

                    inputs.forEach(input => {
                        if (input) {
                            input.disabled = true;
                            input.style.backgroundColor = '#f8fafc';
                            input.style.borderColor = '#cbd5e1';
                        }
                    });

                    btnEditar.disabled = false;
                    btnEditar.textContent = 'Editar Dados';
                    btnEditar.style.background = '#f1f5f9';
                    btnEditar.style.color = '#334155';
                    btnEditar.style.borderColor = '#cbd5e1';

                    mostrarNotificacao('Perfil atualizado com sucesso!', 'sucesso');
                }).catch(err => {
                    btnEditar.disabled = false;
                    btnEditar.textContent = 'Salvar Alterações';
                    mostrarNotificacao('Erro ao salvar alterações: ' + err.message, 'erro');
                });
            }
        });
    }

    // Configurar alteração de senha
    if (btnAlterarSenha) {
        btnAlterarSenha.addEventListener('click', abrirModalAlterarSenhaAdmin);
    }
}

function abrirModalAlterarSenhaAdmin() {
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
        <p style="margin: 0 0 20px 0; font-size: 0.9rem; color: #6b7280;">Defina sua nova senha administrativa abaixo.</p>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <div>
            <input type="password" id="input-nova-senha" placeholder="Digite a nova senha" style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s;" />
          </div>
          <div>
            <input type="password" id="input-confirmar-senha" placeholder="Confirme a nova senha" style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s;" />
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancelar-senha" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit;">Cancelar</button>
          <button id="btn-salvar-senha" style="background: #1062c0; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit;">Salvar</button>
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
        const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados'));

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
                email: usuarioDados.email,
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
