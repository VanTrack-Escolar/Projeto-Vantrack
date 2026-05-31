from datetime import datetime
from pydantic import BaseModel, validator
from typing import Union

class Rota(BaseModel):
    id: int = None
    nome: str
    origem: str
    destino: str
    horario_partida: str
    capacidade_maxima: int
    motorista_id: Union[int, str]
    veiculo_id: Union[int, str]
    ativa: bool = True
    criado_em: datetime = None
    atualizado_em: datetime = None

    @validator('horario_partida')
    def validar_horario(cls, v):
        try:
            datetime.strptime(v, '%H:%M')
        except ValueError:
            raise ValueError('Horário deve estar no formato HH:MM')
        return v

    @validator('origem', 'destino')
    def validar_locais(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Origem e destino devem ter pelo menos 3 caracteres')
        return v

    @validator('capacidade_maxima')
    def validar_capacidade(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Capacidade deve estar entre 1 e 100')
        return v

    @validator('nome')
    def validar_nome(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Nome deve ter pelo menos 3 caracteres')
        return v

    class Config:
        from_attributes = True

class RotaCreate(BaseModel):
    nome: str
    origem: str
    destino: str
    horario_partida: str
    capacidade_maxima: int
    motorista_id: Union[int, str]
    veiculo_id: Union[int, str]

    @validator('horario_partida')
    def validar_horario(cls, v):
        try:
            datetime.strptime(v, '%H:%M')
        except ValueError:
            raise ValueError('Horário deve estar no formato HH:MM')
        return v

    @validator('origem')
    def check_origem_diferente_destino(cls, v, values):
        if 'destino' in values and v == values['destino']:
            raise ValueError('Origem e destino não podem ser iguais')
        return v
