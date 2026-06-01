# Funcionalidade de Pagamentos - VanTrack

## 📋 Visão Geral

Sistema completo de gerenciamento de pagamentos para alunos com possibilidade de visualização e controle por motoristas.

## 🎯 Funcionalidades

### Para Alunos:
- ✅ Visualizar todos os seus pagamentos
- ✅ Ver status de cada pagamento (Pago, Pendente, Atrasado)
- ✅ Efetuar pagamentos através de modal interativo
- ✅ Escolher método de pagamento (Dinheiro, PIX, Cartão)
- ✅ Acompanhar histórico de pagamentos

### Para Motoristas:
- ✅ Visualizar status de pagamento de todos os alunos
- ✅ Filtrar alunos por status de pagamento
- ✅ Ver resumo geral de pagamentos
- ✅ Acessar detalhes de pagamento por aluno
- ✅ Dashboard com indicadores visuais

## 📊 Banco de Dados

### Tabela: pagamentos
```sql
CREATE TABLE pagamentos (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  motorista_id CHAR(36) NOT NULL,
  rota_id CHAR(36) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  mes_referencia INT NOT NULL,
  ano_referencia INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  data_pagamento DATETIME NULL,
  metodo_pagamento VARCHAR(50),
  descricao VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(aluno_id, motorista_id, rota_id, mes_referencia, ano_referencia)
);
```

### Status Possíveis:
- **pendente**: Pagamento não realizado e dentro do prazo
- **pago**: Pagamento já realizado
- **atrasado**: Pagamento não realizado e vencido
- **cancelado**: Pagamento cancelado

## 🔌 API REST

### Endpoints de Pagamentos

#### Criar Pagamento (Admin/Motorista)
```
POST /api/pagamentos/criar
Authorization: Bearer {token}

Body:
{
  "aluno_id": "uuid",
  "motorista_id": "uuid",
  "rota_id": "uuid",
  "valor": 150.00,
  "mes_referencia": 5,
  "ano_referencia": 2026,
  "data_vencimento": "2026-05-10",
  "descricao": "Mensalidade de Maio"
}
```

#### Obter Pagamentos do Aluno
```
GET /api/pagamentos/aluno/{aluno_id}
Authorization: Bearer {token}

Response:
{
  "sucesso": true,
  "pagamentos": [
    {
      "id": "uuid",
      "aluno_id": "uuid",
      "motorista_id": "uuid",
      "valor": 150.00,
      "mes_referencia": 5,
      "status": "pendente",
      "data_vencimento": "2026-05-10",
      "motorista_nome": "João Silva",
      "motorista_email": "joao@email.com"
    }
  ],
  "resumo": {
    "total_pagamentos": 3,
    "total_pago": 300.00,
    "total_pendente": 150.00,
    "total_atrasado": 0,
    "qtd_pago": 2,
    "qtd_pendente": 1,
    "qtd_atrasado": 0
  }
}
```

#### Obter Pagamentos do Motorista
```
GET /api/pagamentos/motorista/{motorista_id}
Authorization: Bearer {token}

Response:
{
  "sucesso": true,
  "pagamentos": [...],
  "resumo": {...}
}
```

#### Obter Alunos com Status de Pagamentos
```
GET /api/pagamentos/motorista/{motorista_id}/alunos
Authorization: Bearer {token}

Query Parameters:
- mes: INT (opcional)
- ano: INT (opcional)

Response:
{
  "sucesso": true,
  "alunos": [
    {
      "id": "uuid",
      "nome": "Maria Silva",
      "email": "maria@email.com",
      "pagos": 2,
      "pendentes": 1,
      "atrasados": 0,
      "total_pendente": 150.00,
      "proxima_vencimento": "2026-06-10"
    }
  ]
}
```

#### Pagar Pagamento
```
PUT /api/pagamentos/{pagamento_id}/pagar
Authorization: Bearer {token}

Body:
{
  "metodo_pagamento": "pix"
}

Response:
{
  "sucesso": true,
  "pagamento": {...},
  "mensagem": "Pagamento realizado com sucesso"
}
```

#### Atualizar Pagamento
```
PUT /api/pagamentos/{pagamento_id}/atualizar
Authorization: Bearer {token}

Body:
{
  "status": "pago",
  "valor": 160.00
}
```

#### Deletar Pagamento (Admin)
```
DELETE /api/pagamentos/{pagamento_id}
Authorization: Bearer {token}
```

## 🎨 Interface do Usuário

### Dashboard do Aluno - Seção Pagamentos
- **Tabela de Pagamentos**: Lista todos os pagamentos com status visual
- **Modal de Pagamento**: Permite realizar pagamento com método selecionável
- **Métodos Disponíveis**: Dinheiro, PIX, Cartão de Crédito, Cartão de Débito

### Dashboard do Motorista - Seção Pagamentos
- **Resumo de Pagamentos**: 
  - Total de alunos
  - Alunos em dia
  - Alunos com pendência
  - Alunos com atraso
- **Tabela de Alunos**:
  - Lista completa de alunos
  - Status de pagamento por aluno
  - Ações para ver detalhes
- **Modal de Detalhes**: 
  - Histórico de pagamentos do aluno
  - Resumo visual (pago, pendente, atrasado)
  - Método de pagamento utilizado

## 🚀 Como Usar

### 1. Inicializar o Banco de Dados
```bash
cd backend
python setup_pagamentos.py
```

### 2. Dashboard do Aluno - Efetuar Pagamento
1. Clique em "Pagamentos" no menu lateral
2. Localize o pagamento pendente na tabela
3. Clique em "Pagar Agora"
4. Selecione o método de pagamento
5. Clique em "Confirmar Pagamento"

### 3. Dashboard do Motorista - Ver Pagamentos
1. Clique em "Pagamentos" no menu lateral (adicionado automaticamente)
2. Visualize o resumo de pagamentos
3. Filtre por status se necessário
4. Clique em "Ver Detalhes" para mais informações de um aluno específico

## 🔐 Segurança

- ✅ Autenticação de token obrigatória
- ✅ Alunos só veem seus próprios pagamentos
- ✅ Motoristas só veem pagamentos de seus alunos
- ✅ Apenas admin pode deletar pagamentos
- ✅ Validação de permissões em todas as rotas

## 📁 Arquivos Criados/Modificados

### Backend:
- `backend/domain/pagamento.py` - Entidade de domínio
- `backend/infra/pagamento_repository.py` - Repositório de dados
- `backend/presentation/routes/pagamento_routes.py` - Rotas API
- `backend/setup_pagamentos.py` - Script de inicialização
- `backend/app.py` - Registro de rotas (modificado)
- `database/schema.sql` - Tabela de pagamentos (adicionado)

### Frontend:
- `pages/dashboard-aluno.html` - Menu e seção (modificado)
- `pages/dashboard-motorista.html` - Script (modificado)
- `assets/js/pagamentos-aluno.js` - Gerenciador para alunos
- `assets/js/pagamentos-motorista.js` - Gerenciador para motoristas

## 🎓 Exemplo de Fluxo

1. **Admin cria pagamentos** via API para alunos
2. **Aluno visualiza** pagamentos no dashboard
3. **Aluno efetua pagamento** selecionando método
4. **Sistema atualiza** status para "pago"
5. **Motorista visualiza** que aluno está em dia
6. **Motorista pode filtrar** alunos que ainda não pagaram

## 📞 Suporte

Para adicionar novas funcionalidades de pagamento:
1. Adicionar nova rota em `pagamento_routes.py`
2. Adicionar método no `PagamentoRepository`
3. Atualizar scripts de frontend conforme necessário
