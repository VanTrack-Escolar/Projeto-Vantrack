from uuid import uuid4

class ChamadoRepository:
    def __init__(self, db):
        self.db = db

    def criar(self, usuario_id, assunto, descricao):
        chamado_id = str(uuid4())
        query = """
            INSERT INTO chamados (id, usuario_id, assunto, descricao, status, criado_em, atualizado_em)
            VALUES (%s, %s, %s, %s, 'aberto', NOW(), NOW())
        """
        params = (chamado_id, usuario_id, assunto, descricao)
        self.db.execute_query(query, params)
        return self.buscar_por_id(chamado_id)

    def buscar_por_id(self, chamado_id):
        query = """
            SELECT c.*, u.nome, u.sobrenome, u.tipo_perfil, u.email 
            FROM chamados c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = %s
        """
        return self.db.execute_query_one(query, (chamado_id,))

    def listar_todos(self):
        query = """
            SELECT c.*, u.nome, u.sobrenome, u.tipo_perfil, u.email 
            FROM chamados c
            JOIN usuarios u ON c.usuario_id = u.id
            ORDER BY c.criado_em DESC
        """
        return self.db.execute_query(query, fetch=True)

    def listar_por_usuario(self, usuario_id):
        query = """
            SELECT c.*, u.nome, u.sobrenome, u.tipo_perfil, u.email 
            FROM chamados c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.usuario_id = %s
            ORDER BY c.criado_em DESC
        """
        return self.db.execute_query(query, (usuario_id,), fetch=True)

    def atualizar_status(self, chamado_id, status):
        query = "UPDATE chamados SET status = %s, atualizado_em = NOW() WHERE id = %s"
        self.db.execute_query(query, (status, chamado_id))
        return self.buscar_por_id(chamado_id)
