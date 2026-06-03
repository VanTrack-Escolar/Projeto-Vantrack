let socketChat;

const ChatRealtime = {
  motoristaId: null,

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
    ChatRealtime.obterDadosMotorista();
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
    const { remetente_id, texto, criado_em } = data;
    const usuarioID = localStorage.getItem('usuario_id');
    const containerMensagens = document.getElementById('chat-messages-motorista');

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
    const btnEnviar = document.getElementById('send-msg-btn-motorista');
    const inputMensagem = document.getElementById('chat-input-motorista');

    if (btnEnviar && inputMensagem) {
      btnEnviar.addEventListener('click', ChatRealtime.enviarMensagem);
      inputMensagem.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          ChatRealtime.enviarMensagem();
        }
      });
    }
  },

  obterDadosMotorista: async () => {
    try {
      const res = await fetchAPI('GET', '/dashboard/aluno');
      if (res && res.motorista) {
        const motorista = res.motorista;
        ChatRealtime.motoristaId = motorista.id;
        
        // Atualizar nomes na interface
        const nomeChat = document.getElementById('motorista-nome-chat');
        if (nomeChat) nomeChat.textContent = motorista.nome;
        
        const nomeStatus = document.getElementById('motorista-nome-status');
        if (nomeStatus) nomeStatus.textContent = motorista.nome;
        
        // Inscrever na conversa em tempo real
        ChatRealtime.inscreverConversa(motorista.id);
        
        // Carregar histórico
        ChatRealtime.carregarHistorico(motorista.id);
      }
    } catch (e) {
      console.error('Erro ao obter dados do motorista para o chat:', e);
    }
  },

  carregarHistorico: async (motoristaId) => {
    try {
      const res = await fetchAPI('GET', `/dashboard/mensagens/${motoristaId}`);
      if (res && res.mensagens) {
        const container = document.getElementById('chat-messages-motorista');
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
      console.error('Erro ao carregar histórico:', e);
    }
  },

  enviarMensagem: () => {
    const inputMensagem = document.getElementById('chat-input-motorista');
    if (!inputMensagem || !inputMensagem.value.trim() || !ChatRealtime.motoristaId) return;

    socketChat.emit('enviar_mensagem', {
      destinatario_id: ChatRealtime.motoristaId,
      texto: inputMensagem.value.trim()
    });

    inputMensagem.value = '';
  },

  enviarMensagemRapida: (texto) => {
    if (!socketChat || !ChatRealtime.motoristaId) {
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Atenção: Nenhum motorista vinculado para enviar mensagens.', 'aviso');
      }
      return;
    }

    socketChat.emit('enviar_mensagem', {
      destinatario_id: ChatRealtime.motoristaId,
      texto: texto
    });
  },

  inscreverConversa: (motorista_id) => {
    socketChat.emit('inscrever_conversa', {
      outro_usuario_id: motorista_id
    });
    console.log('Inscrito na conversa com:', motorista_id);
  },

  marcarComoLida: (motorista_id) => {
    socketChat.emit('marcar_como_lida', {
      outro_usuario_id: motorista_id
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ChatRealtime.inicializar();
});
