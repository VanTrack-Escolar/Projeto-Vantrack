═══════════════════════════════════════════════════════════════════════════════
                    🚎 VANTRACK - CREDENCIAIS DE LOGIN
═══════════════════════════════════════════════════════════════════════════════

📋 DADOS DE ACESSO PADRÃO

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👨‍🚗 MOTORISTA                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Email:          motorista@teste.com                                       │
│  Senha:          123456                                                     │
│  CPF:            12345678901                                               │
│                                                                             │
│  Nome Completo:  João da Silva                                             │
│  Telefone:       11987654321                                               │
│  Cidade:         São Paulo                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👨‍🎓 ALUNO                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Email:          aluno@teste.com                                           │
│  Senha:          123456                                                     │
│  CPF:            98765432101                                               │
│                                                                             │
│  Nome Completo:  Maria dos Santos                                          │
│  Telefone:       11912345678                                               │
│  Cidade:         São Paulo                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

🚀 COMO USAR

1. INICIAR O BACKEND
   ─────────────────
   cd backend
   pip install -r requirements.txt
   python app.py
   
   → Rodará em http://localhost:5000


2. ABRIR O FRONTEND
   ─────────────────
   Navegador: http://localhost:3000
   (ou o caminho do seu index.html local)


3. FAZER LOGIN
   ───────────
   • Selecione o tipo de usuário (Motorista ou Aluno)
   • Use um email/senha acima
   • Clique em "ENTRAR"
   
   🆕 Se for NOVO DISPOSITIVO:
   → Página 2FA aparecerá pedindo código de 6 dígitos
   → Código é enviado via SMS (Twilio) ou Email (SMTP)


4. EXPLORAR O DASHBOARD
   ─────────────────────
   MOTORISTA:
   • Início (Checklist, Próxima Rota)
   • Lista de Alunos
   • Rotas do dia
   • Chat em Tempo Real

   ALUNO:
   • Rastreamento (Mapa ao vivo do ônibus)
   • Frequência (Calendário + SIM/NÃO)
   • Chat com Motorista
   • Configurações (Endereços)

═══════════════════════════════════════════════════════════════════════════════

✨ FUNCIONALIDADES IMPLEMENTADAS

AUTENTICAÇÃO
  ✅ Login/Cadastro com validação completa
  ✅ JWT Tokens (24 horas de expiração)
  ✅ Senha hasheada com bcrypt
  ✅ 2FA com SMS e Email (novo dispositivo)
  ✅ Device fingerprinting

REAL-TIME
  ✅ GPS ao vivo (WebSocket + Leaflet.js)
  ✅ Chat em tempo real (WebSocket Socket.IO)
  ✅ Broadcasts por room (rota/conversa)

INTERFACE
  ✅ Dashboard responsivo
  ✅ Sidebar com navegação
  ✅ Cards com dados
  ✅ Calendário interativo
  ✅ Mapa interativo
  ✅ Chat com timestamps

ARQUITETURA
  ✅ Clean Architecture (Domain-Driven)
  ✅ Flask + PostgreSQL
  ✅ Testes unitários
  ✅ Middleware de autenticação
  ✅ Tratamento de erros robusto

═══════════════════════════════════════════════════════════════════════════════

🧪 TESTAR 2FA (Autenticação de Dois Fatores)

1. Faça login com uma credencial acima (primeira vez)
   → Será bem-sucedido (dispositivo é marcado como confiável)

2. Abra o DevTools (F12) e vá para Console

3. Execute o comando:
   localStorage.clear()
   sessionStorage.clear()

4. Recarregue a página (F5)

5. Tente fazer login novamente com mesma credencial
   → Desta vez, você será redirecionado para página 2FA

6. Digite o código recebido (6 dígitos)
   → Após verificar, dispositivo é marcado e login completa

═══════════════════════════════════════════════════════════════════════════════

🛠️ CONFIGURAÇÃO DE CREDENCIAIS (Opcional)

Se quiser usar SMS/Email real, configure no backend/.env:

[TWILIO - SMS]
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_PHONE_NUMBER=+1234567890

[SMTP - EMAIL]
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

═══════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTAÇÃO

  📄 LEIA-ME-PRIMEIRO.md ........... Guia completo
  📄 CREDENCIAIS_TESTE.md ......... Credenciais detalhadas
  🌐 TESTE_VISUAL.html ............ Página visual de teste
  📊 PROJECT.md ................... Detalhes do projeto
  📄 CLAUDE.md .................... Histórico de desenvolvimento

═══════════════════════════════════════════════════════════════════════════════

✅ TUDO PRONTO! 🎉

Sistema VanTrack v1.0.0 está pronto para uso.
Use as credenciais acima para fazer login e explorar!

═══════════════════════════════════════════════════════════════════════════════
