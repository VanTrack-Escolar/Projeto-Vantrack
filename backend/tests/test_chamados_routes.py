import pytest
import jwt
import os
from datetime import datetime, timedelta

@pytest.fixture
def admin_token():
    payload = {
        'usuario_id': 'admin-uuid',
        'email': 'admin@teste.com',
        'tipo_perfil': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')

@pytest.fixture
def aluno_token():
    payload = {
        'usuario_id': 'aluno-uuid',
        'email': 'aluno@teste.com',
        'tipo_perfil': 'aluno',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')

@pytest.fixture
def mock_repo(mocker):
    # Mocking the repository class
    return mocker.patch('presentation.routes.chamado_routes.ChamadoRepository')

def test_criar_chamado_sucesso(client, aluno_token, mock_repo):
    instance = mock_repo.return_value
    instance.criar.return_value = {
        'id': 'chamado-uuid',
        'usuario_id': 'aluno-uuid',
        'assunto': 'Problema na Van',
        'descricao': 'A van não passou na minha rua.',
        'status': 'aberto',
        'criado_em': datetime(2026, 6, 3, 20, 0, 0),
        'atualizado_em': datetime(2026, 6, 3, 20, 0, 0)
    }

    headers = {'Authorization': f'Bearer {aluno_token}'}
    dados = {
        'assunto': 'Problema na Van',
        'descricao': 'A van não passou na minha rua.'
    }
    response = client.post('/api/chamados', json=dados, headers=headers)

    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['id'] == 'chamado-uuid'
    assert json_data['status'] == 'aberto'
    assert json_data['criado_em'] == '2026-06-03T20:00:00'
    instance.criar.assert_called_once_with('aluno-uuid', 'Problema na Van', 'A van não passou na minha rua.')

def test_criar_chamado_campos_obrigatorios(client, aluno_token):
    headers = {'Authorization': f'Bearer {aluno_token}'}
    dados = {'assunto': ''}
    response = client.post('/api/chamados', json=dados, headers=headers)
    assert response.status_code == 400
    assert 'erro' in response.get_json()

def test_listar_chamados_aluno(client, aluno_token, mock_repo):
    instance = mock_repo.return_value
    instance.listar_por_usuario.return_value = [
        {
            'id': 'chamado-1',
            'usuario_id': 'aluno-uuid',
            'assunto': 'Assunto 1',
            'descricao': 'Desc 1',
            'status': 'aberto',
            'criado_em': datetime(2026, 6, 3, 20, 0, 0),
            'atualizado_em': datetime(2026, 6, 3, 20, 0, 0)
        }
    ]

    headers = {'Authorization': f'Bearer {aluno_token}'}
    response = client.get('/api/chamados', headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data) == 1
    assert json_data[0]['id'] == 'chamado-1'
    instance.listar_por_usuario.assert_called_once_with('aluno-uuid')
    instance.listar_todos.assert_not_called()

def test_listar_chamados_admin(client, admin_token, mock_repo):
    instance = mock_repo.return_value
    instance.listar_todos.return_value = [
        {
            'id': 'chamado-1',
            'usuario_id': 'aluno-uuid',
            'assunto': 'Assunto 1',
            'descricao': 'Desc 1',
            'status': 'aberto',
            'criado_em': datetime(2026, 6, 3, 20, 0, 0),
            'atualizado_em': datetime(2026, 6, 3, 20, 0, 0)
        },
        {
            'id': 'chamado-2',
            'usuario_id': 'outro-uuid',
            'assunto': 'Assunto 2',
            'descricao': 'Desc 2',
            'status': 'resolvido',
            'criado_em': datetime(2026, 6, 3, 21, 0, 0),
            'atualizado_em': datetime(2026, 6, 3, 21, 0, 0)
        }
    ]

    headers = {'Authorization': f'Bearer {admin_token}'}
    response = client.get('/api/chamados', headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data) == 2
    instance.listar_todos.assert_called_once()
    instance.listar_por_usuario.assert_not_called()

def test_atualizar_status_sucesso(client, admin_token, mock_repo):
    instance = mock_repo.return_value
    instance.atualizar_status.return_value = {
        'id': 'chamado-1',
        'usuario_id': 'aluno-uuid',
        'assunto': 'Assunto 1',
        'descricao': 'Desc 1',
        'status': 'em_atendimento',
        'criado_em': datetime(2026, 6, 3, 20, 0, 0),
        'atualizado_em': datetime(2026, 6, 3, 22, 0, 0)
    }

    headers = {'Authorization': f'Bearer {admin_token}'}
    response = client.put('/api/chamados/chamado-1/status', json={'status': 'em_atendimento'}, headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'em_atendimento'
    instance.atualizar_status.assert_called_once_with('chamado-1', 'em_atendimento')

def test_atualizar_status_permissao_negada(client, aluno_token):
    headers = {'Authorization': f'Bearer {aluno_token}'}
    response = client.put('/api/chamados/chamado-1/status', json={'status': 'resolvido'}, headers=headers)
    assert response.status_code == 403
    assert 'erro' in response.get_json()

def test_obter_admin_id_sucesso(app, client, aluno_token, mocker):
    mocker.patch.object(app.db, 'execute_query_one', return_value={'id': 'admin-uuid-db'})

    headers = {'Authorization': f'Bearer {aluno_token}'}
    response = client.get('/api/chamados/admin-id', headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['admin_id'] == 'admin-uuid-db'
