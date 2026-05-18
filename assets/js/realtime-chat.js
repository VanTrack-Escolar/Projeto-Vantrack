let socketChat;

const ChatRealtime = {
  inicializar: () => {
    const token = localStorage.getItem('auth_token');
    const usuarioID = localStorage.getItem('usuario_id');

    if (!token || !usuarioID) {
      console.error('Token ou usuário ID não encontrado');
      return;
    }

    socketChat = io('http://localhost:5000/chat', {
      auth: {
        token: token
      },
      query: {
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

  enviarMensagem: () => {
    const inputMensagem = document.getElementById('chat-input');
    const usuarioJSON = localStorage.getItem('usuario_dados');

    if (!inputMensagem || !inputMensagem.value.trim() || !usuarioJSON) return;

    const usuario = JSON.parse(usuarioJSON);
    const destinatarioID = usuario.motorista_id || 'motorista_default';

    socketChat.emit('enviar_mensagem', {
      destinatario_id: destinatarioID,
      texto: inputMensagem.value.trim()
    });

    inputMensagem.value = '';
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
