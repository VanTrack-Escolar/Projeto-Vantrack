"""
Script para inicializar dados de pagamentos de teste
Execute: python setup_pagamentos.py
"""

from database import Database
from uuid import uuid4
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def criar_pagamentos_teste():
    """Cria pagamentos de teste para alunos"""
    db = Database()
    
    try:
        # Buscar alunos, motoristas e rotas
        with db.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            
            # Buscar alunos inscritos
            cursor.execute("""
                SELECT DISTINCT 
                    u.id as aluno_id,
                    u.nome,
                    i.rota_id,
                    r.motorista_id
                FROM usuarios u
                JOIN inscricoes i ON u.id = i.aluno_id
                JOIN rotas r ON i.rota_id = r.id
                WHERE u.tipo_perfil = 'aluno'
                LIMIT 20
            """)
            
            inscricoes = cursor.fetchall()
            
            if not inscricoes:
                logger.warning("Nenhuma inscrição encontrada")
                return
            
            # Meses para criar pagamentos
            meses_criar = [
                (5, 2026),  # Maio 2026
                (4, 2026),  # Abril 2026
                (3, 2026),  # Março 2026
            ]
            
            pagamentos_criados = 0
            
            for mes, ano in meses_criar:
                for inscricao in inscricoes:
                    pagamento_id = str(uuid4())
                    aluno_id = inscricao['aluno_id']
                    motorista_id = inscricao['motorista_id']
                    rota_id = inscricao['rota_id']
                    
                    # Data de vencimento: 10 do mês
                    data_vencimento = f"{ano}-{mes:02d}-10"
                    
                    # Status baseado na data
                    hoje = datetime.now()
                    vencimento = datetime(ano, mes, 10)
                    
                    if vencimento < hoje:
                        status = 'atrasado' if mes < 5 else 'pendente'
                    else:
                        status = 'pendente'
                    
                    # Algumas faturas já pagas
                    if mes < 5:
                        status = 'pago'
                        data_pagamento = vencimento - timedelta(days=2)
                        metodo = 'pix'
                    else:
                        data_pagamento = None
                        metodo = ''
                    
                    # Valor padrão de R$ 150
                    valor = 150.00
                    
                    # Mês anterior pode estar atrasado
                    if mes < 5 and status != 'pago':
                        status = 'atrasado'
                    
                    try:
                        query = """
                            INSERT INTO pagamentos 
                            (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, 
                             ano_referencia, status, data_vencimento, data_pagamento,
                             metodo_pagamento, descricao, criado_em, atualizado_em)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        params = (
                            pagamento_id,
                            aluno_id,
                            motorista_id,
                            rota_id,
                            valor,
                            mes,
                            ano,
                            status,
                            data_vencimento,
                            data_pagamento,
                            metodo,
                            f"Mensalidade de {['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'][mes]} {ano}",
                            datetime.now(),
                            datetime.now()
                        )
                        
                        cursor.execute(query, params)
                        pagamentos_criados += 1
                        
                    except Exception as e:
                        if "Duplicate entry" in str(e):
                            logger.info(f"Pagamento já existe: {aluno_id} - {mes}/{ano}")
                        else:
                            logger.error(f"Erro ao inserir pagamento: {e}")
                        continue
            
            conn.commit()
            logger.info(f"✓ {pagamentos_criados} pagamentos criados com sucesso!")
            
    except Exception as e:
        logger.error(f"Erro ao criar pagamentos de teste: {e}")
        raise

if __name__ == '__main__':
    criar_pagamentos_teste()
