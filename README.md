# 🚌 VANTRACK - Sistema de Gestão de Transporte Escolar

> Rastreamento GPS em tempo real, autenticação multifator (2FA) e chat instantâneo para motoristas, alunos e responsáveis.

---

## ⚡ Status do Projeto
* **Backend (Flask + MySQL):**   ✅ 100% Concluído & Testado
* **Frontend (HTML/CSS/JS):**   ✅ 100% Concluído & Integrado
* **Autenticação (JWT + 2FA):**  ✅ 100% Concluído
* **Comunicação em Tempo Real:** ✅ 100% Concluído (WebSockets)

---

## 🎯 Funcionalidades Principais

* **🔒 Segurança Avançada (JWT & 2FA):** 
  * Registro e login seguro com senhas criptografadas usando `bcrypt`.
  * Verificação de Dois Fatores (2FA) via E-mail/SMS para novos dispositivos ou sessões não autorizadas.
  * Proteção e controle de rotas por perfis de acesso (`aluno` vs `motorista`).
* **🗺️ Rastreamento em Tempo Real:**
  * Integração completa com mapas interativos utilizando **Leaflet.js** e **OpenStreetMap**.
  * Transmissão de coordenadas geográficas instantâneas via **Socket.IO** (WebSockets).
* **💬 Chat Bidirecional Instantâneo:**
  * Sala de mensagens em tempo real entre o motorista e os alunos/pais.
  * Histórico persistente de mensagens gravado diretamente no banco de dados.
* **📅 Gestão de Presença Inteligente:**
  * Botão de confirmação de embarque rápido no painel do aluno (*"Vou para a escola hoje?"*).
  * Calendário interativo de frequência com histórico de presença diário.
* **📍 Atualização de Endereços Flexível:**
  * Painel para alteração instantânea do **Endereço de Coleta (Ida)** e **Endereço de Entrega (Volta)** através de um modal premium moderno.

---

## 📊 Arquitetura do Sistema

```
Projeto-vantrack/
├── pages/                       # Interface Frontend (HTML)
│   ├── index.html               # Página de Login
│   ├── cadastro-aluno.html      # Registro de Aluno/Pais
│   ├── cadastro-motorista.html  # Registro de Motorista
│   ├── 2fa.html                 # Verificação de Dois Fatores
│   ├── dashboard-aluno.html     # Painel do Aluno / Rastreamento
│   └── dashboard-motorista.html # Painel de Gestão do Motorista
│
├── assets/                      # Estilos e Comportamento
│   ├── css/                     # Estilos Customizados (Modo Premium)
│   └── js/                      # Lógica do Cliente (JS & WebSockets)
│       ├── login.js             # Autenticação e Fluxo 2FA
│       ├── dashboard-aluno.js   # Controle do Perfil e Modal de Endereço
│       ├── realtime-chat-aluno.js# Chat em tempo real (Aluno)
│       ├── realtime-chat.js     # Chat em tempo real (Motorista)
│       └── realtime-rastreamento.js# Conexão GPS com o Leaflet.js
│
├── backend/                     # Servidor Flask & Regras de Negócio
│   ├── app.py                   # Ponto de entrada do aplicativo
│   ├── database.py              # Pool de conexões MySQL
│   ├── domain/                  # Entidades de Domínio (Entidades Dataclass)
│   ├── infra/                   # Repositórios (Acesso ao Banco de Dados)
│   ├── use_cases/               # Casos de Uso (Regras de Negócio)
│   ├── middleware/              # Interceptação de Tokens JWT
│   └── presentation/            # Controladores HTTP (Flask) e WebSockets
│
└── database/
    └── schema.sql               # Estrutura do Banco de Dados (MySQL)
```

---

## 🗄️ Modelo de Dados (Tabelas MySQL)

O sistema possui **10 tabelas relacionais** estruturadas de forma robusta e indexadas para alta performance:

| Tabela | Função | Chave Primária |
| :--- | :--- | :--- |
| **`usuarios`** | Armazena dados de Alunos, Responsáveis e Motoristas | UUID `CHAR(36)` |
| **`sessoes`** | Controla as sessões ativas e dispositivos | UUID `CHAR(36)` |
| **`veiculos`** | Dados das Vans (placa, modelo, capacidade) | UUID `CHAR(36)` |
| **`rotas`** | Cadastro de trajetos, horários e veículos | UUID `CHAR(36)` |
| **`inscricoes`** | Vincula alunos às rotas dos motoristas | UUID `CHAR(36)` |
| **`localizacoes_gps`** | Histórico e posições atuais das Vans | UUID `CHAR(36)` |
| **`enderecos`** | Coleta (Ida) e Entrega (Volta) dos alunos | UUID `CHAR(36)` |
| **`presenca_diaria`** | Frequência diária de embarque (SIM/NÃO) | UUID `CHAR(36)` |
| **`mensagens_chat`** | Histórico de conversas offline e online | UUID `CHAR(36)` |
| **`dois_fatores`** | Códigos e tentativas de verificação 2FA | UUID `CHAR(36)` |

---

## 🔑 Credenciais Padrão para Testes

Para facilitar os testes imediatos do fluxo completo, utilize os usuários padrão cadastrados:

### 👨‍✈️ Perfil Motorista
* **E-mail:** `motorista@teste.com`
* **Senha:** `123456`

### 👨‍🎓 Perfil Aluno
* **E-mail:** `aluno@teste.com`
* **Senha:** `123456`

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
* Python 3.8 ou superior
* MySQL 8.0 ou superior

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/WesleyMota02/Projeto-Vantrack.git
cd Projeto-Vantrack
```

### Passo 2: Configurar o Ambiente Virtual & Instalar Dependências
```bash
# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual (Windows)
.venv\Scripts\activate

# Ativar ambiente virtual (Linux/macOS)
source .venv/bin/activate

# Instalar dependências
pip install -r backend/requirements.txt
```

### Passo 3: Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como referência):
```env
# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=vantrack
DB_PORT=3306

# Segurança JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400
```

### Passo 4: Inicializar o Banco de Dados
Este comando criará o banco de dados `vantrack`, executará todas as tabelas do `schema.sql` e gerará os usuários de teste padrão automaticamente:
```bash
cd backend
python setup_database.py
```

### Passo 5: Iniciar o Servidor Backend
```bash
python app.py
```
O backend estará rodando em: **`http://localhost:5000`**

### Passo 6: Executar o Frontend
Basta abrir os arquivos HTML no navegador. Se preferir rodar sob um servidor estático local (como o `Live Server` do VS Code ou usando `http.server` do Python):
```bash
# Na raiz do projeto, execute:
python -m http.server 3000
```
Acesse no seu navegador: **`http://localhost:3000/pages/index.html`**

---

## 📡 Visão Geral da API (Endpoints Principais)

### Autenticação & 2FA
* `POST /api/cadastro` - Cadastrar novo usuário (motorista ou aluno)
* `POST /api/login` - Autenticação por e-mail e senha (retorna JWT)
* `POST /api/dois-fatores/gerar` - Envia código de segurança para novo dispositivo
* `POST /api/dois-fatores/verificar` - Valida código de segurança 2FA de 6 dígitos
* `POST /api/recuperar-senha` - Recuperação/Alteração de senha

### Painel do Aluno (`/api/dashboard`)
* `GET /api/dashboard/aluno` - Obtém todos os dados da rota, motorista, veículo e endereços
* `POST /api/dashboard/presenca` - Confirma presença diária de embarque (SIM/NÃO)
* `POST /api/dashboard/endereco` - Atualiza os endereços de Coleta e Entrega
* `GET /api/dashboard/mensagens/<motorista_id>` - Recupera histórico de chat com o motorista

### Painel do Motorista (`/api/dashboard`)
* `GET /api/dashboard/motorista` - Carrega as rotas, alunos inscritos e lista de presença do dia

---

## 🧪 Testes Automatizados
O backend conta com uma ampla cobertura de testes unitários e de integração. Para executá-los:
```bash
# Dentro da pasta 'backend' com a venv ativa:
python -m pytest tests/
```

Para rodar o teste de fluxo completo (cadastro → login → 2FA → autenticação de rotas):
```bash
python test_complete_flow.py
```

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Flask, Flask-SocketIO, PyJWT, Bcrypt, MySQL Connector
* **Frontend:** HTML5, CSS3 (Design Moderno & Responsivo), Vanilla JavaScript, Leaflet.js
* **Comunicação:** WebSockets (Socket.io-client), HTTP/JSON API

---

## 📄 Licença
Este projeto é de uso exclusivo para fins educacionais e de demonstração.

**Projeto-Vantrack © 2026. Todos os direitos reservados.**
