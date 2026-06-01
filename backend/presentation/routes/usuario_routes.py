from flask import Blueprint, request, jsonify, current_app
from infra.usuario_repository import UsuarioRepository
from use_cases.usuario_queries import ObterUsuario, ListarUsuariosPorTipo, AtualizarPerfil
from middleware.autenticacao import requer_token
from exceptions import VantrackException

bp = Blueprint('usuario', __name__, url_prefix='/api/usuarios')

@bp.route('/<usuario_id>', methods=['GET'])
@requer_token
def obter_usuario(usuario_id):
    try:
        usuario_repo = UsuarioRepository(current_app.db)
        obter_use_case = ObterUsuario(usuario_repo)
        
        resultado = obter_use_case.executar(usuario_id)
        return jsonify(resultado), 200
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 404
    except Exception as e:
        return jsonify({'erro': 'Erro ao obter usuário'}), 500

@bp.route('/tipo/aluno', methods=['GET'])
@requer_token
def listar_alunos():
    try:
        usuario_repo = UsuarioRepository(current_app.db)
        listar_use_case = ListarUsuariosPorTipo(usuario_repo)
        
        resultado = listar_use_case.executar('aluno')
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao listar alunos'}), 500

@bp.route('/tipo/motorista', methods=['GET'])
@requer_token
def listar_motoristas():
    try:
        usuario_repo = UsuarioRepository(current_app.db)
        listar_use_case = ListarUsuariosPorTipo(usuario_repo)
        
        resultado = listar_use_case.executar('motorista')
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao listar motoristas'}), 500

@bp.route('/<usuario_id>', methods=['PUT'])
@requer_token
def atualizar_usuario(usuario_id):
    try:
        dados = request.get_json()
        usuario_repo = UsuarioRepository(current_app.db)
        atualizar_use_case = AtualizarPerfil(usuario_repo)
        
        resultado = atualizar_use_case.executar(usuario_id, dados)
        return jsonify(resultado), 200
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao atualizar usuário'}), 500
