from flask import Blueprint, request, jsonify, current_app
from infra.usuario_repository import UsuarioRepository
from infra.dois_fatores_repository import Dois_FatoresRepository
from use_cases.autenticar_usuario import AutenticarUsuario, CadastrarUsuario, RecuperarSenha
from use_cases.dois_fatores_commands import GenerarCodigoVerificacao2FA, EnviarCodigoVerificacao2FA
from use_cases.validators import validar_email, validar_cpf, validar_telefone, validar_senha
from domain.usuario import UsuarioCreate, UsuarioLogin, UsuarioRecuperarSenha
from exceptions import VantrackException
import os
import hashlib
import traceback
import logging
import jwt
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__, url_prefix='/api')

@bp.route('/cadastro', methods=['POST'])
def cadastro():
    """
    Endpoint de cadastro de usuários (aluno ou motorista).
    Espera payload JSON com: nome, cpf, email, telefone, cidade, tipo_perfil, senha
    """
    try:
        # Extrai dados do JSON
        dados = request.get_json()
        print(f"\n[CADASTRO] Dados recebidos: {dados}")
        
        if dados is None:
            print("[CADASTRO] ✗ Body JSON vazio ou inválido")
            return jsonify({'erro': 'Corpo da requisição deve ser JSON válido'}), 400
        
        # Validação básica - Verifica presença de campos obrigatórios
        campos_obrigatorios = ['email', 'cpf', 'nome', 'telefone', 'cidade', 'tipo_perfil', 'senha']
        campos_faltando = [c for c in campos_obrigatorios if c not in dados]
        
        if campos_faltando:
            print(f"[CADASTRO] ✗ Campos faltando: {campos_faltando}")
            return jsonify({'erro': f'Campos obrigatórios faltando: {", ".join(campos_faltando)}'}), 400
        
        # VALIDAÇÃO CRÍTICA: Verifica se os campos estão vazios ou são None
        # Isso evita erros falsos de duplicidade no banco de dados
        campos_vazios = []
        for campo in campos_obrigatorios:
            valor = dados.get(campo)
            if valor is None or (isinstance(valor, str) and len(valor.strip()) == 0):
                campos_vazios.append(campo)
        
        if campos_vazios:
            print(f"[CADASTRO] ✗ Campos vazios: {campos_vazios}")
            return jsonify({'erro': f'Campos obrigatórios estão vazios: {", ".join(campos_vazios)}'}), 400
        
        # VALIDAÇÃO DUPLA (Frontend/Backend)
        try:
            validar_email(dados.get('email', ''))
            validar_cpf(dados.get('cpf', ''))
            validar_telefone(dados.get('telefone', ''))
            validar_senha(dados.get('senha', ''))
        except ValueError as e:
            print(f"[CADASTRO] ✗ Erro de validação: {str(e)}")
            return jsonify({'erro': str(e)}), 400
        
        # Criar objeto UsuarioCreate
        print("[CADASTRO] Criando objeto UsuarioCreate...")
        usuario_create = UsuarioCreate(**dados)
        
        # Preparar repository e use case
        print("[CADASTRO] Inicializando repository e use case...")
        usuario_repo = UsuarioRepository(current_app.db)
        cadastrar_use_case = CadastrarUsuario(usuario_repo)
        
        # Executar cadastro
        print("[CADASTRO] Executando cadastro...")
        resultado = cadastrar_use_case.executar(usuario_create)
        
        print(f"[CADASTRO] ✓ Sucesso! ID: {resultado.get('id')}")
        return jsonify(resultado), 201
    
    except VantrackException as e:
        erro_msg = str(e)
        print(f"[CADASTRO] ✗ VantrackException: {erro_msg}")
        return jsonify({'erro': erro_msg}), 400
    
    except Exception as e:
        erro_msg = str(e)
        logger.error(f"[CADASTRO] ✗ Erro genérico: {erro_msg}\n{traceback.format_exc()}")
        print(f"\n[CADASTRO] ✗ ERRO NO CADASTRO: {erro_msg}")
        print(f"[CADASTRO] StackTrace:\n{traceback.format_exc()}\n")
        return jsonify({'erro': f'Falha ao cadastrar usuário: {erro_msg}'}), 500

@bp.route('/login', methods=['POST'])
def login():
    try:
        dados = request.get_json()
        
        if 'email' not in dados or 'senha' not in dados:
            return jsonify({'erro': 'Email e senha são obrigatórios'}), 400
        
        usuario_login = UsuarioLogin(**dados)
        usuario_repo = UsuarioRepository(current_app.db)
        autenticar_use_case = AutenticarUsuario(usuario_repo)
        
        resultado = autenticar_use_case.executar(usuario_login.email, usuario_login.senha)
        
        # IMPLEMENTAÇÃO DO 2FA (Passo 3)
        user_agent = request.headers.get('User-Agent', 'unknown')
        ip_address = request.remote_addr
        dispositivo_hash = hashlib.sha256(f"{user_agent}:{ip_address}".encode()).hexdigest()
        
        dois_fatores_repo = Dois_FatoresRepository(current_app.db)
        
        # Gerar código OTP para envio por EMAIL
        gerar_2fa = GenerarCodigoVerificacao2FA(usuario_repo, dois_fatores_repo)
        codigo_info = gerar_2fa.executar(resultado['usuario']['id'], dispositivo_hash, 'EMAIL')
        
        # Enviar o código (Simulado no terminal ou via SMTP)
        enviar_2fa = EnviarCodigoVerificacao2FA(dois_fatores_repo)
        enviar_2fa.executar(codigo_info['dois_fatores_id'])
        
        # Retorna o temp_token em vez do JWT final (usamos o JWT como token temporário restrito por sessão no frontend)
        return jsonify({
            'requer_2fa': True,
            'dois_fatores_id': codigo_info['dois_fatores_id'],
            'usuario_id': resultado['usuario']['id'],
            'metodo': 'EMAIL',
            'email_mascarado': codigo_info['email_mascarado'],
            'temp_token': resultado['token'],
            'usuario': resultado['usuario']
        }), 206
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 401
    except Exception as e:
        logger.error(f"Erro ao fazer login: {str(e)}\n{traceback.format_exc()}")
        print(f"ERRO NO LOGIN: {e}")
        print(traceback.format_exc())
        return jsonify({'erro': 'Erro ao fazer login'}), 500

@bp.route('/recuperar-senha', methods=['POST'])
def recuperar_senha():
    try:
        dados = request.get_json()
        
        if 'email' not in dados or 'nova_senha' not in dados:
            return jsonify({'erro': 'Email e nova_senha são obrigatórios'}), 400
        
        usuario_recuperar = UsuarioRecuperarSenha(**dados)
        usuario_repo = UsuarioRepository(current_app.db)
        recuperar_use_case = RecuperarSenha(usuario_repo)
        
        resultado = recuperar_use_case.executar(usuario_recuperar.email, usuario_recuperar.nova_senha)
        return jsonify(resultado), 200
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao recuperar senha'}), 500

@bp.route('/refresh', methods=['POST'])
def refresh_token():
    try:
        dados = request.get_json()
        refresh_token = dados.get('refresh_token')
        if not refresh_token:
            return jsonify({'erro': 'Refresh token ausente'}), 400
            
        payload = jwt.decode(refresh_token, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithms=['HS256'])
        if payload.get('tipo') != 'refresh':
            return jsonify({'erro': 'Token inválido'}), 401
            
        novo_payload = {
            'usuario_id': payload['usuario_id'],
            'tipo_perfil': payload['tipo_perfil'],
            'exp': datetime.utcnow() + timedelta(hours=24), # Token de curta duração
            'iat': datetime.utcnow(),
            'tipo': 'access'
        }
        novo_token = jwt.encode(novo_payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')
        
        return jsonify({'token': novo_token}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'erro': 'Refresh token expirado. Faça login novamente.'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'erro': 'Refresh token inválido'}), 401
