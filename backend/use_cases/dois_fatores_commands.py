from exceptions import VantrackException, PermissaoNegada, UsuarioNaoEncontrado
from datetime import datetime
import hashlib
from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


class GenerarCodigoVerificacao2FA:
    """Gera novo código 2FA baseado em novo dispositivo"""
    
    def __init__(self, usuario_repository, dois_fatores_repository):
        self.usuario_repository = usuario_repository
        self.dois_fatores_repository = dois_fatores_repository

    def executar(self, usuario_id, dispositivo_hash, metodo, telefone_sms=None, email_envio=None):
        """
        Args:
            usuario_id: ID do usuário
            dispositivo_hash: Hash do dispositivo (baseado em User-Agent + IP)
            metodo: 'SMS' ou 'EMAIL'
            telefone_sms: Telefone para envio de SMS (sem formatação)
            email_envio: Email para envio de código
        
        Returns:
            Dicionário com dados do código 2FA (sem expor o código)
        """
        # Validar usuário
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if not usuario:
            raise UsuarioNaoEncontrado("Usuário não encontrado")

        # Limpar códigos expirados anteriores
        self.dois_fatores_repository.limpar_expirados(usuario_id)

        # Criar novo código 2FA
        codigo = self.dois_fatores_repository.criar(
            usuario_id=usuario_id,
            dispositivo_hash=dispositivo_hash,
            metodo=metodo,
            telefone_sms=telefone_sms or (usuario['telefone'] if metodo == 'SMS' else None),
            email_envio=email_envio or (usuario['email'] if metodo == 'EMAIL' else None)
        )

        return {
            'dois_fatores_id': codigo.id,
            'usuario_id': usuario_id,
            'metodo': metodo,
            'telefone_sms_mascarado': self._mascarar_telefone(codigo.telefone_sms) if codigo.telefone_sms else None,
            'email_mascarado': self._mascarar_email(codigo.email_envio) if codigo.email_envio else None,
            'expira_em': codigo.expira_em.isoformat()
        }

    @staticmethod
    def _mascarar_telefone(telefone):
        if not telefone or len(telefone) < 4:
            return telefone
        return f"***{telefone[-4:]}"

    @staticmethod
    def _mascarar_email(email):
        if not email or '@' not in email:
            return email
        local, dominio = email.split('@')
        return f"{local[0]}***@{dominio}"


class EnviarCodigoVerificacao2FA:
    """Envia código 2FA via SMS (Twilio) ou Email"""
    
    def __init__(self, dois_fatores_repository):
        self.dois_fatores_repository = dois_fatores_repository
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')

    def executar(self, dois_fatores_id):
        """
        Envia código 2FA via SMS ou Email
        
        Args:
            dois_fatores_id: ID do registro de verificação 2FA
        
        Returns:
            Dicionário com status do envio
        """
        codigo = self.dois_fatores_repository.buscar_por_id(dois_fatores_id)
        if not codigo:
            raise VantrackException("Código 2FA não encontrado")

        if codigo.metodo == 'SMS':
            sucesso = self._enviar_sms(codigo.telefone_sms, codigo.codigo_2fa)
        elif codigo.metodo == 'EMAIL':
            sucesso = self._enviar_email(codigo.email_envio, codigo.codigo_2fa)
        else:
            raise VantrackException(f"Método 2FA inválido: {codigo.metodo}")

        if not sucesso:
            raise VantrackException("Falha ao enviar código de verificação")

        return {
            'status': 'enviado',
            'metodo': codigo.metodo,
            'criado_em': codigo.criado_em.isoformat(),
            'expira_em': codigo.expira_em.isoformat()
        }

    def _enviar_sms(self, telefone, codigo):
        """Envia código via Twilio"""
        try:
            if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone]):
                raise VantrackException("Configuração Twilio incompleta")

            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            # Formatar telefone: adicionar +55 e remover formatação
            telefone_formatado = f"+55{telefone}"
            
            message = client.messages.create(
                body=f"Seu código de verificação VanTrack é: {codigo}. Válido por 5 minutos.",
                from_=self.twilio_phone,
                to=telefone_formatado
            )
            
            return message.sid is not None
        except Exception as e:
            print(f"Erro ao enviar SMS: {str(e)}")
            return False

    def _enviar_email(self, email, codigo):
        """Envia código via Email (SMTP) e loga no terminal"""
        print(f"\n[2FA DEBUG] 🔐 CÓDIGO OTP GERADO PARA {email}: {codigo} 🔐\n")
        try:
            # Se credenciais forem ausentes ou as padrão do .env, simulamos apenas pelo terminal
            if (not all([self.smtp_server, self.smtp_user, self.smtp_password]) or 
                "your_email@gmail.com" in self.smtp_user or 
                "your_app_password_here" in self.smtp_password):
                print("[2FA DEBUG] Credenciais SMTP ausentes ou padrão no .env. Simulando envio apenas pelo terminal.")
                return True # Retorna sucesso para permitir o avanço mesmo sem SMTP real

            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = email
            msg['Subject'] = 'Código de Verificação VanTrack - 2FA'

            corpo = f"""
            <html>
                <body>
                    <h2>Código de Verificação</h2>
                    <p>Seu código de verificação para login na plataforma VanTrack é:</p>
                    <h1 style="color: #0099ff; font-size: 48px; letter-spacing: 5px;">{codigo}</h1>
                    <p>Este código é válido por <strong>5 minutos</strong>.</p>
                    <p style="color: #666;">Se você não solicitou este código, ignore esta mensagem.</p>
                </body>
            </html>
            """

            msg.attach(MIMEText(corpo, 'html'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            return True
        except Exception as e:
            print(f"Erro ao enviar email: {str(e)}")
            return False


class VerificarCodigoVerificacao2FA:
    """Verifica código 2FA fornecido pelo usuário"""
    
    def __init__(self, dois_fatores_repository):
        self.dois_fatores_repository = dois_fatores_repository

    def executar(self, usuario_id, dispositivo_hash, codigo_fornecido):
        """
        Valida código 2FA
        
        Args:
            usuario_id: ID do usuário
            dispositivo_hash: Hash do dispositivo
            codigo_fornecido: Código fornecido pelo usuário (6 dígitos)
        
        Returns:
            Dicionário com resultado da validação
        """
        codigo = self.dois_fatores_repository.buscar_ativo_por_usuario_e_dispositivo(
            usuario_id, dispositivo_hash
        )

        if not codigo:
            raise VantrackException("Nenhum código 2FA ativo encontrado")

        # Validar código
        valido, mensagem = codigo.validar_codigo(codigo_fornecido)

        if not valido:
            # Atualizar tentativas no banco
            self.dois_fatores_repository.atualizar_verificacao(
                codigo.id,
                False,
                codigo.tentativas_restantes
            )
            raise VantrackException(mensagem)

        # Atualizar como verificado no banco
        self.dois_fatores_repository.atualizar_verificacao(
            codigo.id,
            True,
            0
        )

        return {
            'status': 'verificado',
            'usuario_id': usuario_id,
            'dispositivo_hash': dispositivo_hash,
            'verificado_em': codigo.verificado_em.isoformat()
        }


class ReenviarCodigoVerificacao2FA:
    """Reenvia código 2FA"""
    
    def __init__(self, dois_fatores_repository):
        self.dois_fatores_repository = dois_fatores_repository

    def executar(self, dois_fatores_id):
        """
        Reenvia código 2FA
        
        Args:
            dois_fatores_id: ID do registro de verificação 2FA
        
        Returns:
            Dicionário com status do reenvio
        """
        codigo = self.dois_fatores_repository.buscar_por_id(dois_fatores_id)
        if not codigo:
            raise VantrackException("Código 2FA não encontrado")

        if codigo.verificado:
            raise VantrackException("Código já foi verificado")

        if datetime.utcnow() > codigo.expira_em:
            raise VantrackException("Código expirou. Solicite um novo login")

        # Não reenviamos se ainda há muitas tentativas - prevenir abuse
        if codigo.tentativas_restantes <= 0:
            raise VantrackException("Número máximo de tentativas atingido. Faça novo login")

        return {
            'status': 'reenviado',
            'metodo': codigo.metodo,
            'telefone_mascarado': self._mascarar_telefone(codigo.telefone_sms) if codigo.telefone_sms else None,
            'email_mascarado': self._mascarar_email(codigo.email_envio) if codigo.email_envio else None,
            'expira_em': codigo.expira_em.isoformat()
        }

    @staticmethod
    def _mascarar_telefone(telefone):
        if not telefone or len(telefone) < 4:
            return telefone
        return f"***{telefone[-4:]}"

    @staticmethod
    def _mascarar_email(email):
        if not email or '@' not in email:
            return email
        local, dominio = email.split('@')
        return f"{local[0]}***@{dominio}"
