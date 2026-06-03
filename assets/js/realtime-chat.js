let socketChat;

const ChatRealtime = {
  alunoIdAtivo: null,

  inicializar: () => {
    const token = localStorage.getItem('auth_token');
    let usuarioID = localStorage.getItem('usuario_id');

    if (!usuarioID) {
      const usuarioJSON = localStorage.getItem('usuario_dados');
      if (usuarioJSON) {
        try {
          const u = JSON.parse(usuarioJSON);
          if (u && u.id) {
            usuarioID = u.id;
            localStorage.setItem('usuario_id', u.id);
          }
        } catch (err) {}
      }
    }

    if (!token || !usuarioID) {
      console.error('Token ou usuário ID não encontrado');
      return;
    }

    socketChat = io('http://localhost:5000/chat', {
      query: {
        token: token,
        usuario_id: usuarioID
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketChat.on('connect', ChatRealtime.onConectado);
    socketChat.on('disconnect', ChatRealtime.onDesconectado);
    socketChat.on('conectado_chat', ChatRealtime.onStatusConectado);
    socketChat.on('nova_mensagem', ChatRealtime.onNovaMensagem);
    socketChat.on('conversa_marcada_lida', ChatRealtime.onConversaMarcadaLida);
    socketChat.on('erro_chat', ChatRealtime.onErro);

    ChatRealtime.setupEventos();
    ChatRealtime.carregarAlunosChat();
  },

  onConectado: () => {
    console.log('Conectado ao servidor de chat');
  },

  onDesconectado: () => {
    console.log('Desconectado do servidor de chat');
    if (typeof mostrarNotificacao === 'function') {
      mostrarNotificacao('Conexão de chat perdida. Tentando reconectar...', 'aviso');
    }
  },

  onStatusConectado: (data) => {
    console.log('Chat Status:', data.status);
  },

  onNovaMensagem: (data) => {
    const { remetente_id, destinatario_id, texto, criado_em } = data;
    const usuarioID = localStorage.getItem('usuario_id');
    
    // Se o modal de suporte estiver aberto e for conversa com admin
    const supportContainer = document.getElementById('suporte-chat-messages-container');
    const suporteModal = document.getElementById('suporte-chat-modal');
    if (suporteModal && suporteModal.style.display === 'flex') {
       const adminId = window.adminSupportId;
       if (remetente_id === adminId || (remetente_id === usuarioID && destinatario_id === adminId)) {
          if (supportContainer) {
              const classe = remetente_id === usuarioID ? 'mensagem-enviada' : 'mensagem-recebida';
              const hora = new Date(criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const divMensagem = document.createElement('div');
              divMensagem.className = classe;
              divMensagem.style.alignSelf = remetente_id === usuarioID ? 'flex-end' : 'flex-start';
              divMensagem.style.background = remetente_id === usuarioID ? '#1062c0' : '#e2e8f0';
              divMensagem.style.color = remetente_id === usuarioID ? 'white' : '#1e293b';
              divMensagem.style.padding = '8px 12px';
              divMensagem.style.borderRadius = remetente_id === usuarioID ? '12px 12px 0 12px' : '12px 12px 12px 0';
              divMensagem.style.maxWidth = '80%';
              divMensagem.style.margin = '4px 0';
              divMensagem.innerHTML = `<p style="margin: 0; font-size: 0.9rem;">${texto}</p><span style="font-size: 0.65rem; opacity: 0.8; display: block; text-align: right; margin-top: 2px;">${hora}</span>`;
              supportContainer.appendChild(divMensagem);
              supportContainer.scrollTop = supportContainer.scrollHeight;
          }
          return;
       }
    }

    // Identificar a qual conversa pertence essa mensagem
    const outroId = remetente_id === usuarioID ? destinatario_id : remetente_id;
    
    // Atualizar visualização do preview na barra lateral do chat
    const previewEl = document.getElementById(`preview-${outroId}`);
    if (previewEl) {
      previewEl.textContent = texto.length > 25 ? texto.substring(0, 25) + '...' : texto;
      previewEl.style.fontWeight = remetente_id !== usuarioID && outroId !== ChatRealtime.alunoIdAtivo ? 'bold' : 'normal';
    }

    // Só acrescentar no chat ativo se pertencer ao aluno selecionado
    if (outroId !== ChatRealtime.alunoIdAtivo) return;

    const containerMensagens = document.getElementById('chat-messages');
    if (!containerMensagens) return;

    const classe = remetente_id === usuarioID ? 'mensagem-enviada' : 'mensagem-recebida';
    const hora = new Date(criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const divMensagem = document.createElement('div');
    divMensagem.className = classe;
    divMensagem.innerHTML = `<p>${texto}</p><span class="hora">${hora}</span>`;

    containerMensagens.appendChild(divMensagem);
    containerMensagens.scrollTop = containerMensagens.scrollHeight;
  },

  onConversaMarcadaLida: (data) => {
    console.log('Conversa marcada como lida');
  },

  onErro: (data) => {
    console.error('Erro no chat:', data.mensagem);
    if (typeof mostrarNotificacao === 'function') {
      mostrarNotificacao(data.mensagem || 'Erro na conexão de chat', 'erro');
    }
  },

  setupEventos: () => {
    const btnEnviar = document.getElementById('send-msg-btn');
    const inputMensagem = document.getElementById('chat-input');

    if (btnEnviar && inputMensagem) {
      btnEnviar.addEventListener('click', ChatRealtime.enviarMensagem);
      inputMensagem.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          ChatRealtime.enviarMensagem();
        }
      });
    }
  },

  carregarAlunosChat: async () => {
    try {
      const res = await fetchAPI('GET', '/dashboard/motorista');
      if (res && res.alunos_hoje) {
        const alunos = res.alunos_hoje;
        const chatList = document.getElementById('chat-list');
        
        if (chatList) {
          chatList.innerHTML = '';
          if (alunos.length === 0) {
            chatList.innerHTML = '<li class="no-conversations" style="padding: 15px; text-align: center; color: #6b7280; font-size: 0.9rem;">Nenhum aluno cadastrado nas suas rotas</li>';
            return;
          }

          alunos.forEach((aluno, idx) => {
            const li = document.createElement('li');
            li.className = `chat-item ${idx === 0 ? 'active' : ''}`;
            li.setAttribute('data-aluno-id', aluno.aluno_id);
            li.innerHTML = `
              <div class="chat-avatar"><i class="fas fa-user"></i></div>
              <div class="chat-info">
                <span class="chat-name">${aluno.aluno_nome}</span>
                <span class="chat-preview" id="preview-${aluno.aluno_id}">Clique para conversar</span>
              </div>
            `;

            li.addEventListener('click', () => {
              document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
              li.classList.add('active');
              ChatRealtime.selecionarAluno(aluno.aluno_id, aluno.aluno_nome);
            });

            chatList.appendChild(li);
            
            // Inscrever de forma prévia para receber alertas
            ChatRealtime.inscreverConversa(aluno.aluno_id);
          });

          // Selecionar primeiro por padrão
          if (alunos.length > 0) {
            ChatRealtime.selecionarAluno(alunos[0].aluno_id, alunos[0].aluno_nome);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar alunos para o chat:', e);
    }
  },

  selecionarAluno: (alunoId, alunoNome) => {
    ChatRealtime.alunoIdAtivo = alunoId;
    
    const contactName = document.getElementById('chat-contact-name');
    if (contactName) contactName.textContent = alunoNome;
    
    const containerMensagens = document.getElementById('chat-messages');
    if (containerMensagens) containerMensagens.innerHTML = '';
    
    // Inscrever e limpar mensagens não lidas
    ChatRealtime.inscreverConversa(alunoId);
    ChatRealtime.marcarComoLida(alunoId);
    
    // Carregar histórico
    ChatRealtime.carregarHistorico(alunoId);
    
    // Remover negrito do preview do aluno selecionado
    const previewEl = document.getElementById(`preview-${alunoId}`);
    if (previewEl) previewEl.style.fontWeight = 'normal';
  },

  carregarHistorico: async (alunoId) => {
    try {
      const res = await fetchAPI('GET', `/dashboard/mensagens/${alunoId}`);
      if (res && res.mensagens) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = '';
        
        const usuarioID = localStorage.getItem('usuario_id');
        res.mensagens.forEach(msg => {
          const classe = msg.remetente_id === usuarioID ? 'mensagem-enviada' : 'mensagem-recebida';
          const hora = new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          const div = document.createElement('div');
          div.className = classe;
          div.innerHTML = `<p>${msg.texto}</p><span class="hora">${hora}</span>`;
          container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
      }
    } catch (e) {
      console.error('Erro ao carregar histórico de chat:', e);
    }
  },

  enviarMensagem: () => {
    const inputMensagem = document.getElementById('chat-input');
    if (!inputMensagem || !inputMensagem.value.trim() || !ChatRealtime.alunoIdAtivo) return;

    socketChat.emit('enviar_mensagem', {
      destinatario_id: ChatRealtime.alunoIdAtivo,
      texto: inputMensagem.value.trim()
    });

    inputMensagem.value = '';
  },

  inscreverConversa: (aluno_id) => {
    socketChat.emit('inscrever_conversa', {
      outro_usuario_id: aluno_id
    });
    console.log('Inscrito na conversa com aluno:', aluno_id);
  },

  marcarComoLida: (aluno_id) => {
    socketChat.emit('marcar_como_lida', {
      outro_usuario_id: aluno_id
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ChatRealtime.inicializar();
});
