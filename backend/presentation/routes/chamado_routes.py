from flask import Blueprint, request, jsonify, current_app
from infra.chamado_repository import ChamadoRepository
from middleware.autenticacao import requer_token

bp = Blueprint('chamados', __name__, url_prefix='/api/chamados')

@bp.route('', methods=['POST'])
@requer_token
def criar_chamado():
    try:
        usuario_id = request.usuario_id
        dados = request.get_json() or {}
        
        assunto = dados.get('assunto', '').strip()
        descricao = dados.get('descricao', '').strip()
        
        if not assunto or not descricao:
            return jsonify({'erro': 'Assunto e descrição são obrigatórios'}), 400
            
        repo = ChamadoRepository(current_app.db)
        chamado = repo.criar(usuario_id, assunto, descricao)
        
        # Formatar datas para JSON
        if chamado:
            for campo in ['criado_em', 'atualizado_em']:
                if chamado.get(campo):
                    chamado[campo] = chamado[campo].isoformat()
        
        return jsonify(chamado), 201
    except Exception as e:
        return jsonify({'erro': f'Erro ao criar chamado: {str(e)}'}), 500

@bp.route('', methods=['GET'])
@requer_token
def listar_chamados():
    try:
        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil
        
        repo = ChamadoRepository(current_app.db)
        if tipo_perfil == 'admin':
            chamados = repo.listar_todos()
        else:
            chamados = repo.listar_por_usuario(usuario_id)
            
        # Formatar datas para JSON
        for c in chamados:
            for campo in ['criado_em', 'atualizado_em']:
                if c.get(campo):
                    c[campo] = c[campo].isoformat()
                    
        return jsonify(chamados), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao listar chamados: {str(e)}'}), 500

@bp.route('/<id>', methods=['GET'])
@requer_token
def obter_chamado(id):
    try:
        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil
        
        repo = ChamadoRepository(current_app.db)
        chamado = repo.buscar_por_id(id)
        
        if not chamado:
            return jsonify({'erro': 'Chamado não encontrado'}), 404
            
        if tipo_perfil != 'admin' and chamado['usuario_id'] != usuario_id:
            return jsonify({'erro': 'Acesso negado'}), 403
            
        for campo in ['criado_em', 'atualizado_em']:
            if chamado.get(campo):
                chamado[campo] = chamado[campo].isoformat()
                
        return jsonify(chamado), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao obter chamado: {str(e)}'}), 500

@bp.route('/<id>/status', methods=['PUT'])
@requer_token
def atualizar_status(id):
    try:
        tipo_perfil = request.tipo_perfil
        if tipo_perfil != 'admin':
            return jsonify({'erro': 'Acesso restrito a administradores'}), 403
            
        dados = request.get_json() or {}
        status = dados.get('status')
        if status not in ['aberto', 'em_atendimento', 'resolvido']:
            return jsonify({'erro': 'Status inválido'}), 400
            
        repo = ChamadoRepository(current_app.db)
        chamado = repo.atualizar_status(id, status)
        
        if chamado:
            for campo in ['criado_em', 'atualizado_em']:
                if chamado.get(campo):
                    chamado[campo] = chamado[campo].isoformat()
                    
        return jsonify(chamado), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao atualizar status do chamado: {str(e)}'}), 500

@bp.route('/admin-id', methods=['GET'])
@requer_token
def obter_admin_id():
    try:
        db = current_app.db
        admin = db.execute_query_one("SELECT id FROM usuarios WHERE tipo_perfil = 'admin' AND ativo = TRUE LIMIT 1")
        if admin:
            return jsonify({'admin_id': admin['id']}), 200
        else:
            return jsonify({'erro': 'Nenhum administrador encontrado'}), 404
    except Exception as e:
        return jsonify({'erro': f'Erro ao obter ID do administrador: {str(e)}'}), 500
