from flask import Blueprint, request, jsonify, current_app
from infra.endereco_repository import EnderecoRepository
from infra.presenca_diaria_repository import PresencaDiariaRepository
from infra.mensagem_chat_repository import MensagemChatRepository
from infra.usuario_repository import UsuarioRepository
from infra.rota_repository import RotaRepository
from infra.inscricao_repository import InscricaoRepository
from infra.veiculo_repository import VeiculoRepository
from infra.localizacao_gps_repository import LocalizacaoGPSRepository
from use_cases.dashboard_commands import (
    ObtenerDashboardMotorista,
    ObtenerDashboardAluno,
    ConfirmarPresenca,
    EnviarMensagem,
    ObtenerConversa,
    ListarMensagensNaoLidas,
    AtualizarEndereco
)
from middleware.autenticacao import requer_token, requer_perfil
from exceptions import VantrackException

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/motorista', methods=['GET'])
@requer_token
@requer_perfil('motorista')
def dashboard_motorista():
    try:
        motorista_id = request.usuario_id
        
        usuario_repo = UsuarioRepository(current_app.db)
        rota_repo = RotaRepository(current_app.db)
        inscricao_repo = InscricaoRepository(current_app.db)
        presenca_repo = PresencaDiariaRepository(current_app.db)
        mensagem_repo = MensagemChatRepository(current_app.db)
        
        use_case = ObtenerDashboardMotorista(
            usuario_repo, rota_repo, inscricao_repo, presenca_repo, mensagem_repo
        )
        
        resultado = use_case.executar(motorista_id)
        return jsonify(resultado), 200
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 403
    except Exception as e:
        return jsonify({'erro': 'Erro ao obter dashboard do motorista'}), 500

@bp.route('/aluno', methods=['GET'])
@requer_token
@requer_perfil('aluno')
def dashboard_aluno():
    try:
        aluno_id = request.usuario_id
        
        usuario_repo = UsuarioRepository(current_app.db)
        inscricao_repo = InscricaoRepository(current_app.db)
        presenca_repo = PresencaDiariaRepository(current_app.db)
        endereco_repo = EnderecoRepository(current_app.db)
        rota_repo = RotaRepository(current_app.db)
        veiculo_repo = VeiculoRepository(current_app.db)
        localizacao_repo = LocalizacaoGPSRepository(current_app.db)
        
        use_case = ObtenerDashboardAluno(
            usuario_repo, inscricao_repo, presenca_repo, endereco_repo, 
            rota_repo, veiculo_repo, localizacao_repo
        )
        
        resultado = use_case.executar(aluno_id)
        return jsonify(resultado), 200
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 403
    except Exception as e:
        return jsonify({'erro': 'Erro ao obter dashboard do aluno'}), 500

@bp.route('/presenca', methods=['POST'])
@requer_token
@requer_perfil('aluno')
def confirmar_presenca():
    try:
        aluno_id = request.usuario_id
        dados = request.get_json()
        
        if 'vai_embarcar' not in dados:
            return jsonify({'erro': 'Campo vai_embarcar é obrigatório'}), 400
        
        inscricao_repo = InscricaoRepository(current_app.db)
        presenca_repo = PresencaDiariaRepository(current_app.db)
        usuario_repo = UsuarioRepository(current_app.db)
        
        use_case = ConfirmarPresenca(presenca_repo, inscricao_repo, usuario_repo)
        resultado = use_case.executar(aluno_id, dados['vai_embarcar'])
        
        return jsonify(resultado), 201
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao confirmar presença'}), 500

@bp.route('/mensagens', methods=['POST'])
@requer_token
def enviar_mensagem():
    try:
        remetente_id = request.usuario_id
        dados = request.get_json()
        
        if 'destinatario_id' not in dados or 'texto' not in dados:
            return jsonify({'erro': 'Campos obrigatórios faltando'}), 400
        
        mensagem_repo = MensagemChatRepository(current_app.db)
        usuario_repo = UsuarioRepository(current_app.db)
        
        use_case = EnviarMensagem(mensagem_repo, usuario_repo)
        resultado = use_case.executar(remetente_id, dados['destinatario_id'], dados['texto'])
        
        return jsonify(resultado), 201
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao enviar mensagem'}), 500

@bp.route('/mensagens/<outro_usuario_id>', methods=['GET'])
@requer_token
def obter_conversa(outro_usuario_id):
    try:
        usuario_id = request.usuario_id
        limit = request.args.get('limit', 50, type=int)
        
        mensagem_repo = MensagemChatRepository(current_app.db)
        usuario_repo = UsuarioRepository(current_app.db)
        
        use_case = ObtenerConversa(mensagem_repo, usuario_repo)
        resultado = use_case.executar(usuario_id, outro_usuario_id, limit)
        
        return jsonify(resultado), 200
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao obter conversa'}), 500

@bp.route('/mensagens-nao-lidas', methods=['GET'])
@requer_token
def listar_nao_lidas():
    try:
        usuario_id = request.usuario_id
        
        mensagem_repo = MensagemChatRepository(current_app.db)
        usuario_repo = UsuarioRepository(current_app.db)
        
        use_case = ListarMensagensNaoLidas(mensagem_repo, usuario_repo)
        resultado = use_case.executar(usuario_id)
        
        return jsonify(resultado), 200
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao listar mensagens não lidas'}), 500

@bp.route('/endereco', methods=['POST'])
@requer_token
@requer_perfil('aluno')
def atualizar_endereco():
    try:
        aluno_id = request.usuario_id
        dados = request.get_json()
        
        campos_obrigatorios = ['endereco_coleta', 'endereco_entrega']
        if not all(campo in dados for campo in campos_obrigatorios):
            return jsonify({'erro': 'Campos obrigatórios faltando'}), 400
        
        endereco_repo = EnderecoRepository(current_app.db)
        usuario_repo = UsuarioRepository(current_app.db)
        inscricao_repo = InscricaoRepository(current_app.db)
        
        use_case = AtualizarEndereco(endereco_repo, usuario_repo, inscricao_repo)
        resultado = use_case.executar(
            aluno_id,
            dados['endereco_coleta'],
            dados['endereco_entrega'],
            dados.get('lat_coleta'),
            dados.get('lon_coleta'),
            dados.get('lat_entrega'),
            dados.get('lon_entrega')
        )
        
        return jsonify(resultado), 201
    
    except VantrackException as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao atualizar endereço'}), 500

@bp.route('/vincular-motorista', methods=['POST'])
@requer_token
@requer_perfil('aluno')
def vincular_motorista():
    try:
        from uuid import uuid4
        aluno_id = request.usuario_id
        dados = request.get_json()
        
        codigo = dados.get('codigo', '').strip().upper()
        if not codigo or len(codigo) != 6:
            return jsonify({'erro': 'O código do motorista deve conter exatamente 6 caracteres'}), 400
            
        db = current_app.db
        
        query_mot = "SELECT id, nome, sobrenome FROM usuarios WHERE tipo_perfil = 'motorista' AND UPPER(LEFT(id, 6)) = %s AND ativo = TRUE"
        motorista = db.execute_query_one(query_mot, (codigo,))
        
        if not motorista:
            return jsonify({'erro': 'Motorista não encontrado com este código'}), 404
            
        motorista_id = motorista['id']
        
        query_rota = "SELECT id FROM rotas WHERE motorista_id = %s AND ativo = TRUE LIMIT 1"
        rota = db.execute_query_one(query_rota, (motorista_id,))
        
        if rota:
            rota_id = rota['id']
        else:
            rota_id = str(uuid4())
            query_criar_rota = """
                INSERT INTO rotas (id, motorista_id, titulo, local_saida, local_chegada, horario_saida, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            db.execute_query(query_criar_rota, (rota_id, motorista_id, 'Rota Principal', 'Origem', 'Destino', '08:00:00', True))
            
        # Garantir que o aluno só esteja em uma rota ativa por vez (deletar anteriores)
        query_del_ins = "DELETE FROM inscricoes WHERE aluno_id = %s"
        db.execute_query(query_del_ins, (aluno_id,))
        
        inscricao_id = str(uuid4())
        query_criar_ins = "INSERT INTO inscricoes (id, aluno_id, rota_id, status) VALUES (%s, %s, %s, 'ativa')"
        db.execute_query(query_criar_ins, (inscricao_id, aluno_id, rota_id))
        
        query_end = "SELECT id FROM enderecos WHERE aluno_id = %s"
        endereco = db.execute_query_one(query_end, (aluno_id,))
        if not endereco:
            endereco_id = str(uuid4())
            query_criar_end = "INSERT INTO enderecos (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, principal) VALUES (%s, %s, %s, 'Não informado', 'Não informado', True)"
            db.execute_query(query_criar_end, (endereco_id, aluno_id, rota_id))
        else:
            query_up_end = "UPDATE enderecos SET rota_id = %s WHERE id = %s"
            db.execute_query(query_up_end, (rota_id, endereco['id']))
            
        from datetime import date
        hoje = date.today()
        
        # Verificar se pagamento já existe para este mês/ano
        query_pag_check = """
            SELECT id FROM pagamentos 
            WHERE aluno_id = %s AND motorista_id = %s AND mes_referencia = %s AND ano_referencia = %s
        """
        if not db.execute_query_one(query_pag_check, (aluno_id, motorista_id, hoje.month, hoje.year)):
            query_pag = """
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            pag_id = str(uuid4())
            db.execute_query(query_pag, (pag_id, aluno_id, motorista_id, rota_id, 250.00, hoje.month, hoje.year, 'pendente', f'{hoje.year}-{hoje.month:02d}-10', f'Mensalidade de {hoje.month}/{hoje.year}'))
            
        return jsonify({
            'sucesso': True,
            'mensagem': f'Vinculado com sucesso ao motorista {motorista["nome"]} {motorista["sobrenome"]}!'
        }), 200
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

