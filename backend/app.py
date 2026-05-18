import os
import sys
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def criar_app():
    app = Flask(__name__)

    from config import config
    env = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[env])

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://"
    )

    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

    from database import Database
    db = Database()
    app.db = db

    from presentation.routes import auth_routes, usuario_routes, veiculo_routes, rota_routes, inscricao_routes, gps_routes, dashboard_routes, dois_fatores_routes
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(usuario_routes.bp)
    app.register_blueprint(veiculo_routes.bp)
    app.register_blueprint(rota_routes.bp)
    app.register_blueprint(inscricao_routes.bp)
    app.register_blueprint(gps_routes.bp)
    app.register_blueprint(dashboard_routes.bp)
    app.register_blueprint(dois_fatores_routes.bp)

    from presentation.sockets.realtime_handlers import RastreamentoSocket, ChatSocket
    
    # Registro de handlers Socket.IO para rastreamento
    @socketio.on('connect', namespace='/rastreamento')
    def rastreamento_connect():
        return RastreamentoSocket.on_connect(socketio)()
    
    @socketio.on('disconnect', namespace='/rastreamento')
    def rastreamento_disconnect():
        return RastreamentoSocket.on_disconnect()()
    
    @socketio.on('atualizar_localizacao', namespace='/rastreamento')
    def rastreamento_atualizar_localizacao(data):
        return RastreamentoSocket.on_atualizar_localizacao(socketio, app)(data)
    
    @socketio.on('inscrever_rota', namespace='/rastreamento')
    def rastreamento_inscrever_rota(data):
        return RastreamentoSocket.on_inscrever_rota(socketio)(data)
    
    @socketio.on('desinscrever_rota', namespace='/rastreamento')
    def rastreamento_desinscrever_rota(data):
        return RastreamentoSocket.on_desinscrever_rota(socketio)(data)
    
    # Registro de handlers Socket.IO para chat
    @socketio.on('connect', namespace='/chat')
    def chat_connect():
        return ChatSocket.on_connect_chat(socketio)()
    
    @socketio.on('disconnect', namespace='/chat')
    def chat_disconnect():
        return ChatSocket.on_disconnect_chat()()
    
    @socketio.on('enviar_mensagem', namespace='/chat')
    def chat_enviar_mensagem(data):
        return ChatSocket.on_enviar_mensagem(socketio, app)(data)
    
    @socketio.on('inscrever_conversa', namespace='/chat')
    def chat_inscrever_conversa(data):
        return ChatSocket.on_inscrever_conversa(socketio)(data)
    
    @socketio.on('marcar_como_lida', namespace='/chat')
    def chat_marcar_como_lida(data):
        return ChatSocket.on_marcar_como_lida(socketio, app)(data)

    @app.errorhandler(404)
    def nao_encontrado(e):
        return {'erro': 'Rota não encontrada'}, 404

    @app.errorhandler(500)
    def erro_interno(e):
        return {'erro': 'Erro interno do servidor'}, 500

    return app, socketio

app, socketio = criar_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
