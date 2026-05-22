class RotaRepository:
    def __init__(self, db):
        self.db = db

    def criar(self, rota):
        query = """
            INSERT INTO rotas (nome, origem, destino, horario_partida, capacidade_maxima, motorista_id, veiculo_id, ativa, criado_em)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        params = (rota.nome, rota.origem, rota.destino, rota.horario_partida, 
                  rota.capacidade_maxima, rota.motorista_id, rota.veiculo_id, True)
        self.db.execute_query(query, params)
        
        # Buscar a rota criada pelo último ID inserido
        last_id = self.db.get_last_insert_id()
        rota_criada = self.buscar_por_id(last_id)
        return rota_criada

    def buscar_por_id(self, rota_id):
        query = "SELECT * FROM rotas WHERE id = %s"
        return self.db.execute_query_one(query, (rota_id,))

    def listar_por_motorista(self, motorista_id):
        query = "SELECT * FROM rotas WHERE motorista_id = %s AND ativo = TRUE"
        return self.db.execute_query(query, (motorista_id,), fetch=True)

    def listar_ativas(self):
        query = "SELECT * FROM rotas WHERE ativo = TRUE"
        return self.db.execute_query(query, fetch=True)

    def listar_todas(self):
        query = "SELECT * FROM rotas"
        return self.db.execute_query(query, fetch=True)

    def atualizar(self, rota_id, dados):
        campos = []
        params = []
        for chave, valor in dados.items():
            if valor is not None:
                campos.append(f"{chave} = %s")
                params.append(valor)
        
        if not campos:
            return None
        
        params.append(rota_id)
        query = f"UPDATE rotas SET {', '.join(campos)}, atualizado_em = NOW() WHERE id = %s"
        self.db.execute_query(query, params)
        
        # Buscar a rota atualizada
        rota_atualizada = self.buscar_por_id(rota_id)
        return rota_atualizada

    def deletar(self, rota_id):
        query = "UPDATE rotas SET ativo = FALSE, atualizado_em = NOW() WHERE id = %s"
        self.db.execute_query(query, (rota_id,))

    def desativar(self, rota_id):
        query = "UPDATE rotas SET ativo = FALSE WHERE id = %s"
        self.db.execute_query(query, (rota_id,))
        
        # Buscar a rota atualizada
        rota_atualizada = self.buscar_por_id(rota_id)
        return rota_atualizada
