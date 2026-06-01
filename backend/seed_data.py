import sys
import os
from uuid import uuid4
import hashlib
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from database import Database

def seed():
    db = Database()
    
    print("=" * 60)
    print("INICIALIZANDO SEMEADURA DE DADOS DE TESTE (VANTRACK)")
    print("=" * 60)
    
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            
            # 1. Limpar dados anteriores
            print("Limpando dados antigos...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE pagamentos")
            cursor.execute("TRUNCATE TABLE enderecos")
            cursor.execute("TRUNCATE TABLE inscricoes")
            cursor.execute("TRUNCATE TABLE presenca_diaria")
            cursor.execute("TRUNCATE TABLE rotas")
            cursor.execute("TRUNCATE TABLE veiculos")
            # Deletar apenas usuários de teste específicos para não bagunçar
            cursor.execute("DELETE FROM usuarios WHERE email LIKE '%@teste.com'")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            print("✓ Tabelas limpas com sucesso!")
            
            # 2. Criar Senha Hash
            senha_teste = '123456'
            senha_hash = hashlib.sha256(senha_teste.encode('utf-8')).hexdigest()
            
            # 3. Criar Motorista
            motorista_id = str(uuid4())
            print(f"Criando Motorista: João da Silva ({motorista_id})...")
            cursor.execute("""
                INSERT INTO usuarios (id, tipo_perfil, nome, sobrenome, cpf, email, telefone, cidade, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (motorista_id, 'motorista', 'João', 'Silva', '12345678901', 'motorista@teste.com', '11987654321', 'São Paulo', senha_hash))
            
            # 4. Criar Alunos
            aluno1_id = str(uuid4())
            aluno2_id = str(uuid4())
            aluno3_id = str(uuid4())
            
            print(f"Criando Aluno 1: Maria dos Santos ({aluno1_id})...")
            cursor.execute("""
                INSERT INTO usuarios (id, tipo_perfil, nome, sobrenome, cpf, email, telefone, cidade, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (aluno1_id, 'aluno', 'Maria', 'dos Santos', '98765432101', 'aluno@teste.com', '11912345678', 'São Paulo', senha_hash))
            
            print(f"Criando Aluno 2: Pedro Albuquerque ({aluno2_id})...")
            cursor.execute("""
                INSERT INTO usuarios (id, tipo_perfil, nome, sobrenome, cpf, email, telefone, cidade, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (aluno2_id, 'aluno', 'Pedro', 'Albuquerque', '98765432102', 'aluno2@teste.com', '11922345678', 'São Paulo', senha_hash))
            
            print(f"Criando Aluno 3: Ana Clara Ramos ({aluno3_id})...")
            cursor.execute("""
                INSERT INTO usuarios (id, tipo_perfil, nome, sobrenome, cpf, email, telefone, cidade, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (aluno3_id, 'aluno', 'Ana Clara', 'Ramos', '98765432103', 'aluno3@teste.com', '11933456789', 'São Paulo', senha_hash))
            
            # 5. Criar Veículo para o Motorista
            veiculo_id = str(uuid4())
            print(f"Criando Veículo: Sprinter ABC-1234 ({veiculo_id})...")
            cursor.execute("""
                INSERT INTO veiculos (id, motorista_id, placa, modelo, ano, capacidade_passageiros, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (veiculo_id, motorista_id, 'ABC-1234', 'Mercedes Sprinter', 2022, 15, True))
            
            # 6. Criar Rota para o Motorista/Veículo
            rota_id = str(uuid4())
            print(f"Criando Rota: Rota Escolar Centro-Sul ({rota_id})...")
            cursor.execute("""
                INSERT INTO rotas (id, motorista_id, veiculo_id, titulo, local_saida, local_chegada, horario_saida, horario_chegada, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (rota_id, motorista_id, veiculo_id, 'Rota Escolar Centro-Zona Sul', 'Terminal Central', 'Colégio Integral', '07:30:00', '08:30:00', True))
            
            # 7. Criar Inscrições
            print("Inscrevendo alunos na rota...")
            for a_id in [aluno1_id, aluno2_id, aluno3_id]:
                cursor.execute("""
                    INSERT INTO inscricoes (id, aluno_id, rota_id, status)
                    VALUES (%s, %s, %s, %s)
                """, (str(uuid4()), a_id, rota_id, 'ativa'))
                
            # 8. Criar Endereços
            print("Configurando endereços dos alunos...")
            cursor.execute("""
                INSERT INTO enderecos (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, principal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno1_id, rota_id, 'Rua das Flores, 123 - Centro', 'Colégio Integral, Rua das Acácias - Sul', True))
            
            cursor.execute("""
                INSERT INTO enderecos (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, principal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno2_id, rota_id, 'Av. Paulista, 1500 - Bela Vista', 'Colégio Integral, Rua das Acácias - Sul', True))
            
            cursor.execute("""
                INSERT INTO enderecos (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, principal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno3_id, rota_id, 'Rua dos Pinheiros, 456 - Pinheiros', 'Colégio Integral, Rua das Acácias - Sul', True))
            
            # 9. Criar Pagamentos
            print("Gerando histórico de pagamentos...")
            
            # Março 2026: todos pagos
            for a_id in [aluno1_id, aluno2_id, aluno3_id]:
                cursor.execute("""
                    INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (str(uuid4()), a_id, motorista_id, rota_id, 150.00, 3, 2026, 'pago', '2026-03-10', '2026-03-08 14:30:00', 'pix', 'Mensalidade de Março 2026'))
                
            # Abril 2026:
            # - Maria (aluno1): Pago
            # - Pedro (aluno2): Atrasado
            # - Ana (aluno3): Pago
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno1_id, motorista_id, rota_id, 150.00, 4, 2026, 'pago', '2026-04-10', '2026-04-09 10:15:00', 'pix', 'Mensalidade de Abril 2026'))
            
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno2_id, motorista_id, rota_id, 150.00, 4, 2026, 'atrasado', '2026-04-10', None, None, 'Mensalidade de Abril 2026'))
            
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno3_id, motorista_id, rota_id, 150.00, 4, 2026, 'pago', '2026-04-10', '2026-04-10 17:45:00', 'dinheiro', 'Mensalidade de Abril 2026'))
            
            # Maio 2026:
            # - Maria (aluno1): Pago
            # - Pedro (aluno2): Pendente
            # - Ana (aluno3): Atrasado
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno1_id, motorista_id, rota_id, 150.00, 5, 2026, 'pago', '2026-05-10', '2026-05-09 09:20:00', 'debito', 'Mensalidade de Maio 2026'))
            
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno2_id, motorista_id, rota_id, 150.00, 5, 2026, 'pendente', '2026-05-10', None, None, 'Mensalidade de Maio 2026'))
            
            cursor.execute("""
                INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid4()), aluno3_id, motorista_id, rota_id, 150.00, 5, 2026, 'atrasado', '2026-05-10', None, None, 'Mensalidade de Maio 2026'))
            
            conn.commit()
            
            print("\n" + "=" * 60)
            print("✓ DADOS DE TESTE SEMEADOS COM SUCESSO!")
            print("=" * 60)
            print("Credenciais de acesso:")
            print("  • MOTORISTA: motorista@teste.com | Senha: 123456")
            print("  • ALUNO 1: aluno@teste.com | Senha: 123456")
            print("  • ALUNO 2: aluno2@teste.com | Senha: 123456")
            print("  • ALUNO 3: aluno3@teste.com | Senha: 123456")
            print("=" * 60)
            
    except Exception as e:
        print(f"\n✗ ERRO NO SETUP: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    seed()
