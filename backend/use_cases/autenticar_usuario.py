import hashlib
import jwt
import os
from datetime import datetime, timedelta
from exceptions import SenhaInvalida, UsuarioNaoEncontrado, EmailJaCadastrado, CPFJaCadastrado
from domain.usuario import UsuarioCreate, Usuario

class AutenticarUsuario:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, email, senha):
        usuario = self.usuario_repository.buscar_por_email(email)
        if not usuario:
            raise UsuarioNaoEncontrado(f"Usuário com email {email} não encontrado")
        
        senha_hash_input = hashlib.sha256(senha.encode('utf-8')).hexdigest()
        if senha_hash_input != usuario['senha_hash']:
            raise SenhaInvalida("Senha incorreta")
        
        # Gerar JWT
        payload = {
            'usuario_id': usuario['id'],
            'email': usuario['email'],
            'tipo_perfil': usuario['tipo_perfil'],
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, os.getenv('JWT_SECRET', 'seu-secreto-jwt-super-seguro'), algorithm='HS256')
        
        return {
            'token': token,
            'usuario': {
                'id': usuario['id'],
                'email': usuario['email'],
                'nome': usuario['nome'],
                'sobrenome': usuario.get('sobrenome', ''),
                'telefone': usuario.get('telefone', ''),
                'cidade': usuario.get('cidade', ''),
                'tipo_perfil': usuario['tipo_perfil']
            }
        }

class CadastrarUsuario:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, dados: UsuarioCreate):
        print(f"\n[USE-CASE] Iniciando cadastro de usuário: {dados.email}")
        
        try:
            # Validar duplicatas
            print(f"[USE-CASE] Verificando se email já existe: {dados.email}")
            if self.usuario_repository.email_existe(dados.email):
                raise EmailJaCadastrado(f"Email {dados.email} já cadastrado")
            print(f"[USE-CASE] ✓ Email disponível")
            
            print(f"[USE-CASE] Verificando se CPF já existe: {dados.cpf}")
            if self.usuario_repository.cpf_existe(dados.cpf):
                raise CPFJaCadastrado(f"CPF {dados.cpf} já cadastrado")
            print(f"[USE-CASE] ✓ CPF disponível")
            
            # Hash da senha com SHA-256
            print(f"[USE-CASE] Hasheando senha...")
            senha_hash = hashlib.sha256(dados.senha.encode('utf-8')).hexdigest()
            print(f"[USE-CASE] ✓ Senha hasheada")
            
            # Tratar caso o sobrenome venha vazio (frontend envia nome e sobrenome juntos no campo 'nome')
            nome_completo = dados.nome.strip()
            partes = nome_completo.split(" ", 1)
            nome_final = partes[0]
            sobrenome_final = partes[1] if len(partes) > 1 else ""
            
            if dados.sobrenome:
                nome_final = dados.nome
                sobrenome_final = dados.sobrenome

            # Criar objeto Usuario
            print(f"[USE-CASE] Criando objeto Usuario...")
            usuario = Usuario(
                email=dados.email,
                cpf=dados.cpf,
                nome=nome_final,
                sobrenome=sobrenome_final,
                telefone=dados.telefone,
                cidade=dados.cidade,
                tipo_perfil=dados.tipo_perfil,
                senha_hash=senha_hash
            )
            
            # Inserir no banco
            print(f"[USE-CASE] Inserindo usuário no banco...")
            resultado = self.usuario_repository.criar(usuario)
            print(f"[USE-CASE] ✓ Usuário criado com sucesso: {resultado.get('id')}")
            
            return {
                'id': resultado['id'],
                'email': resultado['email'],
                'nome': resultado['nome'],
                'tipo_perfil': resultado['tipo_perfil'],
                'mensagem': 'Usuário cadastrado com sucesso'
            }
        except (EmailJaCadastrado, CPFJaCadastrado) as e:
            print(f"[USE-CASE] ✗ Erro de duplicidade: {str(e)}")
            raise
        except Exception as e:
            print(f"[USE-CASE] ✗ Erro genérico: {str(e)}")
            import traceback
            print(f"[USE-CASE] StackTrace:\n{traceback.format_exc()}")
            raise

class RecuperarSenha:
    def __init__(self, usuario_repository):
        self.usuario_repository = usuario_repository

    def executar(self, email, nova_senha):
        usuario = self.usuario_repository.buscar_por_email(email)
        if not usuario:
            raise UsuarioNaoEncontrado(f"Usuário com email {email} não encontrado")
        
        # Hash da nova senha com SHA-256
        senha_hash = hashlib.sha256(nova_senha.encode('utf-8')).hexdigest()
        
        self.usuario_repository.atualizar(usuario['id'], {'senha_hash': senha_hash})
        
        return {'mensagem': 'Senha atualizada com sucesso'}
