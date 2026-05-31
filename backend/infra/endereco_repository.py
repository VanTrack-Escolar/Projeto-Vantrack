class EnderecoRepository:
    def __init__(self, db):
        self.db = db

    def criar(self, endereco):
        query = """
            INSERT INTO enderecos 
            (id, aluno_id, rota_id, endereco_coleta, endereco_entrega, 
             latitude_coleta, longitude_coleta, latitude_entrega, longitude_entrega, principal, criado_em)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        params = (
            endereco.id, endereco.aluno_id, endereco.rota_id, endereco.endereco_coleta, endereco.endereco_entrega,
            endereco.latitude_coleta, endereco.longitude_coleta, endereco.latitude_entrega, 
            endereco.longitude_entrega, endereco.principal
        )
        self.db.execute_query(query, params)
        
        # Buscar o endereço criado pelo ID do UUID correspondente
        endereco_criado = self.buscar_por_id(endereco.id)
        return endereco_criado

    def buscar_por_id(self, endereco_id):
        query = "SELECT * FROM enderecos WHERE id = %s"
        return self.db.execute_query_one(query, (endereco_id,))

    def listar_por_aluno(self, aluno_id):
        query = "SELECT * FROM enderecos WHERE aluno_id = %s ORDER BY principal DESC, criado_em DESC"
        return self.db.execute_query(query, (aluno_id,), fetch=True)

    def listar_por_rota(self, rota_id):
        query = "SELECT * FROM enderecos WHERE rota_id = %s ORDER BY criado_em DESC"
        return self.db.execute_query(query, (rota_id,), fetch=True)

    def listar_por_aluno_e_rota(self, aluno_id, rota_id):
        query = "SELECT * FROM enderecos WHERE aluno_id = %s AND rota_id = %s"
        return self.db.execute_query(query, (aluno_id, rota_id), fetch=True)

    def buscar_principal(self, aluno_id):
        query = "SELECT * FROM enderecos WHERE aluno_id = %s AND principal = TRUE LIMIT 1"
        return self.db.execute_query_one(query, (aluno_id,))

    def atualizar(self, endereco_id, dados):
        campos = []
        params = []
        for chave, valor in dados.items():
            if valor is not None:
                campos.append(f"{chave} = %s")
                params.append(valor)
        
        if not campos:
            return None
        
        params.append(endereco_id)
        query = f"UPDATE enderecos SET {', '.join(campos)}, atualizado_em = NOW() WHERE id = %s"
        self.db.execute_query(query, params)
        
        # Buscar o endereço atualizado
        endereco_atualizado = self.buscar_por_id(endereco_id)
        return endereco_atualizado

    def deletar(self, endereco_id):
        query = "DELETE FROM enderecos WHERE id = %s"
        self.db.execute_query(query, (endereco_id,))

    def desmarcar_principal(self, aluno_id):
        query = "UPDATE enderecos SET principal = FALSE WHERE aluno_id = %s AND principal = TRUE"
        self.db.execute_query(query, (aluno_id,))
