import pytest
from use_cases.validators import (
    validar_email, validar_cpf, validar_telefone, validar_senha,
    validar_nome, validar_cidade, validar_tipo_perfil, validar_horario,
    validar_coordenadas
)

class TestValidadores:
    @pytest.mark.unit
    def test_validar_email_valido(self):
        assert validar_email('usuario@email.com') == True
        assert validar_email('teste.usuario@empresa.co.br') == True

    @pytest.mark.unit
    def test_validar_email_invalido(self):
        with pytest.raises(ValueError):
            validar_email('email_invalido')
        with pytest.raises(ValueError):
            validar_email('@email.com')
        with pytest.raises(ValueError):
            validar_email('usuario@')

    @pytest.mark.unit
    def test_validar_cpf_valido(self):
        assert validar_cpf('12345678901') == True
        assert validar_cpf('123.456.789-01') == True

    @pytest.mark.unit
    def test_validar_cpf_invalido(self):
        with pytest.raises(ValueError):
            validar_cpf('1234567890')
        with pytest.raises(ValueError):
            validar_cpf('123456789abc')

    @pytest.mark.unit
    def test_validar_telefone_valido(self):
        assert validar_telefone('11999999999') == True
        assert validar_telefone('(11) 99999-9999') == True
        assert validar_telefone('11 99999-9999') == True

    @pytest.mark.unit
    def test_validar_telefone_invalido(self):
        with pytest.raises(ValueError):
            validar_telefone('1199')
        with pytest.raises(ValueError):
            validar_telefone('119999999999999')

    @pytest.mark.unit
    def test_validar_senha_valida(self):
        assert validar_senha('Senha123!') == True
        assert validar_senha('OutraSenha@2024') == True

    @pytest.mark.unit
    def test_validar_senha_muito_curta(self):
        with pytest.raises(ValueError):
            validar_senha('Abc1!')

    @pytest.mark.unit
    def test_validar_senha_sem_maiuscula(self):
        with pytest.raises(ValueError):
            validar_senha('senha123!')

    @pytest.mark.unit
    def test_validar_senha_sem_minuscula(self):
        with pytest.raises(ValueError):
            validar_senha('SENHA123!')

    @pytest.mark.unit
    def test_validar_senha_sem_numero(self):
        with pytest.raises(ValueError):
            validar_senha('SenhaAbcd!')

    @pytest.mark.unit
    def test_validar_nome_valido(self):
        assert validar_nome('João Silva') == True
        assert validar_nome('Maria') == True

    @pytest.mark.unit
    def test_validar_nome_invalido(self):
        with pytest.raises(ValueError):
            validar_nome('Jo')
        with pytest.raises(ValueError):
            validar_nome('João123')
        with pytest.raises(ValueError):
            validar_nome('João@Silva')

    @pytest.mark.unit
    def test_validar_cidade_valida(self):
        assert validar_cidade('São Paulo') == True
        assert validar_cidade('Rio') == True

    @pytest.mark.unit
    def test_validar_cidade_invalida(self):
        with pytest.raises(ValueError):
            validar_cidade('SP')
        with pytest.raises(ValueError):
            validar_cidade('São Paulo 123')

    @pytest.mark.unit
    def test_validar_tipo_perfil_valido(self):
        assert validar_tipo_perfil('aluno') == True
        assert validar_tipo_perfil('motorista') == True
        assert validar_tipo_perfil('admin') == True

    @pytest.mark.unit
    def test_validar_tipo_perfil_invalido(self):
        with pytest.raises(ValueError):
            validar_tipo_perfil('outro_perfil')
        with pytest.raises(ValueError):
            validar_tipo_perfil('usuario')

    @pytest.mark.unit
    def test_validar_horario_valido(self):
        assert validar_horario('08:00') == True
        assert validar_horario('23:59') == True

    @pytest.mark.unit
    def test_validar_horario_invalido(self):
        with pytest.raises(ValueError):
            validar_horario('25:00')
        with pytest.raises(ValueError):
            validar_horario('08-00')
        with pytest.raises(ValueError):
            validar_horario('800')

    @pytest.mark.unit
    def test_validar_coordenadas_validas(self):
        assert validar_coordenadas(-23.5505, -46.6333) == True
        assert validar_coordenadas(0, 0) == True
        assert validar_coordenadas(-90, 180) == True

    @pytest.mark.unit
    def test_validar_coordenadas_invalidas(self):
        with pytest.raises(ValueError):
            validar_coordenadas(91, -46.6333)
        with pytest.raises(ValueError):
            validar_coordenadas(-23.5505, 181)
        with pytest.raises(ValueError):
            validar_coordenadas(-100, -46.6333)
