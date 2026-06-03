import pytest
from datetime import datetime

class UsuarioFactory:
    @staticmethod
    def create(db, **kwargs):
        from domain.usuario import Usuario
        from use_cases.autenticar_usuario import CadastrarUsuario
        from infra.usuario_repository import UsuarioRepository
        
        dados_padrao = {
            'email': kwargs.get('email', f'usuario_{datetime.now().timestamp()}@test.com'),
            'cpf': kwargs.get('cpf', '12345678901'),
            'nome': kwargs.get('nome', 'Usuário Teste'),
            'telefone': kwargs.get('telefone', '11999999999'),
            'cidade': kwargs.get('cidade', 'São Paulo'),
            'tipo_perfil': kwargs.get('tipo_perfil', 'aluno'),
            'senha': kwargs.get('senha', 'Senha123!')
        }
        from domain.usuario import UsuarioCreate
        usuario_create = UsuarioCreate(**dados_padrao)
        
        usuario_repo = UsuarioRepository(db)
        cadastrar_use_case = CadastrarUsuario(usuario_repo)
        resultado = cadastrar_use_case.executar(usuario_create)
        return resultado

class VeiculoFactory:
    @staticmethod
    def create(db, motorista_id, **kwargs):
        from domain.veiculo import VeiculoCreate
        from use_cases.veiculo_commands import CriarVeiculo
        from infra.veiculo_repository import VeiculoRepository
        
        dados_padrao = {
            'placa': kwargs.get('placa', f'ABC{int(datetime.now().timestamp()) % 9999:04d}'),
            'modelo': kwargs.get('modelo', 'Sprinter'),
            'ano': kwargs.get('ano', 2023),
            'capacidade': kwargs.get('capacidade', 50),
            'motorista_id': motorista_id
        }
        
        veiculo_create = VeiculoCreate(**dados_padrao)
        veiculo_repo = VeiculoRepository(db)
        criar_use_case = CriarVeiculo(veiculo_repo)
        resultado = criar_use_case.executar(veiculo_create)
        return resultado

class RotaFactory:
    @staticmethod
    def create(db, motorista_id, veiculo_id, **kwargs):
        from domain.rota import RotaCreate
        from use_cases.rota_commands import CriarRota
        from infra.rota_repository import RotaRepository
        from infra.veiculo_repository import VeiculoRepository
        from infra.usuario_repository import UsuarioRepository
        
        dados_padrao = {
            'nome': kwargs.get('nome', 'Rota Teste'),
            'origem': kwargs.get('origem', 'São Paulo'),
            'destino': kwargs.get('destino', 'Campinas'),
            'horario_partida': kwargs.get('horario_partida', '08:00'),
            'capacidade_maxima': kwargs.get('capacidade_maxima', 50),
            'motorista_id': motorista_id,
            'veiculo_id': veiculo_id
        }
        
        rota_create = RotaCreate(**dados_padrao)
        rota_repo = RotaRepository(db)
        veiculo_repo = VeiculoRepository(db)
        usuario_repo = UsuarioRepository(db)
        criar_use_case = CriarRota(rota_repo, veiculo_repo, usuario_repo)
        resultado = criar_use_case.executar(rota_create)
        return resultado

class InscricaoFactory:
    @staticmethod
    def create(db, aluno_id, rota_id, **kwargs):
        from domain.inscricao import InscricaoCreate
        from use_cases.inscricao_commands import CriarInscricao
        from infra.inscricao_repository import InscricaoRepository
        from infra.rota_repository import RotaRepository
        from infra.usuario_repository import UsuarioRepository
        
        dados_padrao = {
            'aluno_id': aluno_id,
            'rota_id': rota_id
        }
        
        inscricao_create = InscricaoCreate(**dados_padrao)
        inscricao_repo = InscricaoRepository(db)
        rota_repo = RotaRepository(db)
        usuario_repo = UsuarioRepository(db)
        criar_use_case = CriarInscricao(inscricao_repo, rota_repo, usuario_repo)
        resultado = criar_use_case.executar(inscricao_create)
        return resultado

class LocalizacaoGPSFactory:
    @staticmethod
    def create(db, veiculo_id, **kwargs):
        from domain.localizacao_gps import LocalizacaoGPSCreate
        from use_cases.localizacao_commands import RegistrarLocalizacao
        from infra.localizacao_gps_repository import LocalizacaoGPSRepository
        from infra.veiculo_repository import VeiculoRepository
        
        dados_padrao = {
            'latitude': kwargs.get('latitude', -23.5505),
            'longitude': kwargs.get('longitude', -46.6333),
            'veiculo_id': veiculo_id
        }
        
        localizacao_create = LocalizacaoGPSCreate(**dados_padrao)
        localizacao_repo = LocalizacaoGPSRepository(db)
        veiculo_repo = VeiculoRepository(db)
        registrar_use_case = RegistrarLocalizacao(localizacao_repo, veiculo_repo)
        resultado = registrar_use_case.executar(localizacao_create)
        return resultado

@pytest.fixture
def mock_db(mocker):
    """Mock do banco de dados"""
    db = mocker.MagicMock()
    return db

@pytest.fixture
def app():
    """Fixture da aplicação Flask"""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    
    from app import criar_app
    app_obj, socketio = criar_app()
    app_obj.config['TESTING'] = True
    return app_obj

@pytest.fixture
def client(app):
    """Fixture do cliente Flask para testes"""
    return app.test_client()

@pytest.fixture
def jwt_token(mocker):
    """Fixture de JWT token para usuários alunos"""
    import jwt
    import os
    from datetime import datetime, timedelta
    
    payload = {
        'usuario_id': 1,
        'email': 'aluno@test.com',
        'tipo_perfil': 'aluno',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')
    return token

@pytest.fixture
def motorista_token(mocker):
    """Fixture de JWT token para motoristas"""
    import jwt
    import os
    from datetime import datetime, timedelta
    
    payload = {
        'usuario_id': 2,
        'email': 'motorista@test.com',
        'tipo_perfil': 'motorista',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')
    return token
