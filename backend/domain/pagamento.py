from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

@dataclass
class Pagamento:
    """Entidade de Pagamento"""
    id: str = field(default_factory=lambda: str(uuid4()))
    aluno_id: str = ""
    motorista_id: str = ""
    rota_id: str = ""
    valor: float = 0.0
    mes_referencia: int = 0
    ano_referencia: int = 0
    status: str = "pendente"  # pendente, pago, atrasado, cancelado
    data_vencimento: str = ""
    data_pagamento: str = None
    metodo_pagamento: str = ""  # credito, debito, pix, dinheiro
    descricao: str = ""
    criado_em: str = field(default_factory=lambda: datetime.now().isoformat())
    atualizado_em: str = field(default_factory=lambda: datetime.now().isoformat())

    def marcar_como_pago(self, metodo_pagamento: str):
        """Marca o pagamento como realizado"""
        self.status = "pago"
        self.data_pagamento = datetime.now().isoformat()
        self.metodo_pagamento = metodo_pagamento
        self.atualizado_em = datetime.now().isoformat()

    def cancelar(self):
        """Cancela o pagamento"""
        self.status = "cancelado"
        self.atualizado_em = datetime.now().isoformat()

    def to_dict(self):
        """Converte para dicionário"""
        return {
            'id': self.id,
            'aluno_id': self.aluno_id,
            'motorista_id': self.motorista_id,
            'rota_id': self.rota_id,
            'valor': self.valor,
            'mes_referencia': self.mes_referencia,
            'ano_referencia': self.ano_referencia,
            'status': self.status,
            'data_vencimento': self.data_vencimento,
            'data_pagamento': self.data_pagamento,
            'metodo_pagamento': self.metodo_pagamento,
            'descricao': self.descricao,
            'criado_em': self.criado_em,
            'atualizado_em': self.atualizado_em
        }
