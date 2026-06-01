from uuid import uuid4
from datetime import datetime
from database import Database
import logging

logger = logging.getLogger(__name__)

class PagamentoRepository:
    """Repositório para gerenciar pagamentos"""

    def __init__(self, db: Database = None):
        self.db = db or Database()

    def criar(self, pagamento_data: dict) -> dict:
        """Cria um novo pagamento"""
        try:
            pagamento_id = str(uuid4())
            agora = datetime.now()

            query = """
                INSERT INTO pagamentos 
                (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, 
                 ano_referencia, status, data_vencimento, metodo_pagamento, 
                 descricao, criado_em, atualizado_em)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            params = (
                pagamento_id,
                pagamento_data.get('aluno_id'),
                pagamento_data.get('motorista_id'),
                pagamento_data.get('rota_id'),
                float(pagamento_data.get('valor', 0)),
                int(pagamento_data.get('mes_referencia', 0)),
                int(pagamento_data.get('ano_referencia', 0)),
                pagamento_data.get('status', 'pendente'),
                pagamento_data.get('data_vencimento'),
                pagamento_data.get('metodo_pagamento', ''),
                pagamento_data.get('descricao', ''),
                agora,
                agora
            )

            self.db.execute_query(query, params)
            logger.info(f"Pagamento criado: {pagamento_id}")
            return self.obter_por_id(pagamento_id)

        except Exception as e:
            logger.error(f"Erro ao criar pagamento: {e}")
            raise

    def obter_por_id(self, pagamento_id: str) -> dict:
        """Obtém pagamento por ID"""
        query = "SELECT * FROM pagamentos WHERE id = %s"
        return self.db.execute_query_one(query, (pagamento_id,))

    def obter_por_aluno_mes(self, aluno_id: str, mes: int, ano: int) -> list:
        """Obtém pagamentos do aluno para um mês específico"""
        query = """
            SELECT p.*, u.nome as motorista_nome, u.email as motorista_email
            FROM pagamentos p
            JOIN usuarios u ON p.motorista_id = u.id
            WHERE p.aluno_id = %s AND p.mes_referencia = %s AND p.ano_referencia = %s
            ORDER BY p.data_vencimento
        """
        return self.db.execute_query(query, (aluno_id, mes, ano), fetch=True)

    def obter_por_aluno(self, aluno_id: str) -> list:
        """Obtém todos os pagamentos do aluno"""
        query = """
            SELECT p.*, u.nome as motorista_nome, u.email as motorista_email
            FROM pagamentos p
            JOIN usuarios u ON p.motorista_id = u.id
            WHERE p.aluno_id = %s
            ORDER BY p.ano_referencia DESC, p.mes_referencia DESC
        """
        return self.db.execute_query(query, (aluno_id,), fetch=True)

    def obter_por_motorista(self, motorista_id: str) -> list:
        """Obtém todos os pagamentos gerenciados pelo motorista"""
        query = """
            SELECT p.*, 
                   u_aluno.nome as aluno_nome, 
                   u_aluno.email as aluno_email,
                   r.titulo as rota_titulo
            FROM pagamentos p
            JOIN usuarios u_aluno ON p.aluno_id = u_aluno.id
            JOIN rotas r ON p.rota_id = r.id
            WHERE p.motorista_id = %s
            ORDER BY p.status, p.data_vencimento
        """
        return self.db.execute_query(query, (motorista_id,), fetch=True)

    def obter_por_motorista_status(self, motorista_id: str, status: str) -> list:
        """Obtém pagamentos do motorista por status"""
        query = """
            SELECT p.*, 
                   u_aluno.nome as aluno_nome, 
                   u_aluno.email as aluno_email,
                   r.titulo as rota_titulo
            FROM pagamentos p
            JOIN usuarios u_aluno ON p.aluno_id = u_aluno.id
            JOIN rotas r ON p.rota_id = r.id
            WHERE p.motorista_id = %s AND p.status = %s
            ORDER BY p.data_vencimento
        """
        return self.db.execute_query(query, (motorista_id, status), fetch=True)

    def obter_alunos_por_motorista_com_status(self, motorista_id: str, mes: int = None, ano: int = None) -> list:
        """Obtém lista de alunos do motorista com status de pagamentos"""
        if mes is None:
            from datetime import datetime
            mes = datetime.now().month
        if ano is None:
            from datetime import datetime
            ano = datetime.now().year

        query = """
            SELECT DISTINCT
                u.id,
                u.nome,
                u.email,
                u.tipo_perfil,
                COALESCE(COUNT(CASE WHEN p.status = 'pago' THEN 1 END), 0) as pagos,
                COALESCE(COUNT(CASE WHEN p.status = 'pendente' THEN 1 END), 0) as pendentes,
                COALESCE(COUNT(CASE WHEN p.status = 'atrasado' THEN 1 END), 0) as atrasados,
                GROUP_CONCAT(CASE WHEN p.status = 'pendente' THEN p.id END) as pagamentos_pendentes_ids,
                MAX(CASE WHEN p.status = 'pendente' THEN p.valor END) as total_pendente,
                MAX(p.data_vencimento) as proxima_vencimento
            FROM usuarios u
            LEFT JOIN inscricoes i ON u.id = i.aluno_id
            LEFT JOIN rotas r ON i.rota_id = r.id AND r.motorista_id = %s
            LEFT JOIN pagamentos p ON u.id = p.aluno_id AND r.motorista_id = %s
            WHERE r.motorista_id = %s AND u.tipo_perfil = 'aluno'
            GROUP BY u.id, u.nome, u.email, u.tipo_perfil
            ORDER BY pagos, pendentes DESC
        """
        return self.db.execute_query(query, (motorista_id, motorista_id, motorista_id), fetch=True)

    def atualizar_status(self, pagamento_id: str, novo_status: str, metodo_pagamento: str = None) -> dict:
        """Atualiza o status do pagamento"""
        try:
            agora = datetime.now()
            data_pagamento = agora if novo_status == 'pago' else None

            query = """
                UPDATE pagamentos 
                SET status = %s, atualizado_em = %s
            """
            params = [novo_status, agora]

            if metodo_pagamento:
                query += ", metodo_pagamento = %s"
                params.append(metodo_pagamento)

            if novo_status == 'pago':
                query += ", data_pagamento = %s"
                params.append(data_pagamento)

            query += " WHERE id = %s"
            params.append(pagamento_id)

            self.db.execute_query(query, tuple(params))
            logger.info(f"Pagamento {pagamento_id} atualizado para {novo_status}")
            return self.obter_por_id(pagamento_id)

        except Exception as e:
            logger.error(f"Erro ao atualizar pagamento: {e}")
            raise

    def atualizar(self, pagamento_id: str, dados_atualizacao: dict) -> dict:
        """Atualiza dados do pagamento"""
        try:
            agora = datetime.now()
            campos = []
            params = []

            for campo, valor in dados_atualizacao.items():
                if campo != 'id':
                    campos.append(f"{campo} = %s")
                    params.append(valor)

            if not campos:
                return self.obter_por_id(pagamento_id)

            campos.append("atualizado_em = %s")
            params.append(agora)
            params.append(pagamento_id)

            query = f"UPDATE pagamentos SET {', '.join(campos)} WHERE id = %s"
            self.db.execute_query(query, tuple(params))

            logger.info(f"Pagamento {pagamento_id} atualizado")
            return self.obter_por_id(pagamento_id)

        except Exception as e:
            logger.error(f"Erro ao atualizar pagamento: {e}")
            raise

    def deletar(self, pagamento_id: str) -> bool:
        """Deleta um pagamento"""
        try:
            query = "DELETE FROM pagamentos WHERE id = %s"
            self.db.execute_query(query, (pagamento_id,))
            logger.info(f"Pagamento {pagamento_id} deletado")
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar pagamento: {e}")
            raise

    def obter_resumo_aluno(self, aluno_id: str) -> dict:
        """Obtém resumo de pagamentos do aluno"""
        query = """
            SELECT 
                COUNT(*) as total_pagamentos,
                SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as total_pago,
                SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente,
                SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END) as total_atrasado,
                COUNT(CASE WHEN status = 'pago' THEN 1 END) as qtd_pago,
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) as qtd_pendente,
                COUNT(CASE WHEN status = 'atrasado' THEN 1 END) as qtd_atrasado
            FROM pagamentos
            WHERE aluno_id = %s
        """
        return self.db.execute_query_one(query, (aluno_id,))

    def obter_resumo_motorista(self, motorista_id: str) -> dict:
        """Obtém resumo de pagamentos gerenciados pelo motorista"""
        query = """
            SELECT 
                COUNT(*) as total_pagamentos,
                SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as total_pago,
                SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as total_pendente,
                SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END) as total_atrasado,
                COUNT(CASE WHEN status = 'pago' THEN 1 END) as qtd_pago,
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) as qtd_pendente,
                COUNT(CASE WHEN status = 'atrasado' THEN 1 END) as qtd_atrasado
            FROM pagamentos
            WHERE motorista_id = %s
        """
        return self.db.execute_query_one(query, (motorista_id,))
