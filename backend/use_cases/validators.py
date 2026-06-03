import re
from datetime import datetime

def validar_email(email):
    """Valida formato de email"""
    if len(email) > 254:
        raise ValueError("Email excede o limite de 254 caracteres")
    padrao = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(padrao, email):
        raise ValueError("Email inválido")
    return True

def validar_cpf(cpf):
    """Valida CPF (mod 11)"""
    cpf_limpo = re.sub(r'[^0-9]', '', cpf)
    if len(cpf_limpo) != 11:
        raise ValueError("CPF deve conter exatamente 11 dígitos")
    if cpf_limpo == cpf_limpo[0] * 11:
        raise ValueError("CPF inválido")
    
    # Mod 11
    for i in range(9, 11):
        valor = sum((int(cpf_limpo[num]) * ((i+1) - num) for num in range(0, i)))
        digito = ((valor * 10) % 11) % 10
        if str(digito) != cpf_limpo[i]:
            raise ValueError("CPF com dígito verificador inválido")
    return True

def validar_telefone(telefone):
    """Valida número de telefone brasileiro"""
    telefone_limpo = re.sub(r'[^0-9]', '', telefone)
    if not re.match(r'^1[0-9]\d{9}$', telefone_limpo):
        raise ValueError("Telefone deve ter 11 dígitos e formato brasileiro começando com 1x")
    return True

def validar_senha(senha):
    """Valida força da senha"""
    if len(senha) < 8:
        raise ValueError("Senha deve ter no mínimo 8 caracteres")
    if not re.search(r'[A-Z]', senha):
        raise ValueError("Senha deve conter letras maiúsculas")
    if not re.search(r'[a-z]', senha):
        raise ValueError("Senha deve conter letras minúsculas")
    if not re.search(r'[0-9]', senha):
        raise ValueError("Senha deve conter números")
    return True

def validar_nome(nome):
    """Valida nome do usuário"""
    if len(nome) < 3:
        raise ValueError("Nome deve ter no mínimo 3 caracteres")
    if not nome.replace(' ', '').isalpha():
        raise ValueError("Nome deve conter apenas letras")
    return True

def validar_cidade(cidade):
    """Valida nome da cidade"""
    if len(cidade) < 3:
        raise ValueError("Cidade deve ter no mínimo 3 caracteres")
    if not cidade.replace(' ', '').isalpha():
        raise ValueError("Cidade deve conter apenas letras")
    return True

def validar_tipo_perfil(tipo_perfil):
    """Valida tipo de perfil"""
    if tipo_perfil not in ['aluno', 'motorista', 'admin']:
        raise ValueError("Tipo de perfil inválido")
    return True

def validar_horario(horario):
    """Valida formato de hora HH:MM"""
    try:
        datetime.strptime(horario, '%H:%M')
        return True
    except ValueError:
        raise ValueError("Horário deve estar no formato HH:MM")

def validar_coordenadas(latitude, longitude):
    """Valida coordenadas GPS"""
    if not (-90 <= latitude <= 90):
        raise ValueError("Latitude deve estar entre -90 e 90")
    if not (-180 <= longitude <= 180):
        raise ValueError("Longitude deve estar entre -180 e 180")
    return True
