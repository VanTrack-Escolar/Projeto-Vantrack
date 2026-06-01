from exceptions import UsuarioNaoEncontrado, DadosInvalidos

class ObterUsuario:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, usuario_id):
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if not usuario:
            raise UsuarioNaoEncontrado(f"Usuário com id {usuario_id} não encontrado")
        
        del usuario['senha_hash']
        return usuario

class ListarUsuariosPorTipo:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, tipo_perfil):
        if tipo_perfil not in ['aluno', 'motorista']:
            raise DadosInvalidos("Tipo de perfil inválido")
        
        usuarios = self.usuario_repository.listar_por_tipo(tipo_perfil)
        for usuario in usuarios:
            del usuario['senha_hash']
        return usuarios

class AtualizarPerfil:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, usuario_id, dados):
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if not usuario:
            raise UsuarioNaoEncontrado(f"Usuário com id {usuario_id} não encontrado")
        
        campos_permitidos = ['nome', 'email', 'telefone', 'cidade']
        dados_filtrados = {k: v for k, v in dados.items() if k in campos_permitidos}
        
        if not dados_filtrados:
            raise DadosInvalidos("Nenhum campo válido para atualizar")
        
        usuario_atualizado = self.usuario_repository.atualizar(usuario_id, dados_filtrados)
        del usuario_atualizado['senha_hash']
        return usuario_atualizado
