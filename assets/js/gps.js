requireAuth();

let map=null,marker=null,watchId=null;
let socketRastreamento=null;
const mapContainer='mapa';

document.addEventListener('DOMContentLoaded',()=>{
    initMapa();
    initSocketRastreamento();
    
    if (temPerfil('motorista')) {
        document.getElementById('btn-registrar')?.addEventListener('click',iniciarRastreamentoMotorista);
        document.getElementById('btn-atualizar')?.addEventListener('click',carregarHistorico);
        carregarHistorico();
    } else {
        const btnRegistrar = document.getElementById('btn-registrar');
        const btnAtualizar = document.getElementById('btn-atualizar');
        if (btnRegistrar) btnRegistrar.style.display = 'none';
        if (btnAtualizar) btnAtualizar.style.display = 'none';
    }
});

function initSocketRastreamento() {
    const token = getToken();
    if (!token) return;

    socketRastreamento = io('http://localhost:5000/rastreamento', {
        auth: { token: token },
        reconnection: true
    });

    socketRastreamento.on('connect', () => {
        console.log('Conectado ao socket de rastreamento');
        if (temPerfil('aluno')) {
            const rotaId = document.getElementById('rota-id')?.value || 1;
            socketRastreamento.emit('inscrever_rota', { rota_id: parseInt(rotaId) });
        }
    });

    socketRastreamento.on('disconnect', () => {
        mostrarNotificacao('Conexão de GPS perdida. Tentando reconectar...', 'erro');
    });

    socketRastreamento.on('atualizacao_localizacao', (data) => {
        if (temPerfil('aluno')) {
            console.log('Nova localização recebida:', data);
            atualizarMapa(data.latitude, data.longitude);
        }
    });
}

function iniciarRastreamentoMotorista(){
    if(!navigator.geolocation){mostrarNotificacao('Geolocalização não disponível','erro');return;}
    const btn=document.getElementById('btn-registrar');
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        btn.textContent='Iniciar Rastreamento';
        mostrarNotificacao('Rastreamento pausado', 'info');
        return;
    }
    
    btn.textContent='Rastreando... (Clique para parar)';
    mostrarNotificacao('Rastreamento ativado!', 'sucesso');
    
    const veiculoId = document.getElementById('veiculo-id')?.value || 1;
    
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            atualizarMapa(lat, lng);
            
            if (socketRastreamento && socketRastreamento.connected) {
                socketRastreamento.emit('atualizar_localizacao', {
                    veiculo_id: parseInt(veiculoId),
                    latitude: lat,
                    longitude: lng
                });
            }
        },
        (err) => {
            mostrarNotificacao('Erro no GPS: ' + err.message, 'erro');
            btn.textContent='Iniciar Rastreamento';
            watchId = null;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function initMapa(){
    if(!document.getElementById(mapContainer))return;
    const defLat=-23.5505,defLng=-46.6333,defZoom=14;
    if(typeof mapboxgl!=='undefined'){
        mapboxgl.accessToken='YOUR_MAPBOX_TOKEN';
        map=new mapboxgl.Map({container:mapContainer,style:'mapbox://styles/mapbox/streets-v12',center:[defLng,defLat],zoom:defZoom});
        marker=new mapboxgl.Marker({color:'#ff0000'}).setLngLat([defLng,defLat]).addTo(map);
    }else{
        console.log('Mapbox não carregado, usando fallback');
        document.getElementById(mapContainer).innerHTML='<p>Mapa indisponível. Usando coordenadas numéricas.</p>';
    }
}

function registrarLocalizacao(){
    if(!navigator.geolocation){mostrarNotificacao('Geolocalização não disponível','erro');return;}
    const btn=document.getElementById('btn-registrar');btn.disabled=true;btn.textContent='Obtendo localização...';
    navigator.geolocation.getCurrentPosition(async pos=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        if(!validarCoordenadas(lat,lng)){mostrarNotificacao('Coordenadas inválidas','erro');btn.disabled=false;btn.textContent='Registrar Localização';return;}
        try{
            const r=await fetchAPI('POST','/gps/registrar',{latitude:lat,longitude:lng,veiculo_id:document.getElementById('veiculo-id')?.value||1});
            if(r){mostrarNotificacao('Localização registrada!','sucesso');atualizarMapa(lat,lng);carregarHistorico();}
        }catch(e){mostrarNotificacao(e.message||'Erro ao registrar','erro');}finally{btn.disabled=false;btn.textContent='Registrar Localização';}
    },e=>{mostrarNotificacao('Erro ao obter localização: '+e.message,'erro');btn.disabled=false;btn.textContent='Registrar Localização';});
}

function atualizarMapa(lat,lng){
    if(map&&marker){
        const pt=[lng,lat];
        marker.setLngLat(pt);
        map.easeTo({center:pt,duration:500});
    }
}

async function carregarHistorico(){
    try{
        const vId=document.getElementById('veiculo-id')?.value||1;
        const r=await fetchAPI('GET',`/gps/${vId}/historico`);
        if(r&&r.localizacoes){
            const tb=document.getElementById('tabela-historico')||criarTabelaHistorico();
            const tbody=tb.querySelector('tbody');
            tbody.innerHTML='';
            r.localizacoes.slice(0,50).forEach(loc=>{
                const tr=document.createElement('tr');
                tr.innerHTML=`<td>${formatarData(loc.timestamp)}</td><td>${loc.latitude}</td><td>${loc.longitude}</td><td>${formatarHora(loc.timestamp)}</td>`;
                tbody.appendChild(tr);
            });
        }
    }catch(e){console.error('Erro histórico:',e);}
}

function criarTabelaHistorico(){
    const c=document.getElementById('container-historico')||document.body;
    const t=document.createElement('table');
    t.id='tabela-historico';
    t.innerHTML='<thead><tr><th>Data</th><th>Latitude</th><th>Longitude</th><th>Hora</th></tr></thead><tbody></tbody>';
    c.appendChild(t);
    return t;
}

window.addEventListener("beforeunload", () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
});
