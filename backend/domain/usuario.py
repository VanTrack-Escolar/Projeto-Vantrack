from datetime import datetime
from pydantic import BaseModel, EmailStr, validator

class Usuario(BaseModel):
    id: int = None
    email: str
    cpf: str
    senha_hash: str
    nome: str
    sobrenome: str
    telefone: str
    cidade: str
    tipo_perfil: str
    ativo: bool = True
    criado_em: datetime = None
    atualizado_em: datetime = None

    @validator('tipo_perfil')
    def validar_tipo_perfil(cls, v):
        if v not in ['aluno', 'motorista', 'admin']:
            raise ValueError('tipo_perfil deve ser "aluno", "motorista" ou "admin"')
        return v

    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    email: str
    cpf: str
    nome: str
    sobrenome: str = ""
    telefone: str
    cidade: str
    tipo_perfil: str
    senha: str

    @validator('tipo_perfil')
    def validar_tipo_perfil(cls, v):
        if v not in ['aluno', 'motorista', 'admin']:
            raise ValueError('tipo_perfil deve ser "aluno", "motorista" ou "admin"')
        return v

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class UsuarioRecuperarSenha(BaseModel):
    email: str
    nova_senha: str
