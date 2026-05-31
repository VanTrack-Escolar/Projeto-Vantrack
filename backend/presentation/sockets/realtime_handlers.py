from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from datetime import datetime
from infra.localizacao_gps_repository import LocalizacaoGPSRepository
from infra.mensagem_chat_repository import MensagemChatRepository
from infra.usuario_repository import UsuarioRepository
from domain.dashboard import MensagemChat

class RastreamentoSocket:
    conexoes_ativas = {}
    
    @staticmethod
    def on_connect(socketio):
        def handle_connect():
            token = request.args.get('token')
            usuario_id = request.args.get('usuario_id')
            
            if not token or not usuario_id:
                disconnect()
                return False
            
            RastreamentoSocket.conexoes_ativas[usuario_id] = request.sid
            emit('conectado', {'status': 'conectado ao rastreamento'})
        
        return handle_connect
    
    @staticmethod
    def on_disconnect():
        def handle_disconnect():
            for usuario_id, sid in RastreamentoSocket.conexoes_ativas.items():
                if sid == request.sid:
                    del RastreamentoSocket.conexoes_ativas[usuario_id]
                    break
        
        return handle_disconnect
    
    @staticmethod
    def on_atualizar_localizacao(socketio, app):
        def handle_atualizar_localizacao(data):
            try:
                veiculo_id = data.get('veiculo_id')
                latitude = data.get('latitude')
                longitude = data.get('longitude')
                velocidade = data.get('velocidade')
                direcao = data.get('direcao')
                precisao = data.get('precisao')
                
                if not all([veiculo_id, latitude, longitude]):
                    emit('erro', {'mensagem': 'Dados de localização inválidos'})
                    return
                
                with app.app_context():
                    localizacao_repo = LocalizacaoGPSRepository(app.db)
                    localizacao = localizacao_repo.criar(veiculo_id, latitude, longitude, velocidade, direcao, precisao)
                
                socketio.emit('localizacao_atualizada', {
                    'veiculo_id': veiculo_id,
                    'latitude': latitude,
                    'longitude': longitude,
                    'velocidade': velocidade,
                    'direcao': direcao,
                    'precisao': precisao,
                    'timestamp': datetime.utcnow().isoformat()
                }, broadcast=True)
            
            except Exception as e:
                emit('erro', {'mensagem': f'Erro ao atualizar localização: {str(e)}'})
        
        return handle_atualizar_localizacao
    
    @staticmethod
    def on_inscrever_rota(socketio):
        def handle_inscrever_rota(data):
            rota_id = data.get('rota_id')
            if not rota_id:
                emit('erro', {'mensagem': 'Rota não especificada'})
                return
            
            room = f'rota_{rota_id}'
            join_room(room)
            emit('inscrito_rota', {'rota_id': rota_id, 'room': room})
        
        return handle_inscrever_rota
    
    @staticmethod
    def on_desinscrever_rota(socketio):
        def handle_desinscrever_rota(data):
            rota_id = data.get('rota_id')
            if not rota_id:
                return
            
            room = f'rota_{rota_id}'
            leave_room(room)
            emit('desinscritos_rota', {'rota_id': rota_id})
        
        return handle_desinscrever_rota


class ChatSocket:
    conversas_ativas = {}
    
    @staticmethod
    def on_connect_chat(socketio):
        def handle_connect():
            usuario_id = request.args.get('usuario_id')
            token = request.args.get('token')
            
            if not usuario_id or not token:
                disconnect()
                return False
            
            ChatSocket.conversas_ativas[usuario_id] = request.sid
            emit('conectado_chat', {'status': 'conectado ao chat'})
        
        return handle_connect
    
    @staticmethod
    def on_enviar_mensagem(socketio, app):
        def handle_enviar_mensagem(data):
            try:
                remetente_id = request.args.get('usuario_id')
                destinatario_id = data.get('destinatario_id')
                texto = data.get('texto')
                
                if not all([remetente_id, destinatario_id, texto]):
                    emit('erro_chat', {'mensagem': 'Dados de mensagem inválidos'})
                    return
                
                with app.app_context():
                    mensagem_repo = MensagemChatRepository(app.db)
                    mensagem = MensagemChat.criar(remetente_id, destinatario_id, texto)
                    resultado = mensagem_repo.criar(mensagem)
                
                room = f'chat_{min(remetente_id, destinatario_id)}_{max(remetente_id, destinatario_id)}'
                socketio.emit('nova_mensagem', {
                    'id': resultado['id'],
                    'remetente_id': remetente_id,
                    'destinatario_id': destinatario_id,
                    'texto': texto,
                    'criado_em': resultado['criado_em'].isoformat() if isinstance(resultado['criado_em'], datetime) else resultado['criado_em'],
                    'lido': False
                }, room=room)
            
            except Exception as e:
                emit('erro_chat', {'mensagem': f'Erro ao enviar mensagem: {str(e)}'})
        
        return handle_enviar_mensagem
    
    @staticmethod
    def on_inscrever_conversa(socketio):
        def handle_inscrever_conversa(data):
            usuario_id = request.args.get('usuario_id')
            outro_usuario_id = data.get('outro_usuario_id')
            
            if not usuario_id or not outro_usuario_id:
                emit('erro_chat', {'mensagem': 'Usuários não especificados'})
                return
            
            room = f'chat_{min(usuario_id, outro_usuario_id)}_{max(usuario_id, outro_usuario_id)}'
            join_room(room)
            emit('inscrito_conversa', {'outro_usuario_id': outro_usuario_id, 'room': room})
        
        return handle_inscrever_conversa
    
    @staticmethod
    def on_marcar_como_lida(socketio, app):
        def handle_marcar_como_lida(data):
            try:
                usuario_id = request.args.get('usuario_id')
                outro_usuario_id = data.get('outro_usuario_id')
                
                if not usuario_id or not outro_usuario_id:
                    return
                
                with app.app_context():
                    mensagem_repo = MensagemChatRepository(app.db)
                    mensagem_repo.marcar_conversa_como_lida(usuario_id, outro_usuario_id)
                
                room = f'chat_{min(usuario_id, outro_usuario_id)}_{max(usuario_id, outro_usuario_id)}'
                socketio.emit('conversa_marcada_lida', {'usuario_id': usuario_id}, room=room)
            
            except Exception as e:
                emit('erro_chat', {'mensagem': f'Erro ao marcar como lida: {str(e)}'})
        
        return handle_marcar_como_lida
    
    @staticmethod
    def on_disconnect_chat():
        def handle_disconnect():
            for usuario_id, sid in ChatSocket.conversas_ativas.items():
                if sid == request.sid:
                    del ChatSocket.conversas_ativas[usuario_id]
                    break
        
        return handle_disconnect
