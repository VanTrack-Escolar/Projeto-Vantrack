from flask import Blueprint, request, jsonify
from middleware.autenticacao import requer_token
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('pagamento_routes', __name__, url_prefix='/api/pagamentos')

@bp.route('/criar', methods=['POST'])
@requer_token
def criar_pagamento():
    """Cria um novo pagamento"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        dados = request.json
        db = current_app.db
        repo = PagamentoRepository(db)

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Apenas admin ou motorista podem criar pagamentos
        if tipo_perfil not in ['admin', 'motorista']:
            return {'erro': 'Acesso negado'}, 403

        pagamento = repo.criar(dados)
        return {'sucesso': True, 'pagamento': pagamento}, 201

    except Exception as e:
        logger.error(f"Erro ao criar pagamento: {e}")
        return {'erro': str(e)}, 500

@bp.route('/<pagamento_id>', methods=['GET'])
@requer_token
def obter_pagamento(pagamento_id):
    """Obtém um pagamento por ID"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        db = current_app.db
        repo = PagamentoRepository(db)

        pagamento = repo.obter_por_id(pagamento_id)
        if not pagamento:
            return {'erro': 'Pagamento não encontrado'}, 404

        return {'sucesso': True, 'pagamento': pagamento}, 200

    except Exception as e:
        logger.error(f"Erro ao obter pagamento: {e}")
        return {'erro': str(e)}, 500

@bp.route('/aluno/<aluno_id>', methods=['GET'])
@requer_token
def obter_pagamentos_aluno(aluno_id):
    """Obtém pagamentos de um aluno"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Aluno só pode ver seus próprios pagamentos
        if tipo_perfil == 'aluno' and usuario_id != aluno_id:
            return {'erro': 'Acesso negado'}, 403

        db = current_app.db
        repo = PagamentoRepository(db)

        pagamentos = repo.obter_por_aluno(aluno_id)
        resumo = repo.obter_resumo_aluno(aluno_id)

        return {
            'sucesso': True,
            'pagamentos': pagamentos,
            'resumo': resumo
        }, 200

    except Exception as e:
        logger.error(f"Erro ao obter pagamentos do aluno: {e}")
        return {'erro': str(e)}, 500

@bp.route('/motorista/<motorista_id>', methods=['GET'])
@requer_token
def obter_pagamentos_motorista(motorista_id):
    """Obtém pagamentos gerenciados por um motorista"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Motorista só pode ver seus próprios pagamentos
        if tipo_perfil == 'motorista' and usuario_id != motorista_id:
            return {'erro': 'Acesso negado'}, 403

        db = current_app.db
        repo = PagamentoRepository(db)

        pagamentos = repo.obter_por_motorista(motorista_id)
        resumo = repo.obter_resumo_motorista(motorista_id)

        return {
            'sucesso': True,
            'pagamentos': pagamentos,
            'resumo': resumo
        }, 200

    except Exception as e:
        logger.error(f"Erro ao obter pagamentos do motorista: {e}")
        return {'erro': str(e)}, 500

@bp.route('/motorista/<motorista_id>/alunos', methods=['GET'])
@requer_token
def obter_alunos_motorista_com_status(motorista_id):
    """Obtém lista de alunos do motorista com status de pagamentos"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Motorista só pode ver seus próprios alunos
        if tipo_perfil == 'motorista' and usuario_id != motorista_id:
            return {'erro': 'Acesso negado'}, 403

        db = current_app.db
        repo = PagamentoRepository(db)

        mes = request.args.get('mes', type=int)
        ano = request.args.get('ano', type=int)

        alunos = repo.obter_alunos_por_motorista_com_status(motorista_id, mes, ano)

        return {
            'sucesso': True,
            'alunos': alunos
        }, 200

    except Exception as e:
        logger.error(f"Erro ao obter alunos do motorista: {e}")
        return {'erro': str(e)}, 500

@bp.route('/<pagamento_id>/pagar', methods=['PUT'])
@requer_token
def pagar_pagamento(pagamento_id):
    """Marca um pagamento como pago"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        dados = request.json
        db = current_app.db
        repo = PagamentoRepository(db)

        pagamento = repo.obter_por_id(pagamento_id)
        if not pagamento:
            return {'erro': 'Pagamento não encontrado'}, 404

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Apenas aluno, motorista ou admin podem pagar
        if tipo_perfil == 'aluno' and usuario_id != pagamento['aluno_id']:
            return {'erro': 'Acesso negado'}, 403

        metodo_pagamento = dados.get('metodo_pagamento', 'dinheiro')
        pagamento_atualizado = repo.atualizar_status(pagamento_id, 'pago', metodo_pagamento)

        return {
            'sucesso': True,
            'pagamento': pagamento_atualizado,
            'mensagem': 'Pagamento realizado com sucesso'
        }, 200

    except Exception as e:
        logger.error(f"Erro ao pagar pagamento: {e}")
        return {'erro': str(e)}, 500

@bp.route('/<pagamento_id>/atualizar', methods=['PUT'])
@requer_token
def atualizar_pagamento(pagamento_id):
    """Atualiza dados de um pagamento"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        dados = request.json
        db = current_app.db
        repo = PagamentoRepository(db)

        tipo_perfil = request.tipo_perfil

        # Apenas admin ou motorista podem atualizar
        if tipo_perfil not in ['admin', 'motorista']:
            return {'erro': 'Acesso negado'}, 403

        pagamento_atualizado = repo.atualizar(pagamento_id, dados)
        if not pagamento_atualizado:
            return {'erro': 'Pagamento não encontrado'}, 404

        return {
            'sucesso': True,
            'pagamento': pagamento_atualizado
        }, 200

    except Exception as e:
        logger.error(f"Erro ao atualizar pagamento: {e}")
        return {'erro': str(e)}, 500

@bp.route('/<pagamento_id>', methods=['DELETE'])
@requer_token
def deletar_pagamento(pagamento_id):
    """Deleta um pagamento"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        db = current_app.db
        repo = PagamentoRepository(db)

        tipo_perfil = request.tipo_perfil

        # Apenas admin pode deletar
        if tipo_perfil != 'admin':
            return {'erro': 'Acesso negado'}, 403

        repo.deletar(pagamento_id)

        return {
            'sucesso': True,
            'mensagem': 'Pagamento deletado com sucesso'
        }, 200

    except Exception as e:
        logger.error(f"Erro ao deletar pagamento: {e}")
        return {'erro': str(e)}, 500

@bp.route('/motorista/<motorista_id>/status/<status>', methods=['GET'])
@requer_token
def obter_pagamentos_por_status(motorista_id, status):
    """Obtém pagamentos do motorista filtrados por status"""
    try:
        from infra.pagamento_repository import PagamentoRepository
        from flask import current_app

        usuario_id = request.usuario_id
        tipo_perfil = request.tipo_perfil

        # Motorista só pode ver seus próprios pagamentos
        if tipo_perfil == 'motorista' and usuario_id != motorista_id:
            return {'erro': 'Acesso negado'}, 403

        db = current_app.db
        repo = PagamentoRepository(db)

        pagamentos = repo.obter_por_motorista_status(motorista_id, status)

        return {
            'sucesso': True,
            'pagamentos': pagamentos,
            'status': status
        }, 200

    except Exception as e:
        logger.error(f"Erro ao obter pagamentos por status: {e}")
        return {'erro': str(e)}, 500
