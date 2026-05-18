from flask import Blueprint, request, jsonify, current_app
from middleware.autenticacao import requer_token
from infra.dois_fatores_repository import Dois_FatoresRepository
from infra.usuario_repository import UsuarioRepository
from use_cases.dois_fatores_commands import (
    GenerarCodigoVerificacao2FA,
    VerificarCodigoVerificacao2FA,
    EnviarCodigoVerificacao2FA,
    ReenviarCodigoVerificacao2FA
)
from exceptions import VantrackException
import hashlib
import os
import jwt
from datetime import datetime, timedelta

bp = Blueprint('dois_fatores', __name__, url_prefix='/api/dois-fatores')


def calcular_dispositivo_hash(user_agent, ip_address):
    """Calcula hash único do dispositivo baseado em User-Agent e IP"""
    dados = f"{user_agent}:{ip_address}"
    return hashlib.sha256(dados.encode()).hexdigest()


@bp.route('/gerar', methods=['POST'])
def gerar_codigo():
    """
    Gera novo código 2FA para novo dispositivo
    Body: {
        "usuario_id": "uuid",
        "metodo": "SMS" | "EMAIL"
    }
    """
    try:
        dados = request.get_json()
        usuario_id = dados.get('usuario_id')
        metodo = dados.get('metodo', 'SMS').upper()

        if not usuario_id or metodo not in ['SMS', 'EMAIL']:
            return jsonify({'erro': 'Dados inválidos'}), 400

        # Validar metodo 2FA
        if metodo not in ['SMS', 'EMAIL']:
            return jsonify({'erro': 'Método 2FA inválido'}), 400

        # Calcular hash do dispositivo
        user_agent = request.headers.get('User-Agent', 'unknown')
        ip_address = request.remote_addr
        dispositivo_hash = calcular_dispositivo_hash(user_agent, ip_address)

        # Get repositories
        usuario_repo = UsuarioRepository(current_app.db)
        dois_fatores_repo = Dois_FatoresRepository(current_app.db)

        # Gerar código
        use_case = GenerarCodigoVerificacao2FA(usuario_repo, dois_fatores_repo)
        resultado = use_case.executar(usuario_id, dispositivo_hash, metodo)

        return jsonify(resultado), 201

    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao gerar código 2FA', 'detalhes': str(e)}), 500


@bp.route('/enviar/<dois_fatores_id>', methods=['POST'])
def enviar_codigo(dois_fatores_id):
    """
    Envia código 2FA via SMS ou Email
    """
    try:
        dois_fatores_repo = Dois_FatoresRepository(current_app.db)
        
        use_case = EnviarCodigoVerificacao2FA(dois_fatores_repo)
        resultado = use_case.executar(dois_fatores_id)

        return jsonify(resultado), 200

    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao enviar código 2FA', 'detalhes': str(e)}), 500


@bp.route('/verificar', methods=['POST'])
def verificar_codigo():
    """
    Verifica código 2FA fornecido pelo usuário
    Body: {
        "usuario_id": "uuid",
        "codigo": "123456"
    }
    """
    try:
        dados = request.get_json()
        usuario_id = dados.get('usuario_id')
        codigo_fornecido = dados.get('codigo', '').strip()

        if not usuario_id or not codigo_fornecido:
            return jsonify({'erro': 'Dados inválidos'}), 400

        # Validar formato do código (6 dígitos)
        if not codigo_fornecido.isdigit() or len(codigo_fornecido) != 6:
            return jsonify({'erro': 'Código deve ter 6 dígitos'}), 400

        # Calcular hash do dispositivo
        user_agent = request.headers.get('User-Agent', 'unknown')
        ip_address = request.remote_addr
        dispositivo_hash = calcular_dispositivo_hash(user_agent, ip_address)

        dois_fatores_repo = Dois_FatoresRepository(current_app.db)
        
        use_case = VerificarCodigoVerificacao2FA(dois_fatores_repo)
        resultado = use_case.executar(usuario_id, dispositivo_hash, codigo_fornecido)

        # Gerar o JWT final após a verificação bem-sucedida!
        usuario = UsuarioRepository(current_app.db).buscar_por_id(usuario_id)
        payload = {
            'usuario_id': usuario['id'],
            'email': usuario['email'],
            'tipo_perfil': usuario['tipo_perfil'],
            'exp': datetime.utcnow() + timedelta(minutes=15), # Curta duração
            'iat': datetime.utcnow(),
            'tipo': 'access'
        }
        token = jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')

        # Gerar Refresh Token
        payload_refresh = {
            'usuario_id': usuario['id'],
            'tipo_perfil': usuario['tipo_perfil'],
            'exp': datetime.utcnow() + timedelta(days=7), # Longa duração
            'iat': datetime.utcnow(),
            'tipo': 'refresh'
        }
        refresh_token = jwt.encode(payload_refresh, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')

        return jsonify({
            'status': 'verificado',
            'token': token,
            'refresh_token': refresh_token,
            'usuario_id': usuario_id,
            'dispositivo_hash': dispositivo_hash,
            'verificado_em': use_case.dois_fatores_repository.buscar_ativo_por_usuario_e_dispositivo(usuario_id, dispositivo_hash).verificado_em.isoformat()
        }), 200

    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao verificar código 2FA', 'detalhes': str(e)}), 500


@bp.route('/reenviar/<dois_fatores_id>', methods=['POST'])
def reenviar_codigo(dois_fatores_id):
    """
    Reenvia código 2FA
    """
    try:
        dois_fatores_repo = Dois_FatoresRepository(current_app.db)
        
        use_case = ReenviarCodigoVerificacao2FA(dois_fatores_repo)
        resultado = use_case.executar(dois_fatores_id)

        # Agora envia novamente via Twilio/Email
        enviar_use_case = EnviarCodigoVerificacao2FA(dois_fatores_repo)
        enviar_use_case.executar(dois_fatores_id)

        return jsonify(resultado), 200

    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao reenviar código 2FA', 'detalhes': str(e)}), 500
