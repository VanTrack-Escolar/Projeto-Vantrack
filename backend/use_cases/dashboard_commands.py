from datetime import date
from exceptions import VantrackException


class UsuarioNaoAutorizado(VantrackException):
    pass


class PresencaNaoEncontrada(VantrackException):
    pass


class ObtenerDashboardMotorista:
    def __init__(self, usuario_repository, rota_repository, inscricao_repository, presenca_repository, mensagem_repository):
        self.usuario_repository = usuario_repository
        self.rota_repository = rota_repository
        self.inscricao_repository = inscricao_repository
        self.presenca_repository = presenca_repository
        self.mensagem_repository = mensagem_repository

    def executar(self, motorista_id):
        motorista = self.usuario_repository.buscar_por_id(motorista_id)
        if not motorista or motorista['tipo_perfil'] != 'motorista':
            raise UsuarioNaoAutorizado("Acesso negado: não é motorista")

        rotas = self.rota_repository.listar_por_motorista(motorista_id)
        
        if not rotas:
            return {
                'motorista': motorista,
                'rotas': [],
                'alunos_hoje': [],
                'mensagens_nao_lidas': 0,
                'proxima_rota': None
            }

        rota_proxima = rotas[0] if rotas else None
        
        alunos_hoje = []
        for rota in rotas:
            inscricoes = self.inscricao_repository.listar_por_rota(rota['id'])
            for inscricao in inscricoes:
                presenca = self.presenca_repository.buscar_por_aluno_rota_e_data(
                    inscricao['aluno_id'], rota['id'], date.today()
                )
                aluno = self.usuario_repository.buscar_por_id(inscricao['aluno_id'])
                
                # Buscar status de pagamento da mensalidade atual
                hoje = date.today()
                query_pag = """
                    SELECT status FROM pagamentos 
                    WHERE aluno_id = %s AND motorista_id = %s AND mes_referencia = %s AND ano_referencia = %s
                    LIMIT 1
                """
                pagamento = self.usuario_repository.db.execute_query_one(
                    query_pag, (inscricao['aluno_id'], motorista_id, hoje.month, hoje.year)
                )
                status_pagamento = pagamento['status'] if pagamento else 'pendente'
                
                alunos_hoje.append({
                    'aluno_id': inscricao['aluno_id'],
                    'aluno_nome': aluno['nome'],
                    'vai_embarcar': presenca['vai_embarcar'] if presenca else None,
                    'rota_id': rota['id'],
                    'status_pagamento': status_pagamento
                })

        mensagens_nao_lidas = self.mensagem_repository.contar_nao_lidas_por_usuario(motorista_id)
        ultimas_mensagens = self.mensagem_repository.listar_nao_lidas_por_usuario(motorista_id, limit=5)

        return {
            'motorista': motorista,
            'rotas': rotas,
            'alunos_hoje': alunos_hoje,
            'mensagens_nao_lidas': mensagens_nao_lidas,
            'ultimas_mensagens': ultimas_mensagens,
            'proxima_rota': rota_proxima
        }


class ObtenerDashboardAluno:
    def __init__(self, usuario_repository, inscricao_repository, presenca_repository, 
                 endereco_repository, rota_repository, veiculo_repository, localizacao_repository):
        self.usuario_repository = usuario_repository
        self.inscricao_repository = inscricao_repository
        self.presenca_repository = presenca_repository
        self.endereco_repository = endereco_repository
        self.rota_repository = rota_repository
        self.veiculo_repository = veiculo_repository
        self.localizacao_repository = localizacao_repository

    def executar(self, aluno_id):
        aluno = self.usuario_repository.buscar_por_id(aluno_id)
        if not aluno or aluno['tipo_perfil'] != 'aluno':
            raise UsuarioNaoAutorizado("Acesso negado: não é aluno")

        inscricoes = self.inscricao_repository.listar_por_aluno(aluno_id)
        
        if not inscricoes:
            return {
                'aluno': aluno,
                'rota_atual': None,
                'presenca_hoje': None,
                'motorista': None,
                'veiculo': None,
                'localizacao_atual': None,
                'endereco_principal': None
            }

        inscricao = inscricoes[0]
        rota = self.rota_repository.buscar_por_id(inscricao['rota_id'])
        motorista = self.usuario_repository.buscar_por_id(rota['motorista_id'])
        
        presenca_hoje = self.presenca_repository.buscar_por_aluno_rota_e_data(
            aluno_id, inscricao['rota_id'], date.today()
        )

        veiculo = None
        localizacao_atual = None
        if rota.get('veiculo_id'):
            veiculo = self.veiculo_repository.buscar_por_id(rota['veiculo_id'])
            localizacao_atual = self.localizacao_repository.obter_ultima(rota['veiculo_id'])

        endereco_principal = self.endereco_repository.buscar_principal(aluno_id)

        return {
            'aluno': aluno,
            'rota_atual': rota,
            'presenca_hoje': presenca_hoje,
            'motorista': motorista,
            'veiculo': veiculo,
            'localizacao_atual': localizacao_atual,
            'endereco_principal': endereco_principal
        }


class ConfirmarPresenca:
    def __init__(self, presenca_repository, inscricao_repository, usuario_repository):
        self.presenca_repository = presenca_repository
        self.inscricao_repository = inscricao_repository
        self.usuario_repository = usuario_repository

    def executar(self, aluno_id, vai_embarcar):
        aluno = self.usuario_repository.buscar_por_id(aluno_id)
        if not aluno or aluno['tipo_perfil'] != 'aluno':
            raise UsuarioNaoAutorizado("Acesso negado: não é aluno")

        inscricoes = self.inscricao_repository.listar_por_aluno(aluno_id)
        if not inscricoes:
            raise VantrackException("Aluno não inscrito em nenhuma rota")

        inscricao = inscricoes[0]
        presenca = self.presenca_repository.buscar_por_aluno_rota_e_data(
            aluno_id, inscricao['rota_id'], date.today()
        )

        if presenca:
            return self.presenca_repository.atualizar(presenca['id'], {'vai_embarcar': vai_embarcar})
        else:
            from domain.dashboard import PresencaDiaria
            nova_presenca = PresencaDiaria.criar(aluno_id, inscricao['rota_id'], date.today(), vai_embarcar)
            return self.presenca_repository.criar(nova_presenca)


class EnviarMensagem:
    def __init__(self, mensagem_repository, usuario_repository):
        self.mensagem_repository = mensagem_repository
        self.usuario_repository = usuario_repository

    def executar(self, remetente_id, destinatario_id, texto):
        remetente = self.usuario_repository.buscar_por_id(remetente_id)
        destinatario = self.usuario_repository.buscar_por_id(destinatario_id)

        if not remetente or not destinatario:
            raise VantrackException("Usuário não encontrado")

        if not texto or len(texto.strip()) == 0:
            raise VantrackException("Mensagem não pode estar vazia")

        from domain.dashboard import MensagemChat
        mensagem = MensagemChat.criar(remetente_id, destinatario_id, texto.strip())
        return self.mensagem_repository.criar(mensagem)


class ObtenerConversa:
    def __init__(self, mensagem_repository, usuario_repository):
        self.mensagem_repository = mensagem_repository
        self.usuario_repository = usuario_repository

    def executar(self, usuario_id, outro_usuario_id, limit=50):
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        outro = self.usuario_repository.buscar_por_id(outro_usuario_id)

        if not usuario or not outro:
            raise VantrackException("Usuário não encontrado")

        mensagens = self.mensagem_repository.listar_conversa(usuario_id, outro_usuario_id, limit)
        self.mensagem_repository.marcar_conversa_como_lida(usuario_id, outro_usuario_id)

        return {
            'usuario': usuario,
            'outro_usuario': outro,
            'mensagens': mensagens
        }


class ListarMensagensNaoLidas:
    def __init__(self, mensagem_repository, usuario_repository):
        self.mensagem_repository = mensagem_repository
        self.usuario_repository = usuario_repository

    def executar(self, usuario_id):
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if not usuario:
            raise VantrackException("Usuário não encontrado")

        mensagens = self.mensagem_repository.listar_nao_lidas_por_usuario(usuario_id)
        total = self.mensagem_repository.contar_nao_lidas_por_usuario(usuario_id)

        return {
            'usuario': usuario,
            'total_nao_lidas': total,
            'mensagens': mensagens
        }


class AtualizarEndereco:
    def __init__(self, endereco_repository, usuario_repository, inscricao_repository):
        self.endereco_repository = endereco_repository
        self.usuario_repository = usuario_repository
        self.inscricao_repository = inscricao_repository

    def executar(self, aluno_id, endereco_coleta, endereco_entrega, lat_coleta=None, lon_coleta=None, 
                 lat_entrega=None, lon_entrega=None):
        aluno = self.usuario_repository.buscar_por_id(aluno_id)
        if not aluno or aluno['tipo_perfil'] != 'aluno':
            raise UsuarioNaoAutorizado("Acesso negado: não é aluno")

        inscricoes = self.inscricao_repository.listar_por_aluno(aluno_id)
        if not inscricoes:
            raise VantrackException("Aluno não inscrito em nenhuma rota")

        inscricao = inscricoes[0]
        endereco_existente = self.endereco_repository.buscar_principal(aluno_id)

        if endereco_existente:
            return self.endereco_repository.atualizar(endereco_existente['id'], {
                'endereco_coleta': endereco_coleta,
                'endereco_entrega': endereco_entrega,
                'latitude_coleta': lat_coleta,
                'longitude_coleta': lon_coleta,
                'latitude_entrega': lat_entrega,
                'longitude_entrega': lon_entrega
            })
        else:
            from domain.dashboard import EnderecoAluno
            novo_endereco = EnderecoAluno.criar(aluno_id, inscricao['rota_id'], endereco_coleta, endereco_entrega)
            novo_endereco.latitude_coleta = lat_coleta
            novo_endereco.longitude_coleta = lon_coleta
            novo_endereco.latitude_entrega = lat_entrega
            novo_endereco.longitude_entrega = lon_entrega
            return self.endereco_repository.criar(novo_endereco)
