import sys
import os
import hashlib
from uuid import uuid4
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from database import Database

def integrate():
    db = Database()
    print("Iniciando integração do motorista Wesley...")
    
    senha_hash = hashlib.sha256('123456'.encode('utf-8')).hexdigest()
    
    with db.get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Buscar ou criar motorista Wesley
        cursor.execute("SELECT id FROM usuarios WHERE nome = 'Wesley' AND tipo_perfil = 'motorista'")
        row = cursor.fetchone()
        
        if row:
            motorista_id = row['id']
            print(f"Motorista Wesley já existe (ID: {motorista_id})")
        else:
            motorista_id = str(uuid4())
            print(f"Criando motorista Wesley (ID: {motorista_id})...")
            cursor.execute("""
                INSERT INTO usuarios (id, tipo_perfil, nome, sobrenome, cpf, email, telefone, cidade, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (motorista_id, 'motorista', 'Wesley', 'Mota', '98765432199', 'wesley@teste.com', '11999999999', 'São Paulo', senha_hash))
        
        # 2. Buscar ou criar veículo para Wesley
        cursor.execute("SELECT id FROM veiculos WHERE motorista_id = %s", (motorista_id,))
        row_vei = cursor.fetchone()
        if row_vei:
            veiculo_id = row_vei['id']
            print(f"Veículo já existe para Wesley (ID: {veiculo_id})")
        else:
            veiculo_id = str(uuid4())
            print(f"Criando veículo para Wesley (ID: {veiculo_id})...")
            cursor.execute("""
                INSERT INTO veiculos (id, motorista_id, placa, modelo, ano, capacidade_passageiros, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (veiculo_id, motorista_id, 'WES-1234', 'Mercedes Benz Van', 2023, 16, True))
            
        # 3. Buscar ou criar rota para Wesley
        cursor.execute("SELECT id FROM rotas WHERE motorista_id = %s", (motorista_id,))
        row_rot = cursor.fetchone()
        if row_rot:
            rota_id = row_rot['id']
            print(f"Rota já existe para Wesley (ID: {rota_id})")
        else:
            rota_id = str(uuid4())
            print(f"Criando rota para Wesley (ID: {rota_id})...")
            cursor.execute("""
                INSERT INTO rotas (id, motorista_id, veiculo_id, titulo, local_saida, local_chegada, horario_saida, horario_chegada, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (rota_id, motorista_id, veiculo_id, 'Rota de Wesley Centro-Zona Sul', 'Terminal Central', 'Colégio Integral', '07:30:00', '08:30:00', True))
            
        # 4. Buscar TODOS os alunos registrados
        cursor.execute("SELECT id, nome FROM usuarios WHERE tipo_perfil = 'aluno'")
        alunos = cursor.fetchall()
        print(f"Encontrados {len(alunos)} alunos cadastrados.")
        
        # 5. Vincular cada aluno na rota do Wesley
        for i, aluno in enumerate(alunos):
            aluno_id = aluno['id']
            nome_aluno = aluno['nome']
            
            # Verificar se já está inscrito na rota de Wesley
            cursor.execute("SELECT id FROM inscricoes WHERE aluno_id = %s AND rota_id = %s", (aluno_id, rota_id))
            if cursor.fetchone():
                print(f"Aluno {nome_aluno} já está vinculado na rota de Wesley")
            else:
                print(f"Vinculando aluno {nome_aluno} na rota de Wesley...")
                cursor.execute("""
                    INSERT INTO inscricoes (id, aluno_id, rota_id, status)
                    VALUES (%s, %s, %s, %s)
                """, (str(uuid4()), aluno_id, rota_id, 'ativa'))
                
            # Adicionar endereço principal se não houver
            cursor.execute("SELECT id FROM enderecos WHERE aluno_id = %s", (aluno_id,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO enderecos (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, principal)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (str(uuid4()), aluno_id, rota_id, 'Endereço de Coleta Teste, 100', 'Escola Principal, 200', True))
                
            # Gerar pagamentos para o aluno com Wesley
            # Junho/2026: alternar status para testar
            # Aluno 0: pago, Aluno 1: pendente, Aluno 2: atrasado, etc.
            status_opts = ['pago', 'pendente', 'atrasado']
            status = status_opts[i % len(status_opts)]
            
            # Verificar se pagamento já existe para Junho/2026
            cursor.execute("""
                SELECT id FROM pagamentos 
                WHERE aluno_id = %s AND motorista_id = %s AND mes_referencia = 6 AND ano_referencia = 2026
            """, (aluno_id, motorista_id))
            
            if cursor.fetchone():
                print(f"Pagamento de Junho/2026 já cadastrado para {nome_aluno}")
            else:
                print(f"Gerando pagamento ({status}) para {nome_aluno}...")
                data_pagamento = '2026-06-02 10:00:00' if status == 'pago' else None
                metodo = 'pix' if status == 'pago' else None
                
                cursor.execute("""
                    INSERT INTO pagamentos (id, aluno_id, motorista_id, rota_id, valor, mes_referencia, ano_referencia, status, data_vencimento, data_pagamento, metodo_pagamento, descricao)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (str(uuid4()), aluno_id, motorista_id, rota_id, 250.00, 6, 2026, status, '2026-06-10', data_pagamento, metodo, 'Mensalidade Junho 2026'))
        
        conn.commit()
        print("✓ Integração de Wesley concluída com sucesso!")

if __name__ == '__main__':
    integrate()
