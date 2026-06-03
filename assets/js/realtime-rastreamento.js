let socketRastreamento;
let mapInstance;
let marcadorVan;
let rotaAtual;

const RastreamentoRealtime = {
  inicializar: () => {
    const token = localStorage.getItem('auth_token');
    const usuarioID = localStorage.getItem('usuario_id');

    if (!token || !usuarioID) {
      console.error('Token ou usuário ID não encontrado');
      return;
    }

    socketRastreamento = io('http://localhost:5000/rastreamento', {
      query: {
        token: token,
        usuario_id: usuarioID
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRastreamento.on('connect', RastreamentoRealtime.onConectado);
    socketRastreamento.on('disconnect', RastreamentoRealtime.onDesconectado);
    socketRastreamento.on('conectado', RastreamentoRealtime.onStatusConectado);
    socketRastreamento.on('localizacao_atualizada', RastreamentoRealtime.onLocalizacaoAtualizada);
    socketRastreamento.on('erro', RastreamentoRealtime.onErro);
  },

  inicializarMapa: () => {
    const container = document.getElementById('mapa-rastreamento');
    if (!container) return;

    if (mapInstance) return;

    // Remover placeholder de carregamento e ajustar layout
    container.innerHTML = '';
    container.style.display = 'block';

    // Inicializar mapa Leaflet
    mapInstance = L.map('mapa-rastreamento').setView([-23.5505, -46.6333], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    const vanIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="position: relative;"><div class="van-pulse-ring"></div><div style="background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid #0f6cd5; position: relative; z-index: 10;"><i class="fas fa-van-shuttle" style="font-size: 20px; color: #0f6cd5;"></i></div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    marcadorVan = L.marker([-23.5505, -46.6333], { icon: vanIcon }).addTo(mapInstance);
    marcadorVan.bindPopup('<strong>Van</strong><br>Aguardando localização...').openPopup();

    // Obter geolocalização em tempo real do Aluno/Pais para centralização inicial
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Centralizar mapa na localização real do usuário
          mapInstance.setView([lat, lng], 14);

          // Criar marcador para o Usuário
          const userIcon = L.divIcon({
            className: 'user-location-icon',
            html: '<div style="background: #0284c7; border: 2px solid white; border-radius: 50%; width: 16px; height: 16px; box-shadow: 0 0 10px rgba(2, 132, 199, 0.6); animation: userLocationPulse 2s infinite;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          L.marker([lat, lng], { icon: userIcon }).addTo(mapInstance)
            .bindPopup('<strong>Sua Localização</strong>').openPopup();
        },
        (err) => {
          console.warn('Não foi possível obter geolocalização do aluno:', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  },

  onConectado: () => {
    console.log('Conectado ao servidor de rastreamento');
    const statusEl = document.getElementById('status-conexao');
    if (statusEl) {
      statusEl.innerHTML = '<span class="pulse-status-dot conectado"></span> Conectado';
    }

    RastreamentoRealtime.inicializarMapa();
    RastreamentoRealtime.inscreverRota();
  },

  onDesconectado: () => {
    console.log('Desconectado do servidor de rastreamento');
    const statusEl = document.getElementById('status-conexao');
    if (statusEl) {
      statusEl.innerHTML = '<span class="pulse-status-dot desconectado"></span> Desconectado';
    }
  },

  onStatusConectado: (data) => {
    console.log('Status:', data.status);
  },

  onLocalizacaoAtualizada: (data) => {
    if (!mapInstance || !marcadorVan) return;

    const { latitude, longitude, velocidade, timestamp } = data;

    marcadorVan.setLatLng([latitude, longitude]);
    mapInstance.setView([latitude, longitude]);

    const popupContent = `<strong>Van</strong><br>
      Lat: ${latitude.toFixed(4)}<br>
      Lon: ${longitude.toFixed(4)}<br>
      Vel: ${velocidade || 0} km/h<br>
      Hora: ${new Date(timestamp).toLocaleTimeString()}`;

    marcadorVan.setPopupContent(popupContent);

    console.log('Localização atualizada:', latitude, longitude);
  },

  onErro: (data) => {
    console.error('Erro do servidor:', data.mensagem);
  },

  inscreverRota: async () => {
    try {
      const res = await fetchAPI('GET', '/dashboard/aluno');
      let rotaID = 'default_rota';
      
      if (res && res.rota_atual) {
        rotaID = res.rota_atual.id;
        
        // Atualizar localStorage para manter consistente
        const usuarioJSON = localStorage.getItem('usuario_dados');
        if (usuarioJSON) {
          const usuario = JSON.parse(usuarioJSON);
          usuario.rota_id = rotaID;
          localStorage.setItem('usuario_dados', JSON.stringify(usuario));
        }
      }
      
      socketRastreamento.emit('inscrever_rota', { rota_id: rotaID });
      console.log('Inscrito na rota:', rotaID);
    } catch (e) {
      console.error('Erro ao inscrever na rota:', e);
      socketRastreamento.emit('inscrever_rota', { rota_id: 'default_rota' });
    }
  },

  desinscreverRota: () => {
    const usuarioJSON = localStorage.getItem('usuario_dados');
    let rotaID = 'default_rota';
    if (usuarioJSON) {
      const usuario = JSON.parse(usuarioJSON);
      rotaID = usuario.rota_id || 'default_rota';
    }
    socketRastreamento.emit('desinscrever_rota', { rota_id: rotaID });
    console.log('Desinscrito da rota:', rotaID);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RastreamentoRealtime.inicializarMapa();
  RastreamentoRealtime.inicializar();
});
