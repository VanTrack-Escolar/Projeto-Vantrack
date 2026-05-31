from datetime import datetime
from pydantic import BaseModel, validator
from typing import Union

class Veiculo(BaseModel):
    id: int = None
    placa: str
    modelo: str
    ano: int
    capacidade: int
    motorista_id: Union[int, str]
    criado_em: datetime = None
    atualizado_em: datetime = None

    @validator('ano')
    def validar_ano(cls, v):
        if v < 2000 or v > datetime.now().year:
            raise ValueError('Ano do veículo inválido')
        return v

    @validator('capacidade')
    def validar_capacidade(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Capacidade deve estar entre 1 e 100')
        return v

    class Config:
        from_attributes = True

class VeiculoCreate(BaseModel):
    placa: str
    modelo: str
    ano: int
    capacidade: int
    motorista_id: Union[int, str]
